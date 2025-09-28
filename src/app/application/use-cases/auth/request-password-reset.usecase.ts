import { inject, Injectable } from '@angular/core';
import { AUTH_REPOSITORY, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { AuthRepository } from '@domain/repositories/business/auth.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { PasswordResetRequest } from '@/app/application/types/auth/auth.types';

/**
 * Request Password Reset Use Case
 *
 * @description
 * Simplified password reset request orchestration that handles password reset operations.
 * Follows the same pattern as login/logout/refresh-session/register use cases to maintain consistency.
 *
 * @responsibilities
 * - Execute password reset request through domain repository
 * - Handle basic error transformation
 * - Basic logging for audit purposes
 *
 * @architecture
 * - Application Layer orchestrator
 * - Uses domain repositories through dependency injection
 * - Simple error handling without complex validation
 *
 * @since 1.0.0
 * @layer Application
 */
@Injectable()
export class RequestPasswordResetUseCase {
  private readonly authRepository = inject<AuthRepository>(AUTH_REPOSITORY);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  /**
   * Execute password reset request orchestration
   *
   * @param request Password reset request data
   * @returns Promise<string> indicating success message
   * @throws ApplicationError for password reset failures
   */
  async execute(request: PasswordResetRequest): Promise<string> {
    try {
      this.logger.info('Starting password reset request', {
        operation: 'password_reset_request',
      });

      // Execute password reset request through domain repository
      const resetResult = await this.authRepository.requestPasswordReset(request.email);

      this.logger.info('Password reset request completed successfully', {
        operation: 'password_reset_request',
      });

      return resetResult.message;
    } catch (error) {
      this.logger.error('Password reset request failed', {
        operation: 'password_reset_request',
      });
      throw this.errorTransformer.transform(error);
    }
  }
}
