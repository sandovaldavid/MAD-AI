import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { BaseErrorStrategy } from '../base-error.strategy';
import { FeatureIdentifier, RecoveryAction, RetryConfig } from '../error-strategy.interface';

/**
 * Authentication-specific error handling strategy
 */
@Injectable()
export class AuthErrorStrategy extends BaseErrorStrategy {
    private router = inject(Router);

    constructor() {
        super('auth');
    }

    canHandle(error: HttpErrorResponse, feature: FeatureIdentifier): boolean {
        return feature === 'auth' || this.isAuthError(error);
    }

    private isAuthError(error: HttpErrorResponse): boolean {
        return (
            error.status === 400 ||
            error.status === 401 ||
            error.status === 403 ||
            (error.status === 422 && this.isAuthValidationError(error))
        );
    }

    private isAuthValidationError(error: HttpErrorResponse): boolean {
        const errorBody = error.error;
        if (!errorBody || !errorBody.errors) return false;

        const authFields = ['email', 'password', 'username', 'credentials'];
        return authFields.some((field) => errorBody.errors[field]);
    }

    override getUserMessage(error: HttpErrorResponse, operation: string): string {
        switch (error.status) {
            case 400:
                return this.get400Message(error, operation);
            case 401:
                return this.get401Message(operation);
            case 403:
                return 'No tienes permisos para realizar esta acción';
            case 422:
                return this.get422Message(error, operation);
            case 429:
                return 'Demasiados intentos. Intenta de nuevo más tarde';
            case 500:
            case 502:
            case 503:
                return 'Servicio de autenticación temporalmente no disponible';
            default:
                return 'Error de autenticación. Intenta de nuevo';
        }
    }

