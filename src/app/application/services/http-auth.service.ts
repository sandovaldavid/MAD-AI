import { inject, Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { map, take, catchError, switchMap } from 'rxjs/operators';
import { HttpRequest } from '@angular/common/http';
import { CLOCK_PORT, AUTH_REPOSITORY, TOKEN_STORE_PORT } from '@di/tokens';
import { ApplicationError } from '@application/errors/application-error';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { AuthRepository } from '@domain/repositories/business/auth.repository';
import type { TokenStoreRepository } from '@domain/repositories/session/token-store.repository';
import type { TokenSnapshotContract } from '@domain/repositories/session/token-store.contract';
import type { Session } from '@domain/entities/session.entity';

type AuthHeader = { Authorization?: string } | null;
const SKEW_SECONDS = 60;

@Injectable({ providedIn: 'root' })
export class AuthHttpOrchestrator {
  private auth = inject<AuthRepository>(AUTH_REPOSITORY);
  private clock = inject<ClockPort>(CLOCK_PORT);
  private tokenStore = inject<TokenStoreRepository>(TOKEN_STORE_PORT);

  withAuth(req: HttpRequest<unknown>, header: AuthHeader): HttpRequest<unknown> {
    return header?.Authorization ? req.clone({ setHeaders: header }) : req;
  }

  private async getLocalTokens() {
    return await this.tokenStore.read();
  }

  private buildHeader(tokens: TokenSnapshotContract | null): AuthHeader {
    return tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : null;
  }

  private refreshInFlight?: Promise<Session>;

  /**
   * Transforms a Session entity to TokenSnapshotContract for storage compatibility
   */
  private sessionToTokenSnapshot(session: Session): TokenSnapshotContract {
    return {
      accessToken: session.access.getValue(),
      accessExp: session.access.expSeconds,
      refreshToken: session.refresh.getValue(),
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
                throw ApplicationError.invalidInput('No refresh token available');
              }
              return this.auth.refresh(tokens.refreshToken);
            })
            .then((session) => {
              // Convert Session to TokenSnapshotContract and store it
              const tokenSnapshot = this.sessionToTokenSnapshot(session);
              return this.tokenStore.write(tokenSnapshot).then(() => session);
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
          catchError(() => from([null])), // 👈 deja pasar la request; si expira, el 401 activará el retry
          take(1)
        );
      })
    );
  }

  forceRefreshOnce$(): Observable<AuthHeader> {
    return from(this.getLocalTokens()).pipe(
      switchMap((tokens) => {
        if (!tokens?.refreshToken) {
          throw ApplicationError.invalidInput('No refresh token available');
        }
        return this.auth.refresh(tokens.refreshToken);
      }),
      switchMap((session) => {
        // Convert Session to TokenSnapshotContract and store it
        const tokenSnapshot = this.sessionToTokenSnapshot(session);
        return from(this.tokenStore.write(tokenSnapshot)).pipe(map(() => tokenSnapshot));
      }),
      map((tokens) => this.buildHeader(tokens)),
      catchError(() => from([null])), // 👈 evita romper el retry si el refresh falla
      take(1)
    );
  }
}
