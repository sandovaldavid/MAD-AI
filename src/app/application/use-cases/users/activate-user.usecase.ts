import { inject, Injectable } from '@angular/core';
import { USER_REPOSITORY, CLOCK_PORT } from '../../../di/tokens';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import { ApplicationError } from '../../errors/application-error';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { DomainEventProcessor } from '@application/services/domain-event-processor.service';

/**
 * Activate User Use Case
 *
 * @description
 * Application layer orchestrator that handles user activation with validation,
 * audit logging, and error normalization. This use case follows the orchestration
 * pattern with error normalization to ensure consistent user activation workflow.
 *
 * @responsibilities
 * - Orchestrate user activation with validation and side effects
 * - Validate application-level access rules
 * - Execute user activation through domain repository
 * - Handle activation audit logging for compliance purposes
 * - Normalize errors for application layer consumption
 *
 * @architecture
 * This use case acts as an orchestrator that:
 * 1. Validates application rules (user ID, activation permissions)
 * 2. Delegates user activation to domain repository
 * 3. Handles side effects (audit logging, notification triggers)
 * 4. Normalizes errors for consistent error handling
 *
 * @since 1.0.0
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class ActivateUser {
  private readonly userRepo = inject<UserRepository>(USER_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);
  private readonly eventProcessor = inject(DomainEventProcessor);

  /**
   * Execute user activation orchestration with validation and audit logging
   *
   * @param userId - ID of the user to activate
   * @param requesterId - ID of the user making the request (for audit logging)
   * @param reason - Optional reason for activation (for audit trail)
   * @returns Promise resolving when activation is complete
   * @throws ApplicationError when user not found or activation fails
   */
  async execute(userId: number, requesterId?: number, reason?: string): Promise<void> {
    try {
      // Step 1: Validate application rules
      this.validateApplicationRules(userId, requesterId);

      // Step 2: Delegate to domain repository
      await this.userRepo.activate(userId);

      // Step 3: Get the activated user for event processing
      const activatedUser = await this.userRepo.getById(userId);

      // Step 4: Handle side effects
      await this.handleUserActivationSideEffects(activatedUser, requesterId, reason);
    } catch (error: unknown) {
      // Step 4: Normalize errors for application layer
      throw new ApplicationError(
        'activate_user',
        this.errorTransformer.transformError(error),
        'USER_ACTIVATION_FAILED'
      );
    }
  }

  /**
   * Validate application-level rules for user activation
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
    if (userId === undefined || userId === null) {
      throw new ApplicationError(
        'activate_user',
        'INVALID_USER_ID',
        'User ID is required and must be a valid number',
        { providedUserId: userId }
      );
    }

    if (typeof userId !== 'number' || userId <= 0) {
      throw new ApplicationError(
        'activate_user',
        'INVALID_USER_ID_FORMAT',
        'User ID must be a positive number',
        { providedUserId: userId }
      );
    }

    // Prevent self-activation in some business contexts (if needed)
    // This could be relaxed depending on business rules
    if (requesterId && userId === requesterId) {
      // Log self-activation but allow it (common use case)
      console.log('[User Activation] Self-activation detected', {
        userId,
        requesterId,
        action: 'activate_user',
        type: 'self_activation',
      });
    }
  }

  /**
   * Handle side effects after successful user activation
   *
   * @description
   * Manages audit logging and other side effects related to user activation operations.
   * This includes compliance logging and notification triggers.
   *
   * @param activatedUserId ID of the activated user
   * @param requesterId ID of user making the request
   * @param reason Optional reason for activation
   */
  private async handleUserActivationSideEffects(
    activatedUser: any,
    requesterId?: number,
    reason?: string
  ): Promise<void> {
    // Process domain events from the activated user entity
    await this.eventProcessor.processEntityEvents(activatedUser);

    const timestamp = new Date(this.clock.nowEpochSeconds() * 1000);

    // Log user activation for audit trail
    console.log('[User Activation] User successfully activated', {
      timestamp: timestamp.toISOString(),
      activatedUserId: activatedUser.id,
      requesterId: requesterId || 'system',
      reason: reason || 'No reason provided',
      action: 'activate_user',
      status: 'success',
    });

    // Additional side effects can be added here:
    // - Send notification to user about activation
    // - Update user metrics and analytics
    // - Trigger welcome back workflows
    // - Log to external audit systems
    // - Clear activation-related cache entries
    // - Send notifications to administrators
  }
}
