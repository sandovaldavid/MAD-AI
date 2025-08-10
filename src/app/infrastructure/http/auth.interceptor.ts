import { HttpInterceptorFn, HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthHttpOrchestrator } from './auth-http.orchestrator';

const RETRIED = 'x-auth-retried';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const orch = inject(AuthHttpOrchestrator);

    const withHeader = (r: HttpRequest<any>, h: { Authorization?: string } | null) =>
        h?.Authorization ? r.clone({ setHeaders: h }) : r;

    return orch.ensureFreshAccess$().pipe(
        switchMap((h) =>
            next(withHeader(req, h)).pipe(
                catchError((err) => {
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
                    return throwError(() => err);
                })
            )
        )
    );
};
