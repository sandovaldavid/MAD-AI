import { inject, Injectable } from '@angular/core';
import { USER_REPOSITORY, CLOCK_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type {
  DeactivateUserRequest,
  GetUserResult,
} from '@/app/application/types/users/users.types';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { User } from '@domain/entities/user.entity';
import type { Logger } from '@core/interfaces/logger.interface';

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
@Injectable()
export class DeactivateUser {
  private readonly userRepo = inject<UserRepository>(USER_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  /**
   * Execute user deactivation orchestration
   *
   * Orchestrates the complete user deactivation workflow following Clean Architecture principles.
   * This method coordinates domain operations and side effects while maintaining separation of concerns.
   *
   * @param request User deactivation request with ID
   * @returns Promise resolving to deactivated user
   * @throws ApplicationError when deactivation fails or user not found
   */
  async execute(request: DeactivateUserRequest): Promise<GetUserResult> {
    try {
      // Step 0: Validate input at application layer
      if (!request || typeof request !== 'object') {
        throw new Error('Invalid request: request must be an object');
      }

      if (request.userId === null || request.userId === undefined) {
        throw new Error('User ID is required for deactivation');
      }

      // Step 1: Delegate deactivation to domain repository
      await this.userRepo.deactivate(request.userId);

      // Step 2: Get the deactivated user for result and side effects
      const deactivatedUser = await this.userRepo.getById(request.userId);

      // Step 3: Handle side effects
      await this.handleUserDeactivationSideEffects(deactivatedUser);

      return deactivatedUser;
    } catch (error: unknown) {
      // Log error for monitoring and transform to application error
      const safeUserId = request.userId?.toString() ?? 'unknown';
      this.logger.error('User deactivation failed', {
        correlationId: `deactivate-user-${safeUserId}-${this.clock.nowEpochSeconds()}`,
        userId: safeUserId.toString(),
        operation: 'deactivate_user',
      });

      throw this.errorTransformer.transform(error);
    }
  }

  /**
   * Handle side effects for successful user deactivation
   *
   * Manages audit logging and any other side effects that should occur
   * after a successful user deactivation operation.
   *
   * @param deactivatedUser The deactivated user entity
   */
  private async handleUserDeactivationSideEffects(deactivatedUser: User): Promise<void> {
    const correlationId = `user-deactivate-${deactivatedUser.id}-${this.clock.nowEpochSeconds()}`;

    // Log user deactivation for audit trail
    this.logger.info('User deactivated successfully', {
      correlationId,
      userId: deactivatedUser.id.toString(),
      operation: 'deactivate_user',
    });

    // Additional side effects can be added here:
    // - Send notification to user about deactivation
    // - Update user metrics and analytics
    // - Trigger security cleanup workflows
    // - Log to external audit systems
    // - Clear user-related cache entries
    // - Send notifications to administrators
  }
}
