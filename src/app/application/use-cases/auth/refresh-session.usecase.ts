import { inject, Injectable } from '@angular/core';
import { AUTH_REPOSITORY, SESSION_STORE_PORT, CLOCK_PORT } from '../../../di/tokens';
import type { AuthRepository } from '@domain/repositories/business/auth.repository';
import type { SessionStorePort } from '@domain/repositories/session/session-store.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Session } from '@domain/entities/session.entity';
import type { SessionSnapshotContract } from '@domain/contracts/session-store.contract';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { ApplicationError } from '@application/errors/application-error';

/**
 * Refresh Session Use Case
 *
 * @description
 * Application layer orchestrator that handles session refresh operations with token validation,
 * expiration checks, and session storage updates. This use case follows the orchestration
 * pattern with error normalization to ensure consistent session management.
 *
 * @responsibilities
 * - Orchestrate session refresh with validation and side effects
 * - Check session expiration and refresh token validity
 * - Execute token refresh through domain repository
 * - Update session storage with new tokens
 * - Handle refresh security considerations and logging
 * - Normalize errors for application layer consumption
 *
 * @architecture
 * This use case acts as an orchestrator that:
 * 1. Validates refresh preconditions (session exists, not expired)
 * 2. Delegates token refresh to domain repository
 * 3. Handles side effects (session storage, security logging)
 * 4. Normalizes errors for consistent error handling
 *
 * @since 1.0.0
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class RefreshSession {
  private readonly authRepo = inject<AuthRepository>(AUTH_REPOSITORY);
  private readonly sessionStore = inject<SessionStorePort>(SESSION_STORE_PORT);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  /**
   * Orchestrates session refresh with validation, delegation, and side effects
   *
   * @returns Promise<Session> - Updated session with new tokens
   *
   * @throws ApplicationError when refresh fails with normalized error message
   *
   * @example Basic session refresh
   * ```typescript
   * const updatedSession = await refreshSessionUC.execute();
   * ```
   */
  async execute(): Promise<Session> {
    try {
      // 1. Validate application rules for session refresh
      await this.validateApplicationRules();

      // 2. Execute session refresh through domain repository
      const refreshedSession = await this.authRepo.refresh();

      // 3. Handle side effects - update session storage and logging
      await this.handleRefreshSideEffects(refreshedSession);

      return refreshedSession;
    } catch (error) {
      // 4. Normalize and re-throw error
      throw new ApplicationError(
        'refresh_session',
        this.errorTransformer.transformError(error),
        this.extractErrorCode(error)
      );
    }
  }

  /**
   * Validates application-specific rules for session refresh
   */
  private async validateApplicationRules(): Promise<void> {
    // Application-level validation: check if session exists
    const currentSession = await this.sessionStore.readAll();

    if (!currentSession?.tokens?.refreshToken) {
      throw new ApplicationError(
        'refresh_session',
        'No valid refresh token found. Please log in again.',
        'NO_REFRESH_TOKEN'
      );
    }

    // Application-level validation: check if refresh is needed
    if (!this.isRefreshNeeded(currentSession)) {
      throw new ApplicationError(
        'refresh_session',
        'Session is still valid, refresh not required.',
        'REFRESH_NOT_NEEDED'
      );
    }

    // Application-level validation: check refresh token expiration
    if (this.isRefreshTokenExpired(currentSession)) {
      throw new ApplicationError(
        'refresh_session',
        'Refresh token has expired. Please log in again.',
        'REFRESH_TOKEN_EXPIRED'
      );
    }
  }

  /**
   * Handles session refresh side effects
   */
  private async handleRefreshSideEffects(session: Session): Promise<void> {
    // Update session storage with new tokens
    await this.updateSessionStorage(session);

    // Log successful refresh for security audit
    const refreshTime = new Date(this.clock.nowEpochSeconds() * 1000);
    console.log(
      `Session refreshed at ${refreshTime.toISOString()} for user: ${
        session.user?.email || 'unknown'
      }`
    );

    // Additional side effects could include:
    // - Updating last activity timestamp
    // - Security event logging
    // - Metrics collection
  }

  /**
   * Updates session storage with refreshed session data
   */
  private async updateSessionStorage(session: Session): Promise<void> {
    const sessionSnapshot: SessionSnapshotContract = {
      user: session.user
        ? {
            id: session.user.id,
            username: session.user.username,
            email: session.user.email,
            roleId: session.user.role?.id || null,
            roleName: session.user.role?.name || null,
            accessLevel: session.user.role?.accessLevel || null,
            isEmailConfirmed: session.user.isEmailConfirmed || null,
            status: session.user.status?.value || null,
            updatedAt: session.user.updatedAt?.toString() || null,
          }
        : null,
      tokens: {
        accessToken: session.access?.value || null,
        accessExp: session.access?.expSeconds || null,
        refreshToken: session.refresh?.value || null,
      },
      version: 1,
      updatedAt: this.clock.nowEpochSeconds() * 1000,
    };

    await this.sessionStore.writeAll(sessionSnapshot);
  }

  /**
   * Checks if session refresh is needed based on token expiration
   */
  private isRefreshNeeded(sessionSnapshot: SessionSnapshotContract): boolean {
    if (!sessionSnapshot.tokens?.accessExp) {
      return true; // No expiration info, assume refresh needed
    }

    const currentTime = this.clock.nowEpochSeconds();
    const bufferTime = 5 * 60; // 5 minutes buffer

    return sessionSnapshot.tokens.accessExp - bufferTime <= currentTime;
  }

  /**
   * Checks if refresh token has expired
   */
  private isRefreshTokenExpired(sessionSnapshot: SessionSnapshotContract): boolean {
    // This would typically check refresh token expiration
    // For now, we delegate this validation to the domain repository
    // which will throw appropriate errors if refresh token is invalid
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
