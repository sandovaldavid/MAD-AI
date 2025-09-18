import { inject, Injectable } from '@angular/core';
import { USER_REPOSITORY, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { ChangePasswordContract } from '@domain/repositories/business/user.contract';

/**
 * Change Password Use Case
 *
 * @description
 * Application layer orchestrator for password change operations. Handles authenticated
 * user password modifications with proper security validation and audit logging.
 * Follows clean orchestration patterns by delegating all validation to Domain layer.
 *
 * @responsibilities
 * - Execute password change through domain repository
 * - Handle error transformation for application layer consumption
 * - Log password change operations for security audit purposes
 * - Coordinate self-service password management workflow
 *
 * @architecture
 * - Application Layer orchestrator following Golden Rule pattern
 * - Uses domain repositories through dependency injection
 * - Focuses on workflow coordination, not business logic
 * - Maintains comprehensive security audit trail
 *
 * @securityConsiderations
 * - Password changes are logged for security monitoring
 * - Current password validation prevents unauthorized changes
 * - New password must meet complexity requirements (enforced by domain)
 * - Operation requires valid authentication context
 *
 * @since 1.0.0
 * @layer Application
 */
@Injectable()
export class ChangePasswordUseCase {
  private readonly userRepository = inject<UserRepository>(USER_REPOSITORY);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  /**
   * Execute password change orchestration
   *
   * @description
   * Orchestrates password change by delegating to domain repository and handling
   * application-layer concerns like security logging and error transformation.
   * All validation and business rules are enforced at the Domain layer.
   *
   * @param passwordChangeData - Password change request with current and new passwords
   * @returns Promise that resolves when password change is complete
   * @throws ApplicationError for validation failures, unauthorized access, or system errors
   *
   * @businessRules
   * - Current password must be verified before allowing change
   * - New password must meet complexity requirements
   * - Password confirmation must match new password
   * - User must be authenticated to change password
   * - Password change invalidates existing sessions (optional)
   *
   * @securityRules
   * - Password changes are logged for audit purposes
   * - Failed attempts are logged for security monitoring
   * - Sensitive data (passwords) are not logged in plaintext
   * - Rate limiting may apply to prevent brute force attacks
   *
   * @example Password Change
   * ```typescript
   * const passwordData = {
   *   currentPassword: 'currentSecurePassword',
   *   newPassword: 'newSecurePassword123!',
   *   newPasswordConfirmation: 'newSecurePassword123!'
   * };
   *
   * try {
   *   await changePasswordUseCase.execute(passwordData);
   *   console.log('Password changed successfully');
   *   // Optionally redirect to login for re-authentication
   * } catch (error) {
   *   if (error instanceof UnauthorizedError) {
   *     console.error('Current password is incorrect');
   *   } else if (error instanceof ValidationError) {
   *     console.error('New password does not meet requirements');
   *   }
   * }
   * ```
   */
  async execute(passwordChangeData: ChangePasswordContract): Promise<void> {
    try {
      this.logger.info('Starting password change operation', {
        operation: 'change_password',
      });

      // Execute password change through domain repository
      // All validation (current password, new password complexity, confirmation match)
      // is handled by the Domain layer
      await this.userRepository.changePassword(passwordChangeData);

      this.logger.info('Password changed successfully', {
        operation: 'change_password',
      });
    } catch (error) {
      this.logger.error('Password change failed', {
        operation: 'change_password',
      });

      throw this.errorTransformer.transform(error, {
        operation: 'change_password',
      });
    }
  }
}
