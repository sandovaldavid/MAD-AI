import { inject, Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { map, take, catchError, switchMap } from 'rxjs/operators';
import { HttpRequest } from '@angular/common/http';
import { CLOCK_PORT, AUTH_REPOSITORY, TOKEN_STORE_PORT } from '../../di/tokens';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { AuthRepository } from '@domain/repositories/business/auth.repository';
import type { TokenStorePort } from '@domain/repositories/session/session-store.repository';
import type { Session } from '@domain/entities/session.entity';

type AuthHeader = { Authorization?: string } | null;
const SKEW_SECONDS = 60;

@Injectable({ providedIn: 'root' })
export class AuthHttpOrchestrator {
  private auth = inject<AuthRepository>(AUTH_REPOSITORY);
  private clock = inject<ClockPort>(CLOCK_PORT);
  private tokenStore = inject<TokenStorePort>(TOKEN_STORE_PORT);

  withAuth(req: HttpRequest<any>, header: AuthHeader): HttpRequest<any> {
    return header?.Authorization ? req.clone({ setHeaders: header }) : req;
  }

  private async getLocalTokens() {
    return await this.tokenStore.read();
  }

  private buildHeader(tokens: any): AuthHeader {
    return tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : null;
  }
  private refreshInFlight?: Promise<Session>;

  ensureFreshAccess$(): Observable<AuthHeader> {
    return from(this.getLocalTokens()).pipe(
      switchMap((t) => {
        if (!t?.accessToken) return from([null]).pipe(take(1));

        const now = this.clock.nowEpochSeconds();
        const needsRefresh = !!t.accessExp && t.accessExp - now <= SKEW_SECONDS;

        if (!needsRefresh) return from([this.buildHeader(t)]).pipe(take(1));

        if (!this.refreshInFlight) {
          this.refreshInFlight = this.auth.refresh().finally(() => {
            this.refreshInFlight = undefined;
          });
        }

        return from(this.refreshInFlight).pipe(
          switchMap(() => from(this.getLocalTokens())),
          map((tokens) => this.buildHeader(tokens)),
          catchError(() => from([null])), // 👈 deja pasar la request; si expira, el 401 activará el retry
          take(1)
        );
      })
    );
  }

  forceRefreshOnce$(): Observable<AuthHeader> {
    return from(this.auth.refresh()).pipe(
      switchMap(() => from(this.getLocalTokens())),
      map((tokens) => this.buildHeader(tokens)),
      catchError(() => from([null])), // 👈 evita romper el retry si el refresh falla
      take(1)
    );
  }
}
