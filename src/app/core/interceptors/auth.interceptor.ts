import { inject } from '@angular/core';
import {
    HttpInterceptorFn,
    HttpRequest,
    HttpHandlerFn,
    HttpEvent,
    HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, catchError } from 'rxjs';
import { TokenService } from '@core/services/token.service';
import { Router } from '@angular/router';

/**
 * Interceptor limpio y directo para autenticación
 * Solo agrega tokens y maneja 401s sin loops complejos
 */
export const advancedAuthInterceptor: HttpInterceptorFn = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
    const tokenService = inject(TokenService);
    const router = inject(Router);

    // No interceptar solo las rutas de auth específicas que no necesitan token
    // Estas rutas NO necesitan token: login, register, refresh-token, reset-password
    const authRoutesWithoutToken = [
        '/auth/login/',
        '/auth/register/',
        '/auth/refresh-token/',
        '/auth/reset-password/',
        '/auth/confirm-email/',
    ];

    if (authRoutesWithoutToken.some((route) => req.url.includes(route))) {
        return next(req);
    }

    const token = tokenService.getAccessToken();

    // Si no hay token, continuar sin autorización
    if (!token) {
        return next(req);
    }

    // Agregar token a la request
    const authReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
    });

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            // Si recibimos 401, limpiar tokens y redirigir al login
            if (error.status === 401) {
                console.warn('🔴 [AuthInterceptor] Token inválido, redirigiendo al login');
                tokenService.clearTokens();
                router.navigate(['/auth/login']);
            }
            return throwError(() => error);
        })
    );
};
