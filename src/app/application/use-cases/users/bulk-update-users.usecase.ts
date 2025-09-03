import { Injectable, inject } from '@angular/core';
import { USER_REPOSITORY, CLOCK_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import { DomainEventBusService } from '@core/services/domain-event-bus.service';
import { DomainEvent } from '@domain/events/domain-event.entity';
import { DomainEventType } from '@domain/events/domain-event.enum';
import { ISODateTime } from '@domain/value-objects/iso-datetime.vo';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { BulkUpdateUsersRequest, BulkUpdateUsersResult } from '@application/types/users.types';
import type { User } from '@domain/entities/user.entity';
import type { UpdateUserPatchContract } from '@domain/repositories/business/user.contract';
import type { Logger } from '@core/interfaces/logger.interface';

/**
 * Bulk Update Users Use Case
 *
 * @description
 * Application layer orchestrator that handles bulk user updates with validation,
 * batch processing, audit logging, and error normalization. This use case follows
 * the orchestration pattern with iterative processing since repository lacks bulk methods.
 *
 * @responsibilities
 * - Validate application-level rules for bulk user updates
 * - Process updates in batches with individual repository calls
 * - Handle comprehensive audit logging and side effects
 * - Normalize errors for consistent application layer handling
 *
 * @architecture
 * - Application Layer orchestrator
 * - Uses domain repository through dependency injection
 * - Integrates with system clock for precise timestamping
 * - Follows 4-step orchestration pattern with batch processing
 *
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class BulkUpdateUsers {
  private readonly userRepository = inject<UserRepository>(USER_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);
  private readonly eventBus = inject(DomainEventBusService);

  async execute(request: BulkUpdateUsersRequest): Promise<BulkUpdateUsersResult> {
    try {
      // Step 1: Validate application-level rules
      this.validateApplicationRules(request);

      // Step 2: Fetch domain data
      const operationTimestamp = this.clock.nowEpochSeconds();

      // Step 3: Execute core business operation
      const results = await this.updateUsersInBatch(request);

      // Step 4: Handle side effects
      await this.handleBulkUpdateSideEffects(request, results, operationTimestamp);

      return results;
    } catch (error: unknown) {
      // Step 4: Normalize errors for application layer
      const appError = this.errorTransformer.transform(error, {
        operation: 'bulk_update_users',
      });
      throw appError;
    }
  }

  private validateApplicationRules(request: BulkUpdateUsersRequest): void {
    if (!request.updates || request.updates.length === 0) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Update data is required for bulk updates',
        'Update data is required for bulk updates',
        { updates: request.updates }
      );
    }

    if (request.updates.length > 50) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Cannot update more than 50 users at once',
        'Cannot update more than 50 users at once',
        { count: request.updates.length }
      );
    }

    // Check for duplicate user IDs in the batch
    const userIds = request.updates.map((update) => update.userId);
    const uniqueIds = new Set(userIds);
    if (uniqueIds.size !== userIds.length) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Duplicate user IDs detected in bulk update request',
        'Duplicate user IDs detected in bulk update request',
        { userIds }
      );
    }

    // Validate each update has at least one field to update
    for (const update of request.updates) {
      const hasUpdatableFields = Object.keys(update.updateData).some(
        (key) => update.updateData[key as keyof typeof update.updateData] !== undefined
      );

      if (!hasUpdatableFields) {
        throw new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          `No updatable fields provided for user ID ${update.userId}`,
          `No updatable fields provided for user ID ${update.userId}`,
          { userId: update.userId }
        );
      }
    }
  }

  private async updateUsersInBatch(
    request: BulkUpdateUsersRequest
  ): Promise<BulkUpdateUsersResult> {
    const updated: User[] = [];
    const failed: {
      userId: number;
      updateData: UpdateUserPatchContract;
      error: string;
    }[] = [];

    for (const updateData of request.updates) {
      try {
        // Use individual repository calls since no bulk method exists
        const user = await this.userRepository.update(updateData.userId, updateData.updateData);

        updated.push(user);
      } catch (error: unknown) {
        failed.push({
          userId: updateData.userId,
          updateData: updateData.updateData,
          error: error instanceof Error ? error.message : 'Unknown error during user update',
        });
      }
    }

    return {
      updated,
      failed,
      totalProcessed: request.updates.length,
      successCount: updated.length,
      failureCount: failed.length,
    };
  }

  private async handleBulkUpdateSideEffects(
    request: BulkUpdateUsersRequest,
    results: BulkUpdateUsersResult,
    operationTimestamp: number
  ): Promise<void> {
    // Process domain events for all successfully updated users
    const successfulUsers = results.updated;

    // Publish domain events for successful user updates
    for (const user of successfulUsers) {
      // Find the corresponding update request to get the changed fields
      const updateRequest = request.updates.find((update) => update.userId === user.id);
      const changedFields = updateRequest
        ? Object.keys(updateRequest.updateData).filter(
            (key) =>
              updateRequest.updateData[key as keyof typeof updateRequest.updateData] !== undefined
          )
        : [];

      const userUpdatedEvent = DomainEvent.create({
        id: `bulk-user-updated-${user.id}-${Date.now()}`,
        eventType: DomainEventType.USER_PROFILE_MODIFIED,
        aggregateId: user.id.toString(),
        aggregateType: 'User',
        eventData: {
          userId: user.id.toString(),
          changedFields,
          requesterId: request.requesterId?.toString(),
          updatedAt: ISODateTime.fromDate(new Date(operationTimestamp * 1000)).toString(),
          bulkOperation: true,
        },
        causedByUserId: request.requesterId?.toString(),
        occurredAt: ISODateTime.fromDate(new Date(operationTimestamp * 1000)),
      });

      await this.eventBus.publish(userUpdatedEvent);
    }

    this.logger.info(
      `Bulk user update completed: ${results.successCount} successful, ${results.failureCount} failed`
    );
  }
}
