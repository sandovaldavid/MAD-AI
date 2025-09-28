import { inject, Injectable } from '@angular/core';
import { AUTH_REPOSITORY, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { AuthMapper } from '@application/mappers';
import type { AuthRepository } from '@domain/repositories/business/auth.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { RegisterRequest } from '@/app/application/types/auth/auth.types';

/**
 * Register User Use Case
 *
 * @description
 * Simplified user registration orchestration that handles registration operations.
 * Follows the same pattern as login/logout/refresh-session use cases to maintain consistency.
 *
 * @responsibilities
 * - Execute user registration through domain repository
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
export class RegisterUseCase {
  private readonly authRepository = inject<AuthRepository>(AUTH_REPOSITORY);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  /**
   * Execute user registration orchestration
   *
   * @param registerData User registration data
   * @returns Promise<void> indicating successful registration
   * @throws ApplicationError for registration failures
   */
  async execute(registerData: RegisterRequest): Promise<void> {
    try {
      this.logger.info('Starting user registration', {
        operation: 'register',
      });

      // Map to domain format for domain layer processing
      const domainData = AuthMapper.toRegisterUserContract(registerData);

      // Execute registration through domain repository
      await this.authRepository.register(domainData);

      this.logger.info('User registration completed successfully', {
        operation: 'register',
      });
    } catch (error) {
      this.logger.error('User registration failed', {
        operation: 'register',
      });
      throw this.errorTransformer.transform(error);
    }
  }
}
