import { ErrorHandler, Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationsFacade } from '@application/facades/notifications.facade';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
    private notify = inject(NotificationsFacade);

    handleError(error: unknown): void {
        // Log detallado para debugging
        console.group('[GlobalErrorHandler] Unhandled Error');
        console.error('Error object:', error);
        console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack available');
        console.groupEnd();

        // Determinar el tipo de error y responder apropiadamente
        if (error instanceof HttpErrorResponse) {
            // Error HTTP que se escapó de nuestros interceptores
            console.warn('[GlobalErrorHandler] HTTP error escaped interceptors:', {
                status: error.status,
                url: error.url,
                message: error.message,
            });
            this.notify.error('Error de conexión. Verifica tu internet y vuelve a intentar');
        } else if (error instanceof Error) {
            // Error de JavaScript/TypeScript
            if (this.isChunkLoadError(error)) {
                this.notify.warning('Aplicación actualizada. Recargando página...');
                setTimeout(() => window.location.reload(), 2000);
                return;
            }

            this.notify.error('Ocurrió un error inesperado. Si persiste, contacta soporte');
        } else {
            // Error desconocido
            this.notify.error('Error inesperado del sistema');
        }

        // TODO: Enviar a servicio de telemetría/logging
        this.sendToTelemetry(error);
    }

    /**
     * Detecta errores de carga de chunks (lazy loading)
     * Común cuando hay una nueva versión de la app desplegada
     */
    private isChunkLoadError(error: Error): boolean {
        return (
            error.message?.includes('Loading chunk') ||
            error.message?.includes('ChunkLoadError') ||
            error.message?.includes('Loading CSS chunk')
        );
    }

    /**
     * Envía error a servicio de telemetría (Sentry, LogRocket, etc.)
     */
    private sendToTelemetry(error: unknown): void {
        // TODO: Implementar según el servicio que uses

        // Ejemplo para Sentry:
        // Sentry.captureException(error);

        // Ejemplo para LogRocket:
        // LogRocket.captureException(error);

        // Por ahora, solo loggeamos que se enviaría
        console.log('[GlobalErrorHandler] Would send to telemetry:', {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            error:
                error instanceof Error
                    ? {
                          name: error.name,
                          message: error.message,
                          stack: error.stack,
                      }
                    : error,
        });
    }
}
