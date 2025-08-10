import { ErrorHandler, Injectable } from '@angular/core';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
    handleError(error: unknown): void {
        // ⇩ Aquí centralizas errores no capturados
        console.error('[GlobalErrorHandler]', error);

        // TODO (opcional): enviar a tu logger/telemetría (Sentry, etc.)
        // TODO (opcional): disparar un toast/notificación de "Ocurrió un error inesperado"
    }
}
