import { inject, Injectable } from '@angular/core';
import { AUTH_REPOSITORY, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { AuthRepository } from '@domain/repositories/business/auth.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { User } from '@domain/entities/user.entity';

/**
 * Get User Profile Use Case
 *
 * @description
 * Simplified user profile retrieval orchestration that handles current user profile access.
 * Follows the same pattern as login/logout/refresh-session/register/request-password-reset use cases to maintain consistency.
 *
 * @responsibilities
 * - Execute user profile retrieval through domain repository
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
export class GetProfileUseCase {
  private readonly authRepository = inject<AuthRepository>(AUTH_REPOSITORY);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  /**
   * Execute user profile retrieval orchestration
   *
   * @returns Promise<User> User profile
   * @throws ApplicationError for profile retrieval failures
   */
  async execute(): Promise<User> {
    try {
      this.logger.info('Starting user profile retrieval', {
        operation: 'get_profile',
      });

      // Execute profile retrieval through domain repository
      const user = await this.authRepository.me();

      this.logger.info('User profile retrieved successfully', {
        operation: 'get_profile',
      });

      return user;
    } catch (error) {
      this.logger.error('User profile retrieval failed', {
        operation: 'get_profile',
      });
      throw this.errorTransformer.transform(error);
    }
  }
}
