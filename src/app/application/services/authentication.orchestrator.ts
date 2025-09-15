import { inject, Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { map, switchMap, take, catchError } from 'rxjs/operators';
import { CLOCK_PORT, AUTH_REPOSITORY, TOKEN_STORE_PORT } from '@di/tokens';
import { ApplicationError } from '@application/errors/application-error';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { AuthRepository } from '@domain/repositories/business/auth.repository';
import type { TokenStoreRepository } from '@domain/repositories/session/token-store.repository';
import type { TokenSnapshotContract } from '@domain/repositories/session/token-store.contract';
import type { Session } from '@domain/entities/session.entity';

/**
 * Application Layer Authentication Orchestrator
 *
 * @description
 * Orchestrates authentication operations without HTTP-specific concerns.
 * This service coordinates Domain and Infrastructure to handle authentication
 * business logic while remaining technology-agnostic.
 *
 * @responsibilities
 * - Coordinate token refresh operations across Domain repositories
 * - Manage authentication state for Application layer
 * - Handle authentication business logic orchestration
 * - Transform between Domain entities and Application contracts
 *
 * @architecture
 * - Pure Application layer service with zero HTTP dependencies
 * - Coordinates Domain repositories through interfaces
 * - Uses dependency injection for all external dependencies
 * - Handles authentication orchestration with RxJS
 *
 * @layer Application
 */

export interface AuthenticationStatus {
  isAuthenticated: boolean;
  requiresRefresh: boolean;
  token?: string;
}

// Configuration constants - could be moved to configuration service
const TOKEN_REFRESH_THRESHOLD_SECONDS = 60;

@Injectable({ providedIn: 'root' })
export class AuthenticationOrchestrator {
  private auth = inject<AuthRepository>(AUTH_REPOSITORY);
  private clock = inject<ClockPort>(CLOCK_PORT);
  private tokenStore = inject<TokenStoreRepository>(TOKEN_STORE_PORT);

  private refreshInFlight?: Promise<Session>;

  /**
   * Gets the current authentication status without HTTP concerns.
   * This is appropriate for Application layer as it coordinates Domain operations
   * without containing business logic or HTTP-specific code.
   */
  getAuthenticationStatus(): Observable<AuthenticationStatus> {
    return from(this.getTokens()).pipe(
      map((tokens) => {
        if (!tokens?.accessToken) {
          return { isAuthenticated: false, requiresRefresh: false };
        }

        const now = this.clock.nowEpochSeconds();
        const requiresRefresh =
          !!tokens.accessExp && tokens.accessExp - now <= TOKEN_REFRESH_THRESHOLD_SECONDS;

        return {
          isAuthenticated: true,
          requiresRefresh,
          token: tokens.accessToken,
        };
      }),
      catchError((error) => {
        throw ApplicationError.serviceUnavailable('TokenStore', 30);
      })
    );
  }

  /**
   * Ensures authentication is fresh and valid.
   * Coordinates token refresh if needed.
   */
  ensureFreshAuthentication(): Observable<AuthenticationStatus> {
    return this.getAuthenticationStatus().pipe(
      switchMap((status) => {
        if (!status.isAuthenticated) {
          return from([{ isAuthenticated: false, requiresRefresh: false }]);
        }

        if (!status.requiresRefresh) {
          return from([status]);
        }

        // Handle token refresh orchestration
        if (!this.refreshInFlight) {
          this.refreshInFlight = this.performTokenRefresh().finally(() => {
            this.refreshInFlight = undefined;
          });
        }

        return from(this.refreshInFlight).pipe(
          switchMap(() => this.getAuthenticationStatus()),
          catchError((error) => {
            // If refresh fails, return unauthenticated status
            console.warn('Token refresh failed:', error);
            return from([{ isAuthenticated: false, requiresRefresh: false }]);
          }),
          take(1)
        );
      })
    );
  }

  /**
   * Forces a token refresh operation.
   * Used when authentication definitely needs to be refreshed.
   */
  forceTokenRefresh(): Observable<AuthenticationStatus> {
    return from(this.performTokenRefresh()).pipe(
      switchMap(() => this.getAuthenticationStatus()),
      catchError((error) => {
        console.warn('Forced token refresh failed:', error);
        return from([{ isAuthenticated: false, requiresRefresh: false }]);
      })
    );
  }

  private async getTokens() {
    return await this.tokenStore.read();
  }

  /**
   * Performs the actual token refresh operation.
   * Coordinates Domain repository calls and Infrastructure storage.
   */
  private async performTokenRefresh(): Promise<Session> {
    try {
      const tokens = await this.getTokens();

      if (!tokens?.refreshToken) {
        throw ApplicationError.invalidInput('No refresh token available for refresh operation');
      }

      // Coordinate Domain authentication refresh
      const session = await this.auth.refresh(tokens.refreshToken);

      // Transform Session to storage format and coordinate Infrastructure storage
      const tokenSnapshot = this.sessionToTokenSnapshot(session);
      await this.tokenStore.write(tokenSnapshot);

      return session;
    } catch (error) {
      throw ApplicationError.serviceUnavailable('AuthenticationService', 60);
    }
  }

  /**
   * Transforms a Session domain entity to TokenSnapshotContract for Infrastructure storage.
   * This transformation is appropriate for Application layer as it coordinates
   * between Domain entities and Infrastructure contracts without business logic.
   */
  private sessionToTokenSnapshot(session: Session): TokenSnapshotContract {
    return {
      accessToken: session.accessToken.getValue(),
      accessExp: session.accessToken.expSeconds,
      refreshToken: session.refreshToken.getValue(),
    };
  }
}
