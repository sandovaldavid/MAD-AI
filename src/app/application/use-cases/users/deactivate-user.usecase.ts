import { inject, Injectable } from '@angular/core';
import { USER_REPOSITORY, CLOCK_PORT } from '../../../di/tokens';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import { ApplicationError } from '../../errors/application-error';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { DomainEventProcessor } from '@application/services/domain-event-processor.service';

/**
 * Deactivate User Use Case
 *
 * @description
 * Application layer orchestrator that handles user deactivation with validation,
 * audit logging, and error normalization. This use case follows the orchestration
 * pattern with enhanced validation to prevent self-deactivation and maintain audit trails.
 *
 * @responsibilities
 * - Validate application-level rules for user deactivation
 * - Delegate to domain repository for the actual deactivation
 * - Handle audit logging and side effects
 * - Normalize errors for consistent application layer handling
 *
 * @architecture
 * - Application Layer orchestrator
 * - Uses domain repository through dependency injection
 * - Integrates with system clock for precise timestamping
 * - Follows 4-step orchestration pattern
 *
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class DeactivateUser {
  private readonly userRepo = inject<UserRepository>(USER_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);
  private readonly eventProcessor = inject(DomainEventProcessor);

  /**
   * Execute user deactivation orchestration with validation and audit logging
   *
   * @param userId - ID of the user to deactivate
   * @param requesterId - ID of the user making the request (for audit logging)
   * @param reason - Optional reason for deactivation (for audit trail)
   * @returns Promise resolving when deactivation is complete
   * @throws ApplicationError when user not found or deactivation fails
   */
  async execute(userId: number, requesterId?: number, reason?: string): Promise<void> {
    try {
      // Step 1: Validate application rules
      this.validateApplicationRules(userId, requesterId);

      // Step 2: Delegate to domain repository
      await this.userRepo.deactivate(userId);

      // Step 3: Get the deactivated user for event processing
      const deactivatedUser = await this.userRepo.getById(userId);

      // Step 4: Handle side effects
      await this.handleUserDeactivationSideEffects(deactivatedUser, requesterId, reason);
    } catch (error: unknown) {
      // Step 4: Normalize errors for application layer
      throw new ApplicationError(
        'deactivate_user',
        this.errorTransformer.transformError(error),
        'USER_DEACTIVATION_FAILED'
      );
    }
  }

  /**
   * Validate application-level rules for user deactivation
   *
   * @description
   * Validates request parameters and business rules specific to the application layer.
   * Includes enhanced validation for self-deactivation prevention.
   * Domain validation is handled by the repository layer.
   *
   * @param userId User ID to validate
   * @param requesterId ID of user making the request
   * @throws ApplicationError when validation fails
   */
  private validateApplicationRules(userId: number, requesterId?: number): void {
    if (userId === undefined || userId === null) {
      throw new ApplicationError(
        'deactivate_user',
        'INVALID_USER_ID',
        'User ID is required for deactivation'
      );
    }

    if (typeof userId !== 'number' || userId <= 0) {
      throw new ApplicationError(
        'deactivate_user',
        'INVALID_USER_ID_FORMAT',
        'User ID must be a positive number'
      );
    }

    // Enhanced self-deactivation prevention
    if (requesterId && requesterId === userId) {
      throw new ApplicationError(
        'deactivate_user',
        'SELF_DEACTIVATION_NOT_ALLOWED',
        'Users cannot deactivate their own account for security reasons'
      );
    }
  }

  /**
   * Handle side effects for successful user deactivation
   *
   * @param deactivatedUser The deactivated user entity
   * @param requesterId ID of user who performed the deactivation
   * @param reason Optional reason for the deactivation
   */
  private async handleUserDeactivationSideEffects(
    deactivatedUser: any,
    requesterId?: number,
    reason?: string
  ): Promise<void> {
    // Process domain events from the deactivated user entity
    await this.eventProcessor.processEntityEvents(deactivatedUser);

    const timestamp = this.clock.nowEpochSeconds();

    // Enhanced audit logging for user deactivation
    console.log(`[AUDIT] User deactivation completed`, {
      timestamp,
      userId: deactivatedUser.id,
      requesterId,
      reason,
      operation: 'user_deactivation',
    });
  }
}
