import { inject, Injectable } from '@angular/core';
import { HttpRequest } from '@angular/common/http';
import { from, Observable } from 'rxjs';
import { map, take, catchError, switchMap } from 'rxjs/operators';
import { CLOCK_PORT, AUTH_REPOSITORY, TOKEN_STORE_PORT } from '@di/tokens';
import { InfrastructureError } from '@infrastructure/errors/infrastructure-error';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { AuthRepository } from '@domain/repositories/business/auth.repository';
import type { TokenStoreRepository } from '@domain/repositories/session/token-store.repository';
import type { TokenSnapshotContract } from '@domain/repositories/session/token-store.contract';
import type { Session } from '@domain/entities/session.entity';

/**
 * Infrastructure Layer Service for HTTP Authentication
 *
 * @description
 * Implements HTTP authentication concerns using concrete Angular HTTP technology.
 * This service contains all HTTP-specific authentication logic and token management.
 *
 * @responsibilities
 * - Handle HttpRequest authentication headers
 * - Manage token refresh operations with real HTTP clients
 * - Coordinate authentication with browser storage
 * - Transform between Domain entities and HTTP infrastructure
 *
 * @architecture
 * - Technology-specific implementation using Angular HttpClient
 * - Handles concrete HTTP request/response cycles
 * - Implements Application layer contracts for authentication
 * - Uses real browser storage and HTTP infrastructure
 *
 * @layer Infrastructure
 */

type AuthHeader = { Authorization?: string } | null;

// Configuration constants - could be moved to configuration service
const SKEW_SECONDS = 60;

@Injectable({ providedIn: 'root' })
export class HttpAuthService {
  private auth = inject<AuthRepository>(AUTH_REPOSITORY);
  private clock = inject<ClockPort>(CLOCK_PORT);
  private tokenStore = inject<TokenStoreRepository>(TOKEN_STORE_PORT);

  /**
   * Adds authentication headers to HttpRequest objects.
   * This is Infrastructure-specific as it works with Angular's HttpRequest type.
   */
  withAuth(req: HttpRequest<unknown>, header: AuthHeader): HttpRequest<unknown> {
    return header?.Authorization ? req.clone({ setHeaders: header }) : req;
  }

  private async getLocalTokens() {
    try {
      return await this.tokenStore.read();
    } catch (error) {
      throw new InfrastructureError(
        'Failed to read tokens from storage',
        'TOKEN_STORAGE_READ_FAILED',
        'API',
        true,
        { operation: 'getLocalTokens' },
        undefined,
        error
      );
    }
  }

  private buildHeader(tokens: TokenSnapshotContract | null): AuthHeader {
    return tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : null;
  }

  private refreshInFlight?: Promise<Session>;

  /**
   * Transforms a Session domain entity to TokenSnapshotContract for infrastructure storage.
   * This transformation is appropriate for Infrastructure layer as it handles
   * concrete storage format requirements.
   */
  private sessionToTokenSnapshot(session: Session): TokenSnapshotContract {
    return {
      accessToken: session.accessToken.getValue(),
      accessExp: session.accessToken.expSeconds,
      refreshToken: session.refreshToken.getValue(),
    };
  }

  ensureFreshAccess$(): Observable<AuthHeader> {
    return from(this.getLocalTokens()).pipe(
      switchMap((t) => {
        if (!t?.accessToken) return from([null]).pipe(take(1));

        const now = this.clock.nowEpochSeconds();
        const needsRefresh = !!t.accessExp && t.accessExp - now <= SKEW_SECONDS;

        if (!needsRefresh) return from([this.buildHeader(t)]).pipe(take(1));

        if (!this.refreshInFlight) {
          this.refreshInFlight = this.getLocalTokens()
            .then((tokens) => {
              if (!tokens?.refreshToken) {
                throw new InfrastructureError(
                  'No refresh token available for authentication',
                  'REFRESH_TOKEN_MISSING',
                  'API',
                  false,
                  { operation: 'tokenRefresh' }
                );
              }
              return this.auth.refresh(tokens.refreshToken);
            })
            .then((session) => {
              // Convert Session to TokenSnapshotContract and store it
              const tokenSnapshot = this.sessionToTokenSnapshot(session);
              return this.tokenStore.write(tokenSnapshot).then(() => session);
            })
            .catch((error) => {
              throw new InfrastructureError(
                'Token refresh failed',
                'TOKEN_REFRESH_FAILED',
                'API',
                true,
                { operation: 'tokenRefresh' },
                undefined,
                error
              );
            })
            .finally(() => {
              this.refreshInFlight = undefined;
            });
        }

        return from(this.refreshInFlight).pipe(
          switchMap((session) => {
            // Convert Session to TokenSnapshotContract for header building
            const tokenSnapshot = this.sessionToTokenSnapshot(session);
            return from([tokenSnapshot]);
          }),
          map((tokens) => this.buildHeader(tokens)),
          catchError((error) => {
            // Let the request pass through; if it expires, 401 will trigger retry
            console.warn('Token refresh failed during request authentication:', error);
            return from([null]);
          }),
          take(1)
        );
      })
    );
  }

  forceRefreshOnce$(): Observable<AuthHeader> {
    return from(this.getLocalTokens()).pipe(
      switchMap((tokens) => {
        if (!tokens?.refreshToken) {
          throw new InfrastructureError(
            'No refresh token available for forced refresh',
            'REFRESH_TOKEN_MISSING',
            'API',
            false,
            { operation: 'forceRefresh' }
          );
        }
        return this.auth.refresh(tokens.refreshToken);
      }),
      switchMap((session) => {
        // Convert Session to TokenSnapshotContract and store it
        const tokenSnapshot = this.sessionToTokenSnapshot(session);
        return from(this.tokenStore.write(tokenSnapshot)).pipe(map(() => tokenSnapshot));
      }),
      map((tokens) => this.buildHeader(tokens)),
      catchError((error) => {
        // Prevent breaking the retry if refresh fails
        console.warn('Forced token refresh failed:', error);
        return from([null]);
      }),
      take(1)
    );
  }
}
