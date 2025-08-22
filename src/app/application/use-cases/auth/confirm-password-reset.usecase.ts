import { inject, Injectable } from '@angular/core';
import { AUTH_REPOSITORY, CLOCK_PORT } from '../../../di/tokens';
import type { AuthRepository } from '@domain/repositories/business/auth.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { PasswordResetConfirmRequest } from '@application/types/auth.types';
import { ApplicationError } from '../../errors/application-error';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';

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
        try {
            // 1. Validate application rules for password reset confirmation
            await this.validateApplicationRules(request);

            // 2. Execute password reset confirmation through domain repository
            const resetResult = await this.authRepo.confirmPasswordReset(request);

            // 3. Handle side effects - logging and security audit
            await this.handlePasswordResetConfirmationSideEffects(request, resetResult);

            return resetResult.message;
        } catch (error) {
            // 4. Normalize and re-throw error
            throw this.normalizeAndRethrow(error, 'PASSWORD_RESET_CONFIRMATION');
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
                'confirm_password_reset',
                'Password reset confirmation is temporarily unavailable. Please try again later.',
                'SYSTEM_UNAVAILABLE'
            );
        }

        // Application-level validation: security check for password confirmation
        if (request.newPassword !== request.newPasswordConfirm) {
            throw new ApplicationError(
                'confirm_password_reset',
                'Password confirmation does not match. Please ensure both passwords are identical.',
                'PASSWORD_MISMATCH'
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

        // Log successful password reset for security audit
        console.log(
            `Password reset confirmed successfully at ${confirmationTime.toISOString()}: ${request.token.substring(
                0,
                8
            )}...`
        );

        // Additional side effects could include:
        // - Invalidating all existing sessions for the user
        // - Sending password change notification email
        // - Security event logging
        // - Metrics collection
        // - Fraud detection updates
    }

    /**
     * Normalizes errors using the error transformer
     */
    private normalizeAndRethrow(error: unknown, operation: string): never {
        const message = this.errorTransformer.transformError(error, {
            feature: 'auth',
            operation: 'confirm-password-reset',
        });
        const code = this.extractErrorCode(error);
        throw new ApplicationError(`${operation}_FAILED`, message, code, error);
    }

    /**
     * Checks if system is available for password reset
     */
    private async checkSystemAvailability(): Promise<boolean> {
        // This would typically check system configuration or feature flags
        // For now, returning true (system always available)
        return true;
    }

    /**
     * Extracts error code from unknown error
     */
    private extractErrorCode(error: unknown): string {
        if (error instanceof ApplicationError) {
            return error.code;
        }
        if (error && typeof error === 'object' && 'code' in error) {
            return String((error as any).code);
        }
        return 'UNKNOWN_ERROR';
    }
}
