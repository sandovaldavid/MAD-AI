import { HttpInterceptorFn, HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthHttpOrchestrator } from './auth-http.orchestrator';
import { Router } from '@angular/router';
import { ReturnUrlService } from '@core/services/return-url.service';
import { environment } from '@/env/environment';

const RETRIED = 'x-auth-retried';
const AUTH_API_PREFIX = `${environment.API_URL}/auth/`;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const orch = inject(AuthHttpOrchestrator);
    const router = inject(Router);
    const returnUrl = inject(ReturnUrlService);

    const withHeader = (rq: HttpRequest<any>, h: { Authorization?: string } | null) =>
        h?.Authorization ? rq.clone({ setHeaders: h }) : rq;

    return orch.ensureFreshAccess$().pipe(
        switchMap((h) =>
            next(withHeader(req, h)).pipe(
                catchError((err) => {
                    // Reintento una vez si 401
                    if (
                        err instanceof HttpErrorResponse &&
                        err.status === 401 &&
                        !req.headers.has(RETRIED)
                    ) {
                        return orch
                            .forceRefreshOnce$()
                            .pipe(
                                switchMap((h2) =>
                                    next(
                                        withHeader(
                                            req.clone({ setHeaders: { [RETRIED]: '1' } }),
                                            h2
                                        )
                                    )
                                )
                            );
                    }

                    // Si sigue 401 (y no es un endpoint de auth), mandamos a login
                    if (
                        err instanceof HttpErrorResponse &&
                        err.status === 401 &&
                        !req.url.startsWith(AUTH_API_PREFIX)
                    ) {
                        const current = router.url; // incluye querystring actual
                        returnUrl.set(current);
                        router.navigate(['/auth/login'], { queryParams: { returnUrl: current } });
                    }

                    return throwError(() => err);
                })
            )
        )
    );
};
