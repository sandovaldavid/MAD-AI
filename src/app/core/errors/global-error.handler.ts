import { ErrorHandler, Injectable, inject } from '@angular/core';
import { NotificationsFacade } from '@application/facades/notifications.facade';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
    private notify = inject(NotificationsFacade);

    handleError(error: unknown): void {
        //* Errores no controlados - Centralizado
        console.error('[GlobalErrorHandler]', error);
        this.notify.error('Ocurrió un error inesperado');

        // TODO (opcional): enviar a tu logger/telemetría (Sentry, etc.)
        // TODO (opcional): disparar un toast/notificación de "Ocurrió un error inesperado"
    }
}
