import { inject, Injectable } from '@angular/core';
import { AUTH_REPOSITORY, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { AuthRepository } from '@domain/repositories/business/auth.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { EmailConfirmationRequest } from '@application/types/auth.types';

/**
 * Orchestrates the email confirmation process.
 * Validates the confirmation token through the domain layer.
 */
@Injectable()
export class ConfirmEmailUseCase {
  private readonly authRepository = inject<AuthRepository>(AUTH_REPOSITORY);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  /**
   * Executes email confirmation through domain repository.
   * @param request Email confirmation request containing the token
   * @returns Promise<string> Confirmation message
   */
  async execute(request: EmailConfirmationRequest): Promise<string> {
    try {
      // 1. Log confirmation attempt
      this.logger.info('Email confirmation attempt initiated', {
        operation: 'confirm_email',
      });

      // 2. Execute confirmation through domain repository
      const result = await this.authRepository.confirmEmail(request.token);

      // 3. Log successful confirmation
      this.logger.info('Email confirmation completed successfully', {
        operation: 'confirm_email',
      });

      return result.message;
    } catch (error) {
      this.logger.warn('Email confirmation failed', {
        operation: 'confirm_email',
      });
      throw this.errorTransformer.transform(error, {
        operation: 'confirm_email',
      });
    }
  }
}
