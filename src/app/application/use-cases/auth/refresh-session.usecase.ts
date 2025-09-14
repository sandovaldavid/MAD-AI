import { inject, Injectable } from '@angular/core';
import { AUTH_REPOSITORY, SESSION_STORE_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { AuthRepository } from '@domain/repositories/business/auth.repository';
import type { SessionStoreRepository } from '@domain/repositories/session/session-store.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { Session } from '@domain/entities/session.entity';

/**
 * Refresh Session Use Case
 *
 * @description
 * Simplified session refresh orchestration that handles token refresh operations.
 * Follows the same pattern as login/logout use cases to maintain consistency.
 *
 * @responsibilities
 * - Execute token refresh through domain repository
 * - Update session storage with new tokens
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
export class RefreshSessionUseCase {
  private readonly authRepository = inject<AuthRepository>(AUTH_REPOSITORY);
  private readonly sessionStore = inject<SessionStoreRepository>(SESSION_STORE_PORT);
  private readonly logger = inject<Logger>(LOGGER_PORT);

  /**
   * Executes session refresh with simplified orchestration
   *
   * @returns Promise<Session> - Updated session with new tokens
   * @throws ApplicationError when refresh fails
   */
  async execute(): Promise<Session> {
    try {
      this.logger.info('Attempting session refresh', {
        operation: 'refresh-session',
      });

      // Step 1: Get current session and refresh token
      const sessionData = await this.sessionStore.readAll();

      if (!sessionData?.tokens?.refreshToken) {
        throw new Error('No refresh token available');
      }

      // Step 2: Execute session refresh through domain repository
      const refreshedSession = await this.authRepository.refresh(sessionData.tokens.refreshToken);

      // Step 3: Store refreshed session using the same pattern as login
      const sessionSnapshot = {
        user: {
          id: refreshedSession.user.id,
          username: refreshedSession.user.username.value,
          email: refreshedSession.user.email.value,
          roleId: refreshedSession.user.role.id,
          roleName: refreshedSession.user.role.name,
          accessLevel: refreshedSession.user.role.accessLevel,
          isEmailConfirmed: refreshedSession.user.isEmailConfirmed,
          status: refreshedSession.user.status?.value,
          updatedAt: refreshedSession.user.updatedAt?.value,
        },
        tokens: {
          accessToken: refreshedSession.accessToken.getValue(),
          accessExp: refreshedSession.accessToken.expSeconds,
          refreshToken: refreshedSession.refreshToken.getValue(),
        },
        version: 1,
        updatedAt: Date.now(),
      };

      await this.sessionStore.writeAll(sessionSnapshot);

      this.logger.info('Session refresh successful', {
        userId: refreshedSession.user.id.toString(),
        operation: 'refresh-session',
      });

      return refreshedSession;
    } catch (error) {
      this.logger.error('Session refresh failed', {
        operation: 'refresh-session',
      });
      throw ApplicationErrorTransformer.prototype.transform(error);
    }
  }
}
