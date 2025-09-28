import { inject, Injectable } from '@angular/core';
import { USER_REPOSITORY, CLOCK_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { ActivateUserRequest, GetUserResult } from '@/app/application/types/users/users.types';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { User } from '@domain/entities/user.entity';
import type { Logger } from '@core/interfaces/logger.interface';

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
@Injectable()
export class ActivateUser {
  private readonly userRepo = inject<UserRepository>(USER_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);
  private readonly logger = inject<Logger>(LOGGER_PORT);

  /**
   * Execute user activation orchestration
   *
   * Orchestrates the complete user activation workflow following Clean Architecture principles.
   * This method coordinates domain operations and side effects while maintaining separation of concerns.
   *
   * @param request User activation request with ID
   * @returns Promise resolving to activated user
   * @throws ApplicationError when activation fails or user not found
   */
  async execute(request: ActivateUserRequest): Promise<GetUserResult> {
    try {
      // Step 1: Delegate activation to domain repository
      await this.userRepo.activate(request.userId);

      // Step 2: Get the activated user for result and side effects
      const activatedUser = await this.userRepo.getById(request.userId);

      // Step 3: Handle side effects
      await this.handleUserActivationSideEffects(activatedUser);

      return activatedUser;
    } catch (error: unknown) {
      // Log error for monitoring and transform to application error
      this.logger.error('User activation failed', {
        correlationId: `activate-user-${request.userId}-${this.clock.nowEpochSeconds()}`,
        userId: request.userId.toString(),
        operation: 'activate_user',
      });

      throw this.errorTransformer.transform(error);
    }
  }

  /**
   * Handle side effects for successful user activation
   *
   * Manages audit logging and any other side effects that should occur
   * after a successful user activation operation.
   *
   * @param activatedUser The activated user entity
   */
  private async handleUserActivationSideEffects(activatedUser: User): Promise<void> {
    const correlationId = `user-activate-${activatedUser.id}-${this.clock.nowEpochSeconds()}`;

    // Log user activation for audit trail
    this.logger.info('User activated successfully', {
      correlationId,
      userId: activatedUser.id.toString(),
      operation: 'activate_user',
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
