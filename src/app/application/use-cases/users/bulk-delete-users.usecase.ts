import { Injectable, inject } from '@angular/core';
import { USER_REPOSITORY, CLOCK_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import { DomainEventBusService } from '@core/services/domain-event-bus.service';
import { DomainEvent } from '@domain/events/domain-event.entity';
import { DomainEventType } from '@domain/events/domain-event.enum';
import { ISODateTime } from '@domain/value-objects/iso-datetime.vo';
import type { BulkDeleteUsersRequest, BulkDeleteUsersResult } from '@application/types/users.types';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Logger } from '@core/interfaces/logger.interface';

@Injectable({ providedIn: 'root' })
export class BulkDeleteUsers {
  private readonly userRepository = inject<UserRepository>(USER_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);
  private readonly eventBus = inject(DomainEventBusService);

  async execute(request: BulkDeleteUsersRequest): Promise<BulkDeleteUsersResult> {
    try {
      // Step 1: Validate application-level rules
      this.validateApplicationRules(request);

      // Step 2: Fetch domain data
      const operationTimestamp = this.clock.nowEpochSeconds();

      // Step 3: Execute core business operation
      const results = await this.deleteUsersInBatch(request);

      // Step 4: Handle side effects
      await this.handleBulkDeletionSideEffects(request, results, operationTimestamp);

      return results;
    } catch (error: unknown) {
      // Step 4: Normalize errors for application layer
      const appError = this.errorTransformer.transform(error, {
        operation: 'bulk_delete_users',
      });
      throw appError;
    }
  }

  private validateApplicationRules(request: BulkDeleteUsersRequest): void {
    if (!request.userIds || request.userIds.length === 0) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'User IDs are required for bulk deletion',
        'User IDs are required for bulk deletion',
        { userIds: request.userIds }
      );
    }

    if (request.userIds.length > 50) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Cannot delete more than 50 users at once',
        'Cannot delete more than 50 users at once',
        { count: request.userIds.length }
      );
    }

    // Check for self-deletion
    if (request.userIds.includes(request.requesterId || 0)) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Cannot delete your own user account',
        'Cannot delete your own user account',
        { requesterId: request.requesterId }
      );
    }

    // Check for duplicates
    const uniqueIds = new Set(request.userIds);
    if (uniqueIds.size !== request.userIds.length) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Duplicate user IDs detected in deletion request',
        'Duplicate user IDs detected in deletion request',
        { userIds: request.userIds }
      );
    }
  }

  private async deleteUsersInBatch(
    request: BulkDeleteUsersRequest
  ): Promise<BulkDeleteUsersResult> {
    const deleted: number[] = [];
    const failed: {
      userId: number;
      error: string;
    }[] = [];

    for (const userId of request.userIds) {
      try {
        // Check if user exists before attempting deletion
        const user = await this.userRepository.getById(userId);
        if (!user) {
          failed.push({
            userId,
            error: 'User not found',
          });
          continue;
        }

        // Perform deletion
        await this.userRepository.delete(userId);
        deleted.push(userId);
      } catch (error: unknown) {
        failed.push({
          userId,
          error: error instanceof Error ? error.message : 'Unknown error during deletion',
        });
      }
    }

    return {
      deleted,
      failed,
      totalProcessed: request.userIds.length,
      successCount: deleted.length,
      failureCount: failed.length,
    };
  }

  private async handleBulkDeletionSideEffects(
    request: BulkDeleteUsersRequest,
    results: BulkDeleteUsersResult,
    operationTimestamp: number
  ): Promise<void> {
    // Publish domain events for successful user deletions
    for (const userId of results.deleted) {
      const userDeletedEvent = DomainEvent.create({
        id: `bulk-user-deleted-${userId}-${Date.now()}`,
        eventType: DomainEventType.USER_ACCOUNT_DEACTIVATED,
        aggregateId: userId.toString(),
        aggregateType: 'User',
        eventData: {
          userId: userId.toString(),
          requesterId: request.requesterId?.toString(),
          deletedAt: ISODateTime.fromDate(new Date(operationTimestamp * 1000)).toString(),
          deletionType: 'permanent',
          bulkOperation: true,
        },
        causedByUserId: request.requesterId?.toString(),
        occurredAt: ISODateTime.fromDate(new Date(operationTimestamp * 1000)),
      });

      await this.eventBus.publish(userDeletedEvent);
    }

    this.logger.info(
      `Bulk user deletion completed: ${results.successCount} successful, ${results.failureCount} failed`
    );
  }
}
