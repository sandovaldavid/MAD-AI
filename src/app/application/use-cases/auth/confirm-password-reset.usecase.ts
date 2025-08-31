import { inject, Injectable } from '@angular/core';
import { AUTH_REPOSITORY, CLOCK_PORT, LOGGER_PORT, SECURITY_EVENT_REPOSITORY } from '@di/tokens';
import type { AuthRepository } from '@domain/repositories/business/auth.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { PasswordResetConfirmRequest } from '@application/types/auth.types';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { Logger } from '@core/interfaces/logger.interface';
import type {
  SecurityEventRepository,
  SecurityEvent,
} from '@domain/repositories/system/security-event.repository';
import { AuthMapper } from '@application/mappers';

/**
 * Confirm Password Reset Use Case
 *
 * @description
 * Application layer orchestrator that handles password reset confirmation with comprehensive validation,
 * token verification, and security considerations. This use case follows the orchestration
 * pattern with error normalization to ensure consistent password reset completion workflow.
 *
 * @responsibilities
 * - Orchestrate password reset confirmation with validation and side effects
 * - Validate application-level security rules
 * - Execute password reset confirmation through domain repository
 * - Handle security side effects (logging, audit trails)
 * - Normalize errors for application layer consumption
 *
 * @architecture
 * This use case acts as an orchestrator that:
 * 1. Validates application rules (system availability, security checks)
 * 2. Delegates password reset confirmation to domain repository
 * 3. Handles side effects (security logging, audit trails)
 * 4. Normalizes errors for consistent error handling
 *
 * @security
 * - Validates token format and structure at domain level
 * - Enforces password strength requirements in domain
 * - Logs security events for monitoring
 *
 * @since 1.0.0
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class ConfirmPasswordReset {
  private readonly authRepo = inject<AuthRepository>(AUTH_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly securityLogger = inject<SecurityEventRepository>(SECURITY_EVENT_REPOSITORY);

  /**
   * Orchestrates password reset confirmation with validation, delegation, and side effects
   *
   * @param request - Password reset confirmation request
   * @returns Promise<string> - Confirmation message
   *
   * @throws ApplicationError when confirmation fails with normalized error message
   *
   * @example Basic password reset confirmation
   * ```typescript
   * const message = await confirmPasswordResetUC.execute({
   *   token: 'password-reset-token-here',
   *   newPassword: 'StrongPassword123!',
   *   newPasswordConfirm: 'StrongPassword123!'
   * });
   * console.log(message); // "Password reset successfully"
   * ```
   */
  async execute(request: PasswordResetConfirmRequest): Promise<string> {
    // 1. Log del inicio de la operación
    this.logger.info('Starting password reset confirmation', {
      operation: 'confirm_password_reset',
      correlationId: `confirm-reset-${Date.now()}`,
    });

    try {
      // 2. Validate application rules for password reset confirmation
      await this.validateApplicationRules(request);

      // 3. Map Application type to Domain contract
      const domainRequest = AuthMapper.toResetPasswordContract(request);

      // 4. Execute password reset confirmation through domain repository
      const resetResult = await this.authRepo.confirmPasswordReset(domainRequest);

      // 5. Handle side effects - logging and security audit
      await this.handlePasswordResetConfirmationSideEffects(request, resetResult);

      // 6. Log successful completion
      this.logger.info('Password reset confirmation completed successfully', {
        operation: 'confirm_password_reset',
        correlationId: `confirm-reset-${Date.now()}`,
      });

      return resetResult.message;
    } catch (error) {
      // 7. Log error and normalize
      this.logger.error('Password reset confirmation failed', {
        operation: 'confirm_password_reset',
        correlationId: `confirm-reset-${Date.now()}`,
      });

      // 8. Normalize and re-throw error
      throw this.errorTransformer.transform(error, {
        operation: 'confirm_password_reset',
        correlationId: `confirm-reset-${Date.now()}`,
      });
    }
  }

  /**
   * Validates application-specific rules for password reset confirmation
   */
  private async validateApplicationRules(request: PasswordResetConfirmRequest): Promise<void> {
    // Application-level validation: check if system is available
    const systemAvailable = await this.checkSystemAvailability();

    if (!systemAvailable) {
      throw new ApplicationError(
        ApplicationErrorCode.SERVICE_UNAVAILABLE,
        'Password reset confirmation is temporarily unavailable',
        'The password reset confirmation service is currently unavailable. Please try again later.',
        undefined,
        'Please try again in a few minutes'
      );
    }

    // Application-level validation: security check for password confirmation
    if (request.newPassword !== request.confirmPassword) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Password confirmation does not match',
        'The password confirmation does not match the new password. Please ensure both passwords are identical.',
        undefined,
        'Please make sure both password fields contain the same value'
      );
    }
  }

  /**
   * Handles password reset confirmation side effects
   */
  private async handlePasswordResetConfirmationSideEffects(
    request: PasswordResetConfirmRequest,
    result: { message: string }
  ): Promise<void> {
    const confirmationTime = new Date(this.clock.nowEpochSeconds() * 1000);

    // Log security event for password reset confirmation
    const securityEvent: SecurityEvent = {
      type: 'SUSPICIOUS_ACTIVITY',
      details: {
        timestamp: confirmationTime.toISOString(),
        event: 'PASSWORD_RESET_CONFIRMED',
        tokenPrefix: request.token.substring(0, 8),
        hasDeviceInfo: !!request.deviceInfo,
        success: true,
      },
      timestamp: confirmationTime,
    };

    await this.securityLogger.logSecurityEvent(securityEvent);

    // Log successful password reset for audit trail
    this.logger.info(`Password reset confirmed successfully: ${result.message}`, {
      operation: 'password_reset_confirmation',
      correlationId: `confirm-reset-${Date.now()}`,
    });
  }

  /**
   * Checks if system is available for password reset
   */
  private async checkSystemAvailability(): Promise<boolean> {
    // This would typically check system configuration or feature flags
    // For now, returning true (system always available)
    return true;
  }
}
