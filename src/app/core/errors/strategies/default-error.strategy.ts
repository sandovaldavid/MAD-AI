import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { BaseErrorStrategy } from '../base-error.strategy';
import { FeatureIdentifier, RecoveryAction, RetryConfig } from '../error-strategy.interface';

/**
 * Default error handling strategy for errors not handled by feature-specific strategies
 */
@Injectable()
export class DefaultErrorStrategy extends BaseErrorStrategy {
    constructor() {
        super('global');
    }

    canHandle(error: HttpErrorResponse, feature: FeatureIdentifier): boolean {
        // This strategy can handle any error as a fallback
        return true;
    }

    override getUserMessage(error: HttpErrorResponse, operation: string): string {
        switch (error.status) {
            case 0:
                return 'Sin conexión a internet. Verifica tu conectividad';
            case 400:
                return 'Solicitud inválida. Verifica los datos enviados';
            case 401:
                return 'Tu sesión ha expirado. Inicia sesión nuevamente';
            case 403:
                return 'No tienes permisos para realizar esta acción';
            case 404:
                return 'El recurso solicitado no existe';
            case 408:
                return 'La solicitud tardó demasiado. Intenta de nuevo';
            case 409:
                return 'Conflicto en los datos. Actualiza la página';
            case 422:
                return this.get422Message(error);
            case 429:
                return 'Demasiadas solicitudes. Espera un momento';
            case 500:
                return 'Error interno del servidor. Intenta más tarde';
            case 502:
                return 'Servicio temporalmente no disponible';
            case 503:
                return 'Servicio en mantenimiento. Intenta más tarde';
            case 504:
                return 'Tiempo de espera agotado. Intenta de nuevo';
            default:
                return this.getGenericMessage(error.status, operation);
        }
    }

    private get422Message(error: HttpErrorResponse): string {
        const errorBody = error.error;
        if (errorBody?.message) {
            return errorBody.message;
        }
        if (errorBody?.errors) {
            const firstError = Object.values(errorBody.errors)[0];
            if (Array.isArray(firstError) && firstError.length > 0) {
                return firstError[0];
            }
        }
        return 'Datos de entrada inválidos';
    }

    private getGenericMessage(status: number, operation: string): string {
        if (status >= 400 && status < 500) {
            return 'Error en la solicitud. Verifica los datos e intenta de nuevo';
        }
        if (status >= 500) {
            return 'Error del servidor. El equipo técnico ha sido notificado';
        }
        return `Error inesperado (${status}). Intenta de nuevo o contacta soporte`;
    }

    override getRecoveryActions(error: HttpErrorResponse): RecoveryAction[] {
        const actions: RecoveryAction[] = [];

        switch (error.status) {
            case 0:
                actions.push({
                    label: 'Verificar Conexión',
                    handler: () => {
                        window.open('https://www.google.com', '_blank');
                    },
                    isPrimary: false,
                });
                actions.push({
                    label: 'Reintentar',
                    handler: () => {
                        window.location.reload();
                    },
                    isPrimary: true,
                });
                break;

            case 408:
            case 429:
            case 500:
            case 502:
            case 503:
            case 504:
                actions.push({
                    label: 'Reintentar',
                    handler: () => {
                        window.location.reload();
                    },
                    isPrimary: true,
                });
                break;

            case 409:
                actions.push({
                    label: 'Actualizar Página',
                    handler: () => {
                        window.location.reload();
                    },
                    isPrimary: true,
                });
                break;

            case 422:
                actions.push({
                    label: 'Corregir Datos',
                    handler: () => {}, // Let the form handle this
                    isPrimary: true,
                });
                break;

            default:
                if (error.status >= 500) {
                    actions.push({
                        label: 'Reportar Problema',
                        handler: () => {
                            const subject = `Error ${error.status} reportado`;
                            const body = `Error: ${error.status}\nURL: ${
                                error.url
                            }\nTiempo: ${new Date().toLocaleString()}`;
                            window.location.href = `mailto:soporte@madai.com?subject=${subject}&body=${encodeURIComponent(
                                body
                            )}`;
                        },
                        isPrimary: false,
                    });
                }
                break;
        }

        return actions;
    }

    override shouldRetry(error: HttpErrorResponse): boolean {
        // Retry network errors and specific server errors
        if (error.status === 0) return true;
        if ([408, 429, 500, 502, 503, 504].includes(error.status)) return true;

        return false;
    }

    override getRetryConfig(error: HttpErrorResponse): RetryConfig | null {
        if (!this.shouldRetry(error)) return null;

        // Specific retry configs for different error types
        if (error.status === 0) {
            return {
                maxAttempts: 3,
                delayMs: 2000,
                exponentialBackoff: true,
                retryCondition: (err: HttpErrorResponse) => err.status === 0,
            };
        }

        if (error.status === 429) {
            return {
                maxAttempts: 2,
                delayMs: 5000,
                exponentialBackoff: true,
                retryCondition: (err: HttpErrorResponse) => err.status === 429,
            };
        }

        if ([500, 502, 503, 504].includes(error.status)) {
            return {
                maxAttempts: 2,
                delayMs: 3000,
                exponentialBackoff: true,
                retryCondition: (err: HttpErrorResponse) => err.status >= 500,
            };
        }

        return super.getRetryConfig(error);
    }
}
