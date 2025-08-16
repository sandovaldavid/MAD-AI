import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { BaseErrorStrategy } from '../base-error.strategy';
import { FeatureIdentifier, RecoveryAction, RetryConfig } from '../error-strategy.interface';

/**
 * Roles management specific error handling strategy
 */
@Injectable()
export class RolesErrorStrategy extends BaseErrorStrategy {
    private router = inject(Router);

    constructor() {
        super('roles');
    }

    canHandle(error: HttpErrorResponse, feature: FeatureIdentifier): boolean {
        return feature === 'roles' || this.isRoleManagementError(error);
    }

    private isRoleManagementError(error: HttpErrorResponse): boolean {
        const url = error.url?.toLowerCase() || '';
        return url.includes('/roles') || url.includes('/permissions');
    }

    override getUserMessage(error: HttpErrorResponse, operation: string): string {
        switch (error.status) {
            case 403:
                return this.get403Message(operation);
            case 404:
                return this.get404Message(operation);
            case 409:
                return this.get409Message(operation);
            case 422:
                return this.get422Message(error, operation);
            case 500:
            case 502:
            case 503:
                return 'Error del servidor en gestión de roles. Intenta más tarde';
            default:
                return this.getDefaultMessage(operation);
        }
    }

    private get403Message(operation: string): string {
        const messages: Record<string, string> = {
            'create-role': 'No tienes permisos para crear roles',
            'update-role': 'No tienes permisos para modificar este rol',
            'delete-role': 'No tienes permisos para eliminar roles',
            'assign-role': 'No tienes permisos para asignar roles',
            'view-roles': 'No tienes permisos para ver la gestión de roles',
        };

        return messages[operation] || 'No tienes permisos para gestionar roles';
    }

    private get404Message(operation: string): string {
        const messages: Record<string, string> = {
            'get-role': 'El rol solicitado no existe',
            'update-role': 'No se puede actualizar: el rol no existe',
            'delete-role': 'No se puede eliminar: el rol no existe',
            'assign-role': 'El rol que intentas asignar no existe',
        };

        return messages[operation] || 'Rol no encontrado';
    }

    private get409Message(operation: string): string {
        const messages: Record<string, string> = {
            'create-role': 'Ya existe un rol con ese nombre',
            'delete-role': 'No se puede eliminar: el rol está siendo usado por usuarios',
            'update-role': 'Conflicto al actualizar: otro administrador modificó el rol',
        };

        return messages[operation] || 'Conflicto en la gestión de roles';
    }

    private get422Message(error: HttpErrorResponse, operation: string): string {
        const errorBody = error.error;
        if (errorBody?.errors) {
            const firstError = Object.values(errorBody.errors)[0];
            if (Array.isArray(firstError) && firstError.length > 0) {
                return this.translateValidationError(firstError[0], operation);
            }
        }
        return 'Datos del rol inválidos';
    }

    private translateValidationError(error: string, operation: string): string {
        const translations: Record<string, string> = {
            'name already exists': 'Ya existe un rol con este nombre',
            'name too short': 'El nombre del rol debe tener al menos 3 caracteres',
            'name too long': 'El nombre del rol no puede exceder 50 caracteres',
            'invalid access level': 'Nivel de acceso inválido',
            'description too long': 'La descripción es demasiado larga',
            'required field': 'Este campo es obligatorio',
            'invalid characters': 'El nombre contiene caracteres no permitidos',
        };

        return translations[error.toLowerCase()] || `Error de validación: ${error}`;
    }

    private getDefaultMessage(operation: string): string {
        const messages: Record<string, string> = {
            'create-role': 'Error al crear el rol',
            'update-role': 'Error al actualizar el rol',
            'delete-role': 'Error al eliminar el rol',
            'get-roles': 'Error al cargar los roles',
            'assign-role': 'Error al asignar el rol',
        };

        return messages[operation] || 'Error en la gestión de roles';
    }

    override getRecoveryActions(error: HttpErrorResponse): RecoveryAction[] {
        const actions: RecoveryAction[] = [];

        switch (error.status) {
            case 403:
                actions.push({
                    label: 'Contactar Administrador',
                    handler: () => {
                        window.location.href =
                            'mailto:admin@madai.com?subject=Solicitud de permisos de roles';
                    },
                    isPrimary: true,
                });
                break;

            case 404:
                actions.push({
                    label: 'Ver Todos los Roles',
                    handler: () => {
                        this.router.navigate(['/roles']);
                    },
                    isPrimary: true,
                });
                break;

            case 409:
                actions.push({
                    label: 'Refrescar Lista',
                    handler: () => {
                        window.location.reload();
                    },
                    isPrimary: true,
                });
                break;

            case 422:
                actions.push({
                    label: 'Corregir Formulario',
                    handler: () => {}, // Let the form handle this
                    isPrimary: true,
                });
                break;

            case 500:
            case 502:
            case 503:
                actions.push({
                    label: 'Reintentar',
                    handler: () => {
                        window.location.reload();
                    },
                    isPrimary: true,
                });
                break;
        }

        return actions;
    }

    override shouldRetry(error: HttpErrorResponse): boolean {
        // Don't retry client errors (4xx) except for 408 and 429
        if (error.status >= 400 && error.status < 500) {
            return error.status === 408 || error.status === 429;
        }

        // Use parent retry logic for other errors
        return super.shouldRetry(error);
    }

    override getRetryConfig(error: HttpErrorResponse): RetryConfig | null {
        if (!this.shouldRetry(error)) return null;

        // Conservative retry for role management operations
        return {
            maxAttempts: 2,
            delayMs: 2000,
            exponentialBackoff: true,
            retryCondition: (err: HttpErrorResponse) =>
                err.status === 0 || err.status >= 500 || err.status === 408 || err.status === 429,
        };
    }
}
