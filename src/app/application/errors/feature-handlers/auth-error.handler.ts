import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import type { HttpErrorClassification } from '@core/cross-cutting/http';

/**
 * Authentication Feature Error Handler - Application Layer
 * 
 * @description Handles authentication-specific business logic for error processing.
 * Contains feature-specific knowledge and business rules for auth domain.
 * Coordinates between Core technical classification and Domain business errors.
 * 
 * @architecturalNotes
 * - Application Layer: Business logic allowed
 * - Can use Core technical services
 * - Can use Domain entities/errors
 * - Contains feature-specific knowledge
 * - Orchestrates error handling for auth features
 */
@Injectable({
    providedIn: 'root',
})
export class AuthErrorHandler {
    private router = inject(Router);

    /**
     * Determines if this handler can process the error based on business context
     */
    canHandle(error: HttpErrorResponse, context?: ErrorHandlingContext): boolean {
        return context?.feature === 'auth' || this.isAuthError(error);
    }

    /**
     * Processes authentication errors with business logic
     */
    handle(
        error: HttpErrorResponse, 
        technicalClassification: HttpErrorClassification,
        context: ErrorHandlingContext
    ): AuthErrorResult {
        const userMessage = this.getUserMessage(error, context.operation);
        const recoveryActions = this.getRecoveryActions(error, context.operation);
        
        return {
            userMessage,
            recoveryActions,
            shouldRedirect: this.shouldRedirect(error, context.operation),
            redirectUrl: this.getRedirectUrl(error, context.operation),
            shouldRetry: technicalClassification.isRetryable && this.isBusinessRetryable(error),
            businessContext: {
                feature: 'auth',
                operation: context.operation,
                isSecurityRelated: this.isSecurityRelated(error),
                requiresReauthentication: this.requiresReauthentication(error),
            }
        };
    }

    /**
     * Business logic: Determines if error is auth-related
     */
    private isAuthError(error: HttpErrorResponse): boolean {
        const url = error.url?.toLowerCase() || '';
        return (
            url.includes('/auth/') ||
            url.includes('/login') ||
            url.includes('/register') ||
            url.includes('/logout') ||
            (error.status === 401) ||
            (error.status === 422 && this.isAuthValidationError(error))
        );
    }

    /**
     * Business logic: Auth-specific validation error detection
     */
    private isAuthValidationError(error: HttpErrorResponse): boolean {
        const errorBody = error.error;
        if (!errorBody || !errorBody.errors) return false;

        const authFields = ['email', 'password', 'username', 'credentials'];
        return authFields.some((field) => errorBody.errors[field]);
    }

    /**
     * Business logic: Generate user-friendly messages for auth errors
     */
    private getUserMessage(error: HttpErrorResponse, operation: string): string {
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

        // Business logic: Check for specific auth business errors
        if (errorBody?.message) {
            const message = errorBody.message.toLowerCase();
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

        if (errorBody?.error) {
            const errorMessage = errorBody.error.toLowerCase();
            if (errorMessage.includes('useralreadyexistsexception') && errorMessage.includes('email')) {
                return 'Este email ya está registrado. Intenta con otro email';
            }
            if (errorMessage.includes('useralreadyexistsexception') && errorMessage.includes('username')) {
                return 'Este nombre de usuario ya está en uso. Intenta con otro';
            }
        }

        // Default for 400 errors
        switch (operation) {
            case 'login':
                return 'Credenciales inválidas. Verifica tu email y contraseña';
            case 'register':
                return 'Datos de registro inválidos. Verifica la información';
            case 'reset-password':
                return 'Solicitud de restablecimiento inválida';
            default:
                return 'Solicitud inválida. Verifica los datos';
        }
    }

    private get401Message(operation: string): string {
        switch (operation) {
            case 'login':
                return 'Email o contraseña incorrectos';
            case 'logout':
                return 'Sesión expirada';
            default:
                return 'Necesitas iniciar sesión para continuar';
        }
    }

    private get422Message(error: HttpErrorResponse, operation: string): string {
        const errorBody = error.error;
        
        if (errorBody?.errors) {
            const firstError = Object.entries(errorBody.errors)[0];
            if (firstError) {
                return this.translateValidationError(firstError[0], operation);
            }
        }

        if (errorBody?.detail) {
            return this.translateValidationError(errorBody.detail, operation);
        }

        return 'Datos de validación incorrectos';
    }

    private translateValidationError(field: string, operation: string): string {
        const fieldLower = field.toLowerCase();
        
        if (fieldLower.includes('email')) {
            return 'Email inválido o requerido';
        }
        if (fieldLower.includes('password')) {
            return 'Contraseña inválida o muy débil';
        }
        if (fieldLower.includes('username')) {
            return 'Nombre de usuario inválido';
        }
        
        return `Error en el campo: ${field}`;
    }

    /**
     * Business logic: Determine recovery actions based on auth context
     */
    private getRecoveryActions(error: HttpErrorResponse, operation: string): string[] {
        const actions: string[] = [];

        switch (error.status) {
            case 400:
                if (operation === 'login') {
                    actions.push('Verifica tu email y contraseña');
                    actions.push('¿Olvidaste tu contraseña?');
                }
                if (operation === 'register') {
                    actions.push('Usa un email diferente');
                    actions.push('Verifica que la contraseña sea segura');
                }
                break;
            case 401:
                actions.push('Inicia sesión nuevamente');
                if (operation !== 'login') {
                    actions.push('Tu sesión ha expirado');
                }
                break;
            case 422:
                actions.push('Corrige los campos marcados');
                actions.push('Verifica el formato de los datos');
                break;
            case 429:
                actions.push('Espera unos minutos antes de intentar');
                break;
        }

        return actions;
    }

    /**
     * Business logic: Should redirect user based on auth error
     */
    private shouldRedirect(error: HttpErrorResponse, operation: string): boolean {
        return error.status === 401 && operation !== 'login';
    }

    /**
     * Business logic: Where to redirect for auth errors  
     */
    private getRedirectUrl(error: HttpErrorResponse, operation: string): string | null {
        if (this.shouldRedirect(error, operation)) {
            return '/auth/login';
        }
        return null;
    }

    /**
     * Business logic: Is error retryable from business perspective
     */
    private isBusinessRetryable(error: HttpErrorResponse): boolean {
        // Don't retry business validation errors or auth failures
        return ![400, 401, 403, 422].includes(error.status);
    }

    /**
     * Business logic: Is this a security-related error
     */
    private isSecurityRelated(error: HttpErrorResponse): boolean {
        return [401, 403, 429].includes(error.status);
    }

    /**
     * Business logic: Does error require reauthentication
     */
    private requiresReauthentication(error: HttpErrorResponse): boolean {
        return error.status === 401;
    }
}

/**
 * Context for error handling in Application Layer
 */
export interface ErrorHandlingContext {
    feature: string;
    operation: string;
    component?: string;
    userId?: number;
}

/**
 * Result of authentication error handling
 */
export interface AuthErrorResult {
    userMessage: string;
    recoveryActions: string[];
    shouldRedirect: boolean;
    redirectUrl: string | null;
    shouldRetry: boolean;
    businessContext: {
        feature: string;
        operation: string;
        isSecurityRelated: boolean;
        requiresReauthentication: boolean;
    };
}
