import { inject, Injectable } from '@angular/core';
import { USER_REPOSITORY, CLOCK_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { DomainEventBusService } from '@core/services/domain-event-bus.service';
import { DomainEvent } from '@domain/events/domain-event.entity';
import { DomainEventType } from '@domain/events/domain-event.enum';
import { ISODateTime } from '@domain/value-objects/iso-datetime.vo';
import type { DeleteUserRequest, DeleteUserResult } from '@application/types/users.types';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Logger } from '@core/interfaces/logger.interface';

/**
 * Delete User Use Case
 *
 * @description
 * Application layer orchestrator that handles user deletion with validation,
 * audit logging, and error normalization. This use case follows the orchestration
 * pattern with error normalization to ensure consistent user deletion workflow.
 *
 * @responsibilities
 * - Orchestrate user deletion with validation and side effects
 * - Validate application-level access rules
 * - Execute user deletion through domain repository
 * - Handle deletion audit logging for compliance purposes
 * - Normalize errors for application layer consumption
 *
 * @architecture
 * This use case acts as an orchestrator that:
 * 1. Validates application rules (user ID, deletion permissions)
 * 2. Delegates user deletion to domain repository
 * 3. Handles side effects (audit logging, cleanup notifications)
 * 4. Normalizes errors for consistent error handling
 *
 * @since 1.0.0
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class DeleteUser {
  private readonly userRepo = inject<UserRepository>(USER_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);
  private readonly eventBus = inject(DomainEventBusService);

  /**
   * Execute user deletion orchestration with validation and audit logging
   *
   * @param request User deletion request with ID
   * @returns Promise resolving to deletion result
   * @throws ApplicationError when user not found or deletion fails
   */
  async execute(request: DeleteUserRequest): Promise<DeleteUserResult> {
    try {
      this.logger.info('Delete Use Case - Starting execution');
      // Step 1: Validate application rules
      this.validateApplicationRules(request.userId, undefined);
      this.logger.info('Application use case - Validation complete');
      this.logger.info('Delete Use Case');

      // Step 2: Delegate to domain repository
      await this.userRepo.delete(request.userId);

      // Step 3: Handle side effects
      this.handleUserDeletionSideEffects(request.userId, undefined);

      return {
        success: true,
        userId: request.userId,
      };
    } catch (error: unknown) {
      // Step 4: Normalize errors for application layer
      const appError = this.errorTransformer.transform(error, {
        operation: 'delete_user',
      });
      throw appError;
    }
  }

  /**
   * Validate application-level rules for user deletion
   *
   * @description
   * Validates request parameters and business rules specific to the application layer.
   * Domain validation is handled by the repository layer.
   *
   * @param userId User ID to validate
   * @param requesterId ID of user making the request
   * @throws ApplicationError when validation fails
   */
  private validateApplicationRules(userId: number, requesterId?: number): void {
    this.logger.info('Delete Use Case - Validating application rules');
    this.logger.info(`userId: ${userId} - requesterId: ${requesterId}`);
    if (userId === undefined || userId === null) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'User ID is required and must be a valid number',
        'User ID is required and must be a valid number',
        { providedUserId: userId }
      );
    }

    if (typeof userId !== 'number' || userId <= 0) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'User ID must be a positive number',
        'User ID must be a positive number',
        { providedUserId: userId }
      );
    }

    // Prevent self-deletion (basic application-level rule)
    if (requesterId && userId === requesterId) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Users cannot delete their own account through this operation',
        'Users cannot delete their own account through this operation',
        {
          userId,
          requesterId,
          suggestion: 'Use account deactivation instead',
        }
      );
    }
  }

  /**
   * Handle side effects after successful user deletion
   *
   * @description
   * Manages audit logging and other side effects related to user deletion operations.
   * This includes compliance logging and cleanup notifications.
   *
   * @param deletedUserId ID of the deleted user
   * @param requesterId ID of user making the request
   */
  private async handleUserDeletionSideEffects(
    deletedUserId: number,
    requesterId?: number
  ): Promise<void> {
    const timestamp = new Date(this.clock.nowEpochSeconds() * 1000);

    // Create and publish UserAccountDeactivated domain event (deletion is a form of deactivation)
    const userDeletedEvent = DomainEvent.create({
      id: `user-deleted-${deletedUserId}-${Date.now()}`,
      eventType: DomainEventType.USER_ACCOUNT_DEACTIVATED,
      aggregateId: deletedUserId.toString(),
      aggregateType: 'User',
      eventData: {
        userId: deletedUserId.toString(),
        requesterId: requesterId?.toString(),
        deletedAt: ISODateTime.fromDate(timestamp).toString(),
        deletionType: 'permanent',
      },
      causedByUserId: requesterId?.toString(),
      occurredAt: ISODateTime.fromDate(timestamp),
    });

    await this.eventBus.publish(userDeletedEvent);

    // Log user deletion for audit trail
    this.logger.info(`User successfully deleted: ${deletedUserId} by ${requesterId || 'system'}`);

    // Additional side effects can be added here:
    // - Send notification to administrators
    // - Clean up user-related cache entries
    // - Trigger data cleanup jobs
    // - Log to external audit systems
    // - Update user metrics and analytics
  }
}
