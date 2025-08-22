import { inject, Injectable } from '@angular/core';
import { AUTH_REPOSITORY, CLOCK_PORT } from '../../../di/tokens';
import type { AuthRepository } from '@domain/repositories/business/auth.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { EmailConfirmationRequest } from '@application/types/auth.types';
import { ApplicationError } from '../../errors/application-error';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';

/**
 * Confirm Email Use Case
 *
 * @description
 * Application layer orchestrator that handles email confirmation with comprehensive validation,
 * token verification, and security considerations. This use case follows the orchestration
 * pattern with error normalization to ensure consistent email confirmation workflow.
 *
 * @responsibilities
 * - Orchestrate email confirmation with validation and side effects
 * - Validate application-level confirmation rules
 * - Execute email confirmation through domain repository
 * - Handle confirmation side effects (logging, notifications)
 * - Normalize errors for application layer consumption
 *
 * @architecture
 * This use case acts as an orchestrator that:
 * 1. Validates confirmation preconditions (application rules)
 * 2. Delegates email confirmation to domain repository
 * 3. Handles side effects (security logging, audit trails)
 * 4. Normalizes errors for consistent error handling
 *
 * @since 1.0.0
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class ConfirmEmail {
    private readonly authRepo = inject<AuthRepository>(AUTH_REPOSITORY);
    private readonly clock = inject<ClockPort>(CLOCK_PORT);
    private readonly errorTransformer = inject(ApplicationErrorTransformer);

    /**
     * Orchestrates email confirmation with validation, delegation, and side effects
     *
     * @param request - Email confirmation request containing the token
     * @returns Promise<string> - Confirmation message
     *
     * @throws ApplicationError when confirmation fails with normalized error message
     *
     * @example Basic email confirmation
     * ```typescript
     * const message = await confirmEmailUC.execute({
     *   token: 'email-confirmation-token-here'
     * });
     * console.log(message); // "Email confirmed successfully"
     * ```
     */
    async execute(request: EmailConfirmationRequest): Promise<string> {
        try {
            // 1. Validate application rules for email confirmation
            await this.validateApplicationRules(request);

            // 2. Execute email confirmation through domain repository
            const confirmationResult = await this.authRepo.confirmEmail(request.token);

            // 3. Handle side effects - logging and audit trail
            await this.handleConfirmationSideEffects(request, confirmationResult);

            return confirmationResult.message;
        } catch (error) {
            // 4. Normalize and re-throw error
            throw this.normalizeAndRethrow(error, 'EMAIL_CONFIRMATION');
        }
    }

    /**
     * Validates application-specific rules for email confirmation
     */
    private async validateApplicationRules(request: EmailConfirmationRequest): Promise<void> {
        // Application-level validation: check if system is in maintenance mode
        const maintenanceMode = await this.checkMaintenanceMode();

        if (maintenanceMode) {
            throw new ApplicationError(
                'confirm_email',
                'Email confirmation is temporarily unavailable due to system maintenance.',
                'SYSTEM_MAINTENANCE'
            );
        }

        // Application-level validation: rate limiting could be implemented here
        // This would prevent abuse of the confirmation endpoint
        console.log(
            `Email confirmation attempt at ${new Date(
                this.clock.nowEpochSeconds() * 1000
            ).toISOString()}`
        );
    }

    /**
     * Handles email confirmation side effects
     */
    private async handleConfirmationSideEffects(
        request: EmailConfirmationRequest,
        result: { message: string }
    ): Promise<void> {
        // Log successful confirmation for audit purposes
        const confirmationTime = new Date(this.clock.nowEpochSeconds() * 1000);
        console.log(
            `Email confirmed successfully at ${confirmationTime.toISOString()}: ${request.token.substring(
                0,
                8
            )}...`
        );

        // Additional side effects could include:
        // - Sending welcome notifications
        // - Updating user analytics
        // - Triggering post-confirmation workflows
        // - Security event logging
    }

    /**
     * Normalizes errors using the error transformer
     */
    private normalizeAndRethrow(error: unknown, operation: string): never {
        const message = this.errorTransformer.transformError(error, {
            feature: 'auth',
            operation: 'confirm-email',
        });
        const code = this.extractErrorCode(error);
        throw new ApplicationError(`${operation}_FAILED`, message, code, error);
    }

    /**
     * Checks if system is in maintenance mode
     */
    private async checkMaintenanceMode(): Promise<boolean> {
        // This would typically check system configuration or feature flags
        // For now, returning false (no maintenance mode)
        return false;
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
