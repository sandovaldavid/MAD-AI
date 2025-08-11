import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { NotificationsFacade } from '@application/facades/notifications.facade';

// Ajusta si tu ValidationError tiene otra forma
function extractMessage(err: any): string {
    if (!err) return 'Error de validación';
    if (typeof err === 'string') return err;
    if (err.message) return err.message;
    if (err.detail) return err.detail;
    if (err.errors && typeof err.errors === 'object') {
        const firstKey = Object.keys(err.errors)[0];
        const firstMsg = Array.isArray(err.errors[firstKey])
            ? err.errors[firstKey][0]
            : err.errors[firstKey];
        return String(firstMsg ?? 'Error de validación');
    }
    return 'Error de validación';
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const notify = inject(NotificationsFacade);
    return next(req).pipe(
        catchError((err) => {
            if (err instanceof HttpErrorResponse && err.status === 400) {
                const msg = extractMessage(err.error);
                notify.warning(msg);
            }
            return throwError(() => err);
        })
    );
};
