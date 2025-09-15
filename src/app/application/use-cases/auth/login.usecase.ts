import { inject, Injectable } from '@angular/core';
import { AUTH_REPOSITORY, SESSION_STORE_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { AuthMapper } from '@application/mappers';
import type { AuthRepository } from '@domain/repositories/business/auth.repository';
import type { SessionStoreRepository } from '@domain/repositories/session/session-store.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { LoginRequest } from '@application/types/auth.types';
import type { Session } from '@domain/entities/session.entity';

/**
 * Login Use Case
 *
 * @description
 * Orchestrates user authentication with session management.
 * Simplified to use only what's actually available in the current API.
 *
 * @responsibilities
 * - Execute authentication through domain repository
 * - Handle session persistence using entity's toPlainObject method
 * - Normalize errors for facade consumption
 *
 * @architecture
 * - Application Layer orchestrator
 * - Uses domain repositories through dependency injection
 * - Returns domain entities with normalized error handling
 *
 * @since 1.0.0
 * @layer Application
 */
@Injectable()
export class LoginUseCase {
  // Required repositories for basic authentication
  private readonly authRepository = inject<AuthRepository>(AUTH_REPOSITORY);
  private readonly sessionStore = inject<SessionStoreRepository>(SESSION_STORE_PORT);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  async execute(request: LoginRequest): Promise<Session> {
    try {
      this.logger.info('Attempting login', {
        operation: 'login',
      });

      // Step 1: Map request to credentials for auth repository
      const credentials = AuthMapper.toCredentialsContract(request);

      // Step 2: Authenticate through domain repository
      const session = await this.authRepository.login(credentials);

      // Step 3: Store session using SessionSnapshotContract format
      const sessionSnapshot = {
        user: {
          id: session.user.id,
          username: session.user.username.value,
          email: session.user.email.value,
          roleId: session.user.role.id,
          roleName: session.user.role.name,
          accessLevel: session.user.role.accessLevel,
          isEmailConfirmed: session.user.isEmailConfirmed,
          status: session.user.status?.value,
          updatedAt: session.user.updatedAt?.value,
        },
        tokens: {
          accessToken: session.accessToken.getValue(),
          accessExp: session.accessToken.expSeconds,
          refreshToken: session.refreshToken.getValue(),
        },
        version: 1,
        updatedAt: Date.now(),
      };

      await this.sessionStore.writeAll(sessionSnapshot);

      this.logger.info('Login successful', {
        userId: session.user.id.toString(),
        operation: 'login',
      });

      return session;
    } catch (error) {
      this.logger.error('Login failed', {
        operation: 'login',
      });
      throw this.errorTransformer.transform(error);
    }
  }
}
