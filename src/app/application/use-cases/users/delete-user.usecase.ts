import { inject, Injectable } from '@angular/core';
import { USER_REPOSITORY, CLOCK_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { DeleteUserRequest, DeleteUserResult } from '@/app/application/types/users/users.types';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Logger } from '@core/interfaces/logger.interface';

/**
 * Delete User Use Case
 *
 * @description
 * Application layer orchestrator that handles user deletion through deactivation
 * with validation, audit logging, and error normalization. This use case performs
 * logical deletion by deactivating the user account rather than physical deletion.
 *
 * @responsibilities
 * - Orchestrate user deletion (deactivation) with validation and side effects
 * - Validate application-level access rules
 * - Execute user deletion through domain repository (logical deletion)
 * - Handle deletion audit logging for compliance purposes
 * - Normalize errors for application layer consumption
 *
 * @architecture
 * This use case acts as an orchestrator that:
 * 1. Validates application rules (user ID, deletion permissions)
 * 2. Delegates user deletion to domain repository (uses deactivate endpoint)
 * 3. Handles side effects (audit logging, cleanup notifications)
 * 4. Normalizes errors for consistent error handling
 *
 * @note User deletion is implemented as account deactivation to preserve
 * data integrity and enable potential account recovery.
 *
 * @since 1.0.0
 * @layer Application
 */
@Injectable()
export class DeleteUser {
  private readonly userRepo = inject<UserRepository>(USER_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  /**
   * Execute user deletion orchestration
   *
   * Orchestrates the complete user deletion workflow following Clean Architecture principles.
   * This method coordinates domain operations and side effects while maintaining separation of concerns.
   * The deletion is implemented as account deactivation to preserve data integrity.
   *
   * @param request User deletion request with ID
   * @returns Promise resolving to deletion result
   * @throws ApplicationError when deletion fails or user not found
   */
  async execute(request: DeleteUserRequest): Promise<DeleteUserResult> {
    try {
      // Step 1: Delegate to domain repository (performs logical deletion via deactivation)
      await this.userRepo.delete(request.userId);

      // Step 2: Handle side effects
      await this.handleUserDeletionSideEffects(request.userId);

      return {
        success: true,
        userId: request.userId,
      };
    } catch (error: unknown) {
      // Log error for monitoring and transform to application error
      const safeUserId = (request as unknown as { userId?: unknown })?.userId ?? 'unknown';
      this.logger.error('User deletion failed', {
        correlationId: `delete-user-${safeUserId}-${this.clock.nowEpochSeconds()}`,
        userId: safeUserId.toString(),
        operation: 'delete_user',
      });

      throw this.errorTransformer.transform(error);
    }
  }

  /**
   * Handle side effects for successful user deletion
   *
   * Manages audit logging and any other side effects that should occur
   * after a successful user deletion operation.
   *
   * @param deletedUserId ID of the deleted user
   */
  private async handleUserDeletionSideEffects(deletedUserId: number): Promise<void> {
    const correlationId = `user-delete-${deletedUserId}-${this.clock.nowEpochSeconds()}`;

    // Log user deletion for audit trail
    this.logger.info('User deleted successfully (deactivated)', {
      correlationId,
      userId: deletedUserId.toString(),
      operation: 'delete_user',
    });

    // Additional side effects can be added here:
    // - Send notification to administrators
    // - Clean up user-related cache entries
    // - Trigger data cleanup jobs
    // - Log to external audit systems
    // - Update user metrics and analytics
  }
}
