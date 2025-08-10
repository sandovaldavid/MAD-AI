import { inject, Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { map, take, catchError } from 'rxjs/operators';
import { HttpRequest } from '@angular/common/http';
import { CLOCK_PORT, AUTH_REPOSITORY } from '../../di/tokens';
import type { ClockPort } from '@domain/ports/clock.port';
import type { AuthRepository } from '@domain/repositories/auth.repository';
import type { Session } from '@domain/entities/session.entity';

type AuthHeader = { Authorization?: string } | null;
const SKEW_SECONDS = 60;

@Injectable({ providedIn: 'root' })
export class AuthHttpOrchestrator {
    private auth = inject<AuthRepository>(AUTH_REPOSITORY);
    private clock = inject<ClockPort>(CLOCK_PORT);

    withAuth(req: HttpRequest<any>, header: AuthHeader): HttpRequest<any> {
        return header?.Authorization ? req.clone({ setHeaders: header }) : req;
    }

    private buildHeader(): AuthHeader {
        const s = this.auth.getLocalTokens();
        return s?.accessToken ? { Authorization: `Bearer ${s.accessToken}` } : null;
    }
    private refreshInFlight?: Promise<Session>;

    ensureFreshAccess$(): Observable<AuthHeader> {
        const t = this.auth.getLocalTokens();
        if (!t?.accessToken) return from([null]).pipe(take(1));

        const now = this.clock.nowEpochSeconds();
        const needsRefresh = !!t.accessExp && t.accessExp - now <= SKEW_SECONDS;

        if (!needsRefresh) return from([this.buildHeader()]).pipe(take(1));

        if (!this.refreshInFlight) {
            this.refreshInFlight = this.auth.refresh().finally(() => {
                this.refreshInFlight = undefined;
            });
        }

        return from(this.refreshInFlight).pipe(
            map(() => this.buildHeader()),
            catchError(() => from([null])), // 👈 deja pasar la request; si expira, el 401 activará el retry
            take(1)
        );
    }

    forceRefreshOnce$(): Observable<AuthHeader> {
        return from(this.auth.refresh()).pipe(
            map(() => this.buildHeader()),
            catchError(() => from([null])), // 👈 evita romper el retry si el refresh falla
            take(1)
        );
    }
}
