import { Injectable, inject } from '@angular/core';
import { USER_REPOSITORY, CLOCK_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { DomainEventBusService } from '@core/services/domain-event-bus.service';
import { DomainEvent } from '@domain/events/domain-event.entity';
import { DomainEventType } from '@domain/events/domain-event.enum';
import { ISODateTime } from '@domain/value-objects/iso-datetime.vo';
import type { BulkCreateUsersRequest, BulkCreateUsersResult } from '@application/types/users.types';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { CreateUserContract } from '@/app/domain/repositories/business/user.contract';
import type { User } from '@domain/entities/user.entity';
import type { Logger } from '@core/interfaces/logger.interface';

/**
 * Bulk Create Users Use Case
 *
 * @description
 * Application layer orchestrator that handles bulk user creation with validation,
 * batch processing, audit logging, and error normalization. This use case follows
 * the orchestration pattern with iterative processing since repository lacks bulk methods.
 *
 * @responsibilities
 * - Validate application-level rules for bulk user creation
 * - Process users in batches with individual repository calls
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
export class BulkCreateUsers {
  private readonly userRepository = inject<UserRepository>(USER_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly eventBus = inject(DomainEventBusService);

  async execute(request: BulkCreateUsersRequest): Promise<BulkCreateUsersResult> {
    try {
      // Step 1: Validate application-level rules
      this.validateApplicationRules(request);

      // Step 2: Fetch domain data
      const operationTimestamp = this.clock.nowEpochSeconds();

      // Step 3: Execute core business operation
      const results = await this.createUsersInBatch(request);

      // Step 4: Handle side effects
      await this.handleBulkCreationSideEffects(request, results, operationTimestamp);

      return results;
    } catch (error: unknown) {
      throw new ApplicationError(
        ApplicationErrorCode.UNEXPECTED_ERROR,
        this.errorTransformer.transform(error, {
          operation: 'bulk_create_users',
          userId: request.createdBy?.toString(),
        }).userMessage,
        'Bulk user creation failed'
      );
    }
  }

  private validateApplicationRules(request: BulkCreateUsersRequest): void {
    if (!request.usersData || request.usersData.length === 0) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'No users provided for bulk creation',
        'No users provided for bulk creation'
      );
    }

    if (request.usersData.length > 100) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Cannot create more than 100 users at once',
        'Cannot create more than 100 users at once'
      );
    }

    // Check for duplicate emails within the batch
    const emails = request.usersData.map((user) => user.email.toLowerCase());
    const uniqueEmails = new Set(emails);
    if (emails.length !== uniqueEmails.size) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Duplicate emails found in the batch',
        'Duplicate emails found in the batch'
      );
    }
  }

  private async createUsersInBatch(
    request: BulkCreateUsersRequest
  ): Promise<BulkCreateUsersResult> {
    const created: User[] = [];
    const failed: {
      data: CreateUserContract;
      error: string;
    }[] = [];

    for (const userData of request.usersData) {
      try {
        // Use individual repository calls since no bulk method exists
        const user = await this.userRepository.create(userData);
        created.push(user);
      } catch (error: unknown) {
        failed.push({
          data: userData,
          error: error instanceof Error ? error.message : 'Unknown error during user creation',
        });
      }
    }

    return {
      created,
      failed,
      totalProcessed: request.usersData.length,
      successCount: created.length,
      failureCount: failed.length,
    };
  }

  private async handleBulkCreationSideEffects(
    request: BulkCreateUsersRequest,
    results: BulkCreateUsersResult,
    operationTimestamp: number
  ): Promise<void> {
    // Publish domain events for successful user creations
    for (const user of results.created) {
      const userCreatedEvent = DomainEvent.create({
        id: `bulk-user-created-${user.id}-${Date.now()}`,
        eventType: DomainEventType.USER_CREATED,
        aggregateId: user.id.toString(),
        aggregateType: 'User',
        eventData: {
          userId: user.id,
          email: user.email.value,
          username: user.username.value,
          roleId: user.getRole.id,
          createdBy: request.createdBy?.toString(),
          createdAt: user.createdAt?.toString(),
          bulkOperation: true,
        },
        causedByUserId: request.createdBy?.toString(),
        occurredAt: ISODateTime.fromDate(new Date(operationTimestamp * 1000)),
      });

      await this.eventBus.publish(userCreatedEvent);
    }

    this.logger.info('Bulk user creation completed', {
      operation: 'bulk_create_users',
    });
  }
}
