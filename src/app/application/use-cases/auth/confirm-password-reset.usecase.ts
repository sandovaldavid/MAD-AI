import { inject, Injectable } from '@angular/core';
import { AUTH_REPOSITORY, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { AuthRepository } from '@domain/repositories/business/auth.repository';
import type { ResetPasswordContract } from '@domain/repositories/business/auth.contract';
import type { Logger } from '@core/interfaces/logger.interface';
import type { PasswordResetConfirmRequest } from '@/app/application/types/auth/auth.types';

/**
 * Orchestrates the password reset confirmation process.
 * Validates the reset token and new password through the domain layer.
 */
@Injectable()
export class ConfirmPasswordResetUseCase {
  private readonly authRepository = inject<AuthRepository>(AUTH_REPOSITORY);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  /**
   * Executes password reset confirmation through domain repository.
   * @param request Password reset confirmation request containing token and new password
   * @returns Promise<string> Confirmation message
   */
  async execute(request: PasswordResetConfirmRequest): Promise<string> {
    this.logger.info('Starting password reset confirmation process');

    try {
      // Map application request to domain contract
      const resetContract: ResetPasswordContract = {
        token: request.token,
        newPassword: request.newPassword,
        newPasswordConfirm: request.confirmPassword,
      };

      const result = await this.authRepository.confirmPasswordReset(resetContract);

      this.logger.info('Password reset confirmation completed successfully');
      return result.message;
    } catch (error) {
      this.logger.error('Password reset confirmation failed', {
        operation: 'confirmPasswordReset',
      });
      throw this.errorTransformer.transform(error as Error);
    }
  }
}
