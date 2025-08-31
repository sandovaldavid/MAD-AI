import { inject, Injectable } from '@angular/core';
import { AUTH_REPOSITORY, CLOCK_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { AuthRepository } from '@domain/repositories/business/auth.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { PasswordResetRequest } from '@application/types/auth.types';

/**
 * Request Password Reset Use Case
 *
 * @description
 * Application layer orchestrator that handles password reset requests with comprehensive validation,
 * rate limiting, and security considerations. This use case follows the orchestration
 * pattern with error normalization to ensure consistent password reset workflow.
 *
 * @responsibilities
 * - Orchestrate password reset request with validation and side effects
 * - Validate application-level security rules (rate limiting)
 * - Execute password reset request through domain repository
 * - Handle security side effects (logging, monitoring)
 * - Normalize errors for application layer consumption
 *
 * @architecture
 * This use case acts as an orchestrator that:
 * 1. Validates application rules (rate limiting, system availability)
 * 2. Delegates password reset request to domain repository
 * 3. Handles side effects (security logging, rate limiting tracking)
 * 4. Normalizes errors for consistent error handling
 *
 * @security
 * - Implements rate limiting to prevent abuse
 * - Always returns success message to prevent email enumeration
 * - Logs security events for monitoring
 *
 * @since 1.0.0
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class RequestPasswordReset {
  private readonly authRepo = inject<AuthRepository>(AUTH_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  // Rate limiting: Track recent requests by email (in production, use Redis or similar)
  private static readonly rateLimitWindow = 5 * 60 * 1000; // 5 minutes
  private static readonly maxRequestsPerWindow = 3;
  private static recentRequests = new Map<string, number[]>();

  /**
   * Orchestrates password reset request with validation, delegation, and side effects
   *
   * @param request - Password reset request containing email
   * @returns Promise<string> - Success message
   *
   * @throws ApplicationError when request fails with normalized error message
   *
   * @example Basic password reset request
   * ```typescript
   * const message = await requestPasswordResetUC.execute({
   *   email: 'user@example.com'
   * });
   * console.log(message); // "Password reset email sent if account exists"
   * ```
   */
  async execute(request: PasswordResetRequest): Promise<string> {
    try {
      // 1. Validate application rules for password reset
      await this.validateApplicationRules(request);

      // 2. Execute password reset request through domain repository
      const resetResult = await this.authRepo.requestPasswordReset(request.email);

      // 3. Handle side effects - logging and rate limiting tracking
      await this.handlePasswordResetSideEffects(request);

      return resetResult.message;
    } catch (error) {
      // 4. Normalize and re-throw error
      throw this.errorTransformer.transform(error, {
        operation: 'request_password_reset',
        correlationId: `reset-${Date.now()}`,
      });
    }
  }

  /**
   * Validates application-specific rules for password reset
   */
  private async validateApplicationRules(request: PasswordResetRequest): Promise<void> {
    // Application-level validation: check rate limiting
    this.checkRateLimit(request.email);

    // Application-level validation: check if system is available
    const systemAvailable = await this.checkSystemAvailability();

    if (!systemAvailable) {
      throw new ApplicationError(
        ApplicationErrorCode.SERVICE_UNAVAILABLE,
        'Password reset is temporarily unavailable',
        'The password reset service is currently unavailable. Please try again later.',
        undefined,
        'Please try again in a few minutes'
      );
    }
  }

  /**
   * Handles password reset request side effects
   */
  private async handlePasswordResetSideEffects(request: PasswordResetRequest): Promise<void> {
    const requestTime = this.clock.nowEpochSeconds();

    // Record request for rate limiting (always, even if email doesn't exist for security)
    this.recordRequest(request.email, requestTime);

    // Log request for security monitoring
    this.logger.info(
      `Password reset requested at ${new Date(requestTime * 1000).toISOString()} for: ${
        request.email
      }`,
      {
        operation: 'password_reset_request',
        correlationId: `reset-${requestTime}`,
      }
    );

    // Additional side effects could include:
    // - Security event logging
    // - Metrics collection
    // - Fraud detection updates
  }

  /**
   * Checks rate limiting for password reset requests
   */
  private checkRateLimit(email: string): void {
    const now = Date.now();
    const normalizedEmail = email.toLowerCase().trim();
    const requests = RequestPasswordReset.recentRequests.get(normalizedEmail) || [];

    // Clean old requests outside the window
    const validRequests = requests.filter(
      (timestamp) => now - timestamp * 1000 < RequestPasswordReset.rateLimitWindow
    );

    if (validRequests.length >= RequestPasswordReset.maxRequestsPerWindow) {
      throw new ApplicationError(
        ApplicationErrorCode.RATE_LIMIT_EXCEEDED,
        'Too many password reset requests',
        'You have exceeded the maximum number of password reset requests. Please try again later.',
        { email: normalizedEmail, attempts: validRequests.length },
        'Please wait before requesting another password reset'
      );
    }

    // Update the stored requests
    RequestPasswordReset.recentRequests.set(normalizedEmail, validRequests);
  }

  /**
   * Records a password reset request for rate limiting
   */
  private recordRequest(email: string, timestamp: number): void {
    const normalizedEmail = email.toLowerCase().trim();
    const requests = RequestPasswordReset.recentRequests.get(normalizedEmail) || [];
    requests.push(timestamp);
    RequestPasswordReset.recentRequests.set(normalizedEmail, requests);
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