    private get400Message(error: HttpErrorResponse, operation: string): string {
        const errorBody = error.error;

        // Add detailed logging to see what the API is returning
        console.log('[AuthErrorStrategy] 400 Error Details:', {
            operation,
            status: error.status,
            errorBody,
            url: error.url,
        });

        // Log the complete errorBody structure
        console.log('[AuthErrorStrategy] Complete errorBody:', JSON.stringify(errorBody, null, 2));

        // Check for specific error messages in the response
        if (errorBody?.message) {
            const message = errorBody.message.toLowerCase();
            console.log('[AuthErrorStrategy] Found message:', message);
            if (message.includes('email') && message.includes('already')) {
                return 'Este email ya está registrado. Intenta con otro email';
            }
            if (message.includes('username') && message.includes('already')) {
                return 'Este nombre de usuario ya está en uso. Intenta con otro';
            }
            if (message.includes('invalid') && message.includes('email')) {
                return 'Formato de email inválido';
            }
        }

        // Check for error field (specific to this API)
        if (errorBody?.error) {
            const errorMessage = errorBody.error.toLowerCase();
            console.log('[AuthErrorStrategy] Found error field:', errorMessage);

            // Check for UserAlreadyExistsException pattern with email
            if (
                errorMessage.includes('useralreadyexistsexception') &&
                errorMessage.includes('email')
            ) {
                return 'Este email ya está registrado. Intenta con otro email';
            }

            // Check for UserAlreadyExistsException pattern with username
            if (
                errorMessage.includes('useralreadyexistsexception') &&
                errorMessage.includes('username')
            ) {
                return 'Este nombre de usuario ya está en uso. Intenta con otro';
            }

            // Check for generic UserAlreadyExistsException (fallback to email)
            if (errorMessage.includes('useralreadyexistsexception')) {
                return 'Este email ya está registrado. Intenta con otro email';
            }

            // Check for specific email errors
            if (errorMessage.includes('email') && errorMessage.includes('already')) {
                return 'Este email ya está registrado. Intenta con otro email';
            }

            // Check for specific username errors
            if (errorMessage.includes('username') && errorMessage.includes('already')) {
                return 'Este nombre de usuario ya está en uso. Intenta con otro';
            }

            // Check for generic user already exists
            if (errorMessage.includes('user') && errorMessage.includes('already exists')) {
                // Try to determine if it's email or username based on context
                if (errorMessage.includes('email')) {
                    return 'Este email ya está registrado. Intenta con otro email';
                } else if (errorMessage.includes('username')) {
                    return 'Este nombre de usuario ya está en uso. Intenta con otro';
                } else {
                    // Default to email if we can't determine
                    return 'Este email ya está registrado. Intenta con otro email';
                }
            }

            if (errorMessage.includes('invalid') && errorMessage.includes('email')) {
                return 'Formato de email inválido';
            }
        }

        // Check for errors object (validation errors)
        if (errorBody?.errors) {
            console.log('[AuthErrorStrategy] Found errors object:', errorBody.errors);
            const firstError = Object.values(errorBody.errors)[0];
            if (Array.isArray(firstError) && firstError.length > 0) {
                console.log('[AuthErrorStrategy] First error:', firstError[0]);
                return this.translateValidationError(firstError[0], operation);
            }
        }

        // Check for detail field
        if (errorBody?.detail) {
            console.log('[AuthErrorStrategy] Found detail:', errorBody.detail);
            return this.translateValidationError(errorBody.detail, operation);
        }

        // Check for non_field_errors (common in Django REST Framework)
        if (errorBody?.non_field_errors) {
            console.log('[AuthErrorStrategy] Found non_field_errors:', errorBody.non_field_errors);
            const firstError = Array.isArray(errorBody.non_field_errors)
                ? errorBody.non_field_errors[0]
                : errorBody.non_field_errors;
            return this.translateValidationError(firstError, operation);
        }

        // Check for generic error field as fallback
        if (errorBody?.error && typeof errorBody.error === 'string') {
            console.log('[AuthErrorStrategy] Found generic error field:', errorBody.error);
            return this.translateValidationError(errorBody.error, operation);
        }

        // Fallback based on operation
        const operationMessages: Record<string, string> = {
            register: 'Error en el registro. Verifica tus datos',
            login: 'Error en el login. Verifica tus credenciales',
        };

        return operationMessages[operation] || 'Datos inválidos. Verifica la información';
    }

    private get401Message(operation: string): string {
        const messages: Record<string, string> = {
            login: 'Credenciales inválidas. Verifica tu email y contraseña',
            register: 'Error en el registro. Verifica tus datos',
            refresh: 'Tu sesión ha expirado. Inicia sesión nuevamente',
            logout: 'Error al cerrar sesión',
            'confirm-email': 'Token de confirmación inválido o expirado',
            'reset-password': 'Token de recuperación inválido o expirado',
        };

        return messages[operation] || 'Credenciales inválidas o sesión expirada';
    }

    private get422Message(error: HttpErrorResponse, operation: string): string {
        const errorBody = error.error;
        if (errorBody?.errors) {
            const firstError = Object.values(errorBody.errors)[0];
            if (Array.isArray(firstError) && firstError.length > 0) {
                return this.translateValidationError(firstError[0], operation);
            }
        }
        return 'Datos de entrada inválidos';
    }

