import { inject, Injectable } from '@angular/core';
import { AUTH_REPOSITORY, SESSION_STORE_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { AuthRepository } from '@domain/repositories/business/auth.repository';
import type { SessionStoreRepository } from '@domain/repositories/session/session-store.repository';
import type { Logger } from '@core/interfaces/logger.interface';

/**
 * Logout Use Case
 *
 * @description
 * Simplified logout orchestration that handles basic token revocation
 * and session cleanup. Removed over-engineering to match current API capabilities.
 *
 * @responsibilities
 * - Execute logout through domain repository with refresh token
 * - Clear local session storage
 * - Handle basic error transformation
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
export class LogoutUseCase {
  private readonly authRepository = inject<AuthRepository>(AUTH_REPOSITORY);
  private readonly sessionStore = inject<SessionStoreRepository>(SESSION_STORE_PORT);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  async execute(): Promise<void> {
    try {
      this.logger.info('Attempting logout', {
        operation: 'logout',
      });

      // Step 1: Get current session to retrieve refresh token
      const sessionData = await this.sessionStore.readAll();

      // Step 2: Revoke refresh token if available
      if (sessionData?.tokens?.refreshToken) {
        await this.authRepository.logout(sessionData.tokens.refreshToken);
      } else {
        this.logger.warn('Logout without refresh token', {
          operation: 'logout',
        });
      }

      // Step 3: Clear local session storage
      await this.sessionStore.writeAll(null);

      this.logger.info('Logout successful', {
        operation: 'logout',
      });
    } catch (error) {
      this.logger.error('Logout failed', {
        operation: 'logout',
      });
      throw this.errorTransformer.transform(error);
    }
  }
}
