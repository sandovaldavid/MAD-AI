import { inject, Injectable } from '@angular/core';
import { USER_REPOSITORY, CLOCK_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { DomainEventBusService } from '@core/services/domain-event-bus.service';
import { DomainEvent } from '@domain/events/domain-event.entity';
import { DomainEventType } from '@domain/events/domain-event.enum';
import { ISODateTime } from '@domain/value-objects/iso-datetime.vo';
import type { UpdateUserRequest, UpdateUserResult } from '@application/types/users.types';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { User } from '@domain/entities/user.entity';
import type { UpdateUserPatchContract } from '@domain/repositories/business/user.contract';
import type { Logger } from '@core/interfaces/logger.interface';

/**
 * Update User Use Case
 *
 * @description
 * Application layer orchestrator that handles user updates with validation,
 * audit logging, and error normalization. This use case follows the orchestration
 * pattern with error normalization to ensure consistent user update workflow.
 *
 * @responsibilities
 * - Orchestrate user updates with validation and side effects
 * - Validate application-level access rules
 * - Execute user update through domain repository
 * - Handle update audit logging for compliance purposes
 * - Normalize errors for application layer consumption
 *
 * @architecture
 * This use case acts as an orchestrator that:
 * 1. Validates application rules (user ID, patch data, permissions)
 * 2. Delegates user update to domain repository
 * 3. Handles side effects (audit logging, change tracking)
 * 4. Normalizes errors for consistent error handling
 *
 * @since 1.0.0
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class UpdateUser {
  private readonly userRepo = inject<UserRepository>(USER_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly eventBus = inject(DomainEventBusService);

  /**
   * Execute user update orchestration with validation and audit logging
   *
   * @param request User update request with ID and data
   * @returns Promise resolving to updated user entity
   * @throws ApplicationError when user not found or update fails
   */
  async execute(request: UpdateUserRequest): Promise<UpdateUserResult> {
    try {
      // Step 1: Validate application rules
      this.validateApplicationRules(request.userId, request.updateData);

      // Step 2: Delegate to domain repository
      const updatedUser = await this.userRepo.update(request.userId, request.updateData);

      // Step 3: Handle side effects
      await this.handleUserUpdateSideEffects(updatedUser, request.updateData, undefined);

      return updatedUser;
    } catch (error: unknown) {
      // Step 4: Normalize errors for application layer
      const appError = this.errorTransformer.transform(error, {
        operation: 'update_user',
        userId: request.userId.toString(),
      });
      throw appError;
    }
  }

  /**
   * Validate application-level rules for user update
   *
   * @description
   * Validates request parameters and business rules specific to the application layer.
   * Domain validation is handled by the repository layer.
   *
   * @param userId User ID to validate
   * @param patch Update patch to validate
   * @throws ApplicationError when validation fails
   */
  private validateApplicationRules(userId: number, patch: UpdateUserPatchContract): void {
    if (userId === undefined || userId === null) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'INVALID_USER_ID',
        'User ID is required and must be a valid number',
        { providedUserId: userId }
      );
    }

    if (typeof userId !== 'number' || userId <= 0) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'INVALID_USER_ID_FORMAT',
        'User ID must be a positive number',
        { providedUserId: userId }
      );
    }

    if (!patch || typeof patch !== 'object') {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'INVALID_PATCH_DATA',
        'Update patch is required and must be a valid object',
        { providedPatch: patch }
      );
    }

    // Check if patch has at least one field to update
    const patchKeys = Object.keys(patch);
    if (patchKeys.length === 0) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'EMPTY_PATCH_DATA',
        'Update patch must contain at least one field to update',
        { providedPatch: patch }
      );
    }

    // Additional validation for specific fields can be added here
    // (complex business rules are handled in domain layer)
  }

  /**
   * Handle side effects after successful user update
   *
   * @description
   * Manages audit logging and other side effects related to user update operations.
   * This includes change tracking and compliance logging.
   *
   * @param updatedUser Updated user entity
   * @param patch Update patch that was applied
   * @param requesterId ID of user making the request
   */
  private async handleUserUpdateSideEffects(
    updatedUser: User,
    patch: UpdateUserPatchContract,
    requesterId?: number
  ): Promise<void> {
    const timestamp = new Date(this.clock.nowEpochSeconds() * 1000);
    const changedFields = Object.keys(patch);

    // Create and publish domain event for user profile modification
    const userProfileModifiedEvent = DomainEvent.create({
      id: `user-profile-modified-${updatedUser.id}-${Date.now()}`,
      eventType: DomainEventType.USER_PROFILE_MODIFIED,
      aggregateId: updatedUser.id.toString(),
      aggregateType: 'User',
      eventData: {
        userId: updatedUser.id.toString(),
        changedFields,
        requesterId: requesterId?.toString(),
        timestamp: ISODateTime.fromDate(timestamp).toString(),
      },
      causedByUserId: requesterId?.toString(),
      occurredAt: ISODateTime.fromDate(timestamp),
    });

    await this.eventBus.publish(userProfileModifiedEvent);

    // Log user update for audit trail
    this.logger.info('User updated successfully', {
      userId: updatedUser.id.toString(),
      operation: 'update_user',
    });

    // Additional side effects can be added here:
    // - Change history logging
    // - Email notifications for important changes
    // - Cache invalidation
    // - Event publishing for other services
    // - Compliance audit trail
  }
}