    private translateValidationError(error: string, operation: string): string {
        const errorLower = error.toLowerCase();

        console.log('[AuthErrorStrategy] Translating error:', { error, errorLower, operation });

        const translations: Record<string, string> = {
            'email already exists': 'Este email ya está registrado',
            'email already registered': 'Este email ya está registrado',
            'user already exists': 'Este email ya está registrado',
            'already exists': 'Este email ya está registrado',
            'email is already taken': 'Este email ya está registrado',
            'email already in use': 'Este email ya está registrado',
            'duplicate email': 'Este email ya está registrado',
            'user with email': 'Este email ya está registrado',
            'username already exists': 'Este nombre de usuario ya está en uso',
            'username already in use': 'Este nombre de usuario ya está en uso',
            'duplicate username': 'Este nombre de usuario ya está en uso',
            'user with username': 'Este nombre de usuario ya está en uso',
            'username is already taken': 'Este nombre de usuario ya está en uso',
            'invalid email format': 'Formato de email inválido',
            'invalid email': 'Formato de email inválido',
            'password too short': 'La contraseña debe tener al menos 8 caracteres',
            'password too weak': 'La contraseña debe incluir mayúsculas, minúsculas y números',
            'username too short': 'El nombre de usuario debe tener al menos 3 caracteres',
            'required field': 'Este campo es obligatorio',
            'field is required': 'Este campo es obligatorio',
            'invalid credentials': 'Credenciales inválidas',
            'user with this email already exists': 'Este email ya está registrado',
            'user with this username already exists': 'Este nombre de usuario ya está en uso',
            'this field must be unique': 'Este campo debe ser único',
            'unique constraint': 'Este valor ya está en uso',
        };

        // Check for partial matches for better error detection
        // First, check for specific username patterns
        if (errorLower.includes('username')) {
            for (const [key, value] of Object.entries(translations)) {
                if (key.includes('username') && errorLower.includes(key)) {
                    console.log('[AuthErrorStrategy] Found username translation:', { key, value });
                    return value;
                }
            }
        }

        // Then check for specific email patterns
        if (errorLower.includes('email')) {
            for (const [key, value] of Object.entries(translations)) {
                if (key.includes('email') && errorLower.includes(key)) {
                    console.log('[AuthErrorStrategy] Found email translation:', { key, value });
                    return value;
                }
            }
        }

        // Finally, check for general patterns
        for (const [key, value] of Object.entries(translations)) {
            if (errorLower.includes(key)) {
                console.log('[AuthErrorStrategy] Found general translation:', { key, value });
                return value;
            }
        }

        console.log('[AuthErrorStrategy] No translation found, returning original error:', error);
        return error;
    }

    override getRecoveryActions(error: HttpErrorResponse): RecoveryAction[] {
        const actions: RecoveryAction[] = [];

        switch (error.status) {
            case 400:
                actions.push({
                    label: 'Corregir Datos',
                    handler: () => {}, // Let the form handle this
                    isPrimary: true,
                });
                break;

            case 401:
                actions.push({
                    label: 'Ir a Login',
                    handler: () => {
                        this.router.navigate(['/auth/login']);
                    },
                    isPrimary: true,
                });
                break;

            case 403:
                actions.push({
                    label: 'Contactar Soporte',
                    handler: () => {
                        window.location.href = 'mailto:soporte@madai.com';
                    },
                    isPrimary: false,
                });
                break;

            case 422:
                actions.push({
                    label: 'Corregir Datos',
                    handler: () => {}, // Let the form handle this
                    isPrimary: true,
                });
                break;

            case 429:
                actions.push({
                    label: 'Esperar e Intentar',
                    handler: () => {
                        setTimeout(() => window.location.reload(), 60000);
                    },
                    isPrimary: true,
                });
                break;
        }

        return actions;
    }

    override shouldRetry(error: HttpErrorResponse): boolean {
        // Never retry 400, 401, 403, 422 - these are client errors that won't resolve with retry
        if ([400, 401, 403, 422].includes(error.status)) return false;

        // Retry rate limiting with backoff
        if (error.status === 429) return true;

        // Use parent retry logic for network/server errors
        return super.shouldRetry(error);
    }

    override getRetryConfig(error: HttpErrorResponse): RetryConfig | null {
        if (!this.shouldRetry(error)) return null;

        // Special handling for rate limiting
        if (error.status === 429) {
            return {
                maxAttempts: 2,
                delayMs: 5000,
                exponentialBackoff: true,
                retryCondition: (err: HttpErrorResponse) => err.status === 429,
            };
        }

        return super.getRetryConfig(error);
    }
}
