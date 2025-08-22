import { Injectable } from '@angular/core';
import { ValidationError } from '@domain/errors/validation-error.entity';
import { ValidationErrorCode } from '@domain/errors/validation-error-code.enum';
import type { InfraError } from './http-to-infra.mapper';
import { AuthErrorCode } from './auth-error-code.enum';
import { HttpErrorCode } from './http-error-code.enum';

/**
 * Infrastructure Error to Domain Error Mapper
 *
 * @description
 * Transforms infrastructure-level errors (HTTP, network, auth) into domain-level
 * ValidationError entities. This mapper serves as the boundary between the
 * infrastructure layer concerns and domain error modeling.
 *
 * @responsibilities
 * - Transform InfraError types to ValidationError entities
 * - Map infrastructure error codes to domain validation codes
 * - Preserve error context and semantic meaning
 * - Provide consistent error structure for upper layers
 *
 * @architecture
 * - Infrastructure Layer utility
 * - Implements Clean Architecture error boundary
 * - Bridges technical errors to domain errors
 * - Used by repository implementations
 *
 * @usage
 * ```typescript
 * // In repository implementations
 * try {
 *   const response = await firstValueFrom(this.http.get(...));
 *   return response;
 * } catch (infraError: InfraError) {
 *   const domainError = this.infraToDomainMapper.mapError(infraError, {
 *     operation: 'FETCH_USER',
 *     entityType: 'User'
 *   });
 *   throw domainError;
 * }
 * ```
 *
 * @since 1.0.0
 * @layer Infrastructure
 */
@Injectable({ providedIn: 'root' })
export class InfraErrorToDomainMapper {
    /**
     * Maps an infrastructure error to a domain ValidationError
     *
     * @param infraError - The infrastructure error to transform
     * @param context - Additional context for error transformation
     * @returns ValidationError instance appropriate for domain layer
     */
    mapError(
        infraError: InfraError,
        context: {
            operation: string;
            entityType?: string;
            field?: string;
        }
    ): ValidationError {
        if (infraError.kind === 'AUTH') {
            return this.mapAuthError(infraError, context);
        }

        if (infraError.kind === 'HTTP') {
            return this.mapHttpError(infraError, context);
        }

        // Fallback for unknown error types
        return ValidationError.create({
            field: context.field || 'operation',
            value: context.operation,
            message: 'An unexpected error occurred during the operation',
            code: ValidationErrorCode.VALIDATION_ERROR,
            context: { infraError, operation: context.operation },
        });
    }

    /**
     * Maps authentication-specific errors to domain errors
     */
    private mapAuthError(
        infraError: InfraError & { kind: 'AUTH' },
        context: { operation: string; entityType?: string; field?: string }
    ): ValidationError {
        const { code, detail } = infraError;

        switch (code) {
            case AuthErrorCode.ACCESS_TOKEN_INVALID:
                return ValidationError.create({
                    field: 'authentication',
                    value: 'access_token',
                    message: 'Your session is invalid. Please log in again.',
                    code: ValidationErrorCode.INVALID_STATE,
                    context: { authError: code, detail },
                });

            case AuthErrorCode.ACCESS_TOKEN_EXPIRED:
                return ValidationError.create({
                    field: 'authentication',
                    value: 'access_token',
                    message: 'Your session has expired. Please log in again.',
                    code: ValidationErrorCode.ENTITY_EXPIRED,
                    context: { authError: code, detail },
                });

            case AuthErrorCode.REFRESH_TOKEN_INVALID:
            case AuthErrorCode.REFRESH_TOKEN_EXPIRED:
                return ValidationError.create({
                    field: 'authentication',
                    value: 'refresh_token',
                    message: 'Your session cannot be renewed. Please log in again.',
                    code: ValidationErrorCode.ENTITY_EXPIRED,
                    context: { authError: code, detail },
                });

            case AuthErrorCode.SESSION_INVALID:
            case AuthErrorCode.SESSION_EXPIRED:
                return ValidationError.create({
                    field: 'session',
                    value: 'user_session',
                    message: 'Your session is no longer valid. Please log in again.',
                    code: ValidationErrorCode.INVALID_STATE,
                    context: { authError: code, detail },
                });

            case AuthErrorCode.PASSWORD_INVALID:
                return ValidationError.create({
                    field: 'password',
                    value: '***',
                    message: 'The password provided is incorrect.',
                    code: ValidationErrorCode.PASSWORD_INVALID,
                    context: { authError: code, detail },
                });

            default:
                return ValidationError.create({
                    field: 'authentication',
                    value: context.operation,
                    message: 'Authentication failed. Please verify your credentials.',
                    code: ValidationErrorCode.PASSWORD_INVALID,
                    context: { authError: code, detail, operation: context.operation },
                });
        }
    }

    /**
     * Maps HTTP-specific errors to domain errors
     */
    private mapHttpError(
        infraError: InfraError & { kind: 'HTTP' },
        context: { operation: string; entityType?: string; field?: string }
    ): ValidationError {
        const { code, detail } = infraError;
        const entityName = context.entityType || 'resource';

        switch (code) {
            case HttpErrorCode.BAD_REQUEST:
                return ValidationError.create({
                    field: context.field || 'request',
                    value: context.operation,
                    message:
                        this.extractValidationMessage(detail) ||
                        'The request contains invalid data.',
                    code: ValidationErrorCode.INVALID_FORMAT,
                    context: { httpError: code, detail, operation: context.operation },
                });

            case HttpErrorCode.UNAUTHORIZED:
                return ValidationError.create({
                    field: 'authentication',
                    value: 'credentials',
                    message: 'Access denied. Please verify your credentials.',
                    code: ValidationErrorCode.PASSWORD_INVALID,
                    context: { httpError: code, detail },
                });

            case HttpErrorCode.FORBIDDEN:
                return ValidationError.create({
                    field: 'authorization',
                    value: context.operation,
                    message: 'You do not have permission to perform this operation.',
                    code: ValidationErrorCode.PERMISSION_DENIED,
                    context: { httpError: code, detail, operation: context.operation },
                });

            case HttpErrorCode.NOT_FOUND:
                return ValidationError.create({
                    field: context.field || 'id',
                    value: 'resource_id',
                    message: `The requested ${entityName.toLowerCase()} was not found.`,
                    code: ValidationErrorCode.ENTITY_NOT_FOUND,
                    context: { httpError: code, detail, entityType: entityName },
                });

            case HttpErrorCode.CONFLICT:
                return ValidationError.create({
                    field: context.field || 'resource',
                    value: context.operation,
                    message:
                        this.extractConflictMessage(detail) ||
                        `The ${entityName.toLowerCase()} already exists or conflicts with existing data.`,
                    code: ValidationErrorCode.FIELD_NOT_UNIQUE,
                    context: { httpError: code, detail, entityType: entityName },
                });

            case HttpErrorCode.UNPROCESSABLE_ENTITY:
                return ValidationError.create({
                    field: context.field || 'data',
                    value: context.operation,
                    message:
                        this.extractValidationMessage(detail) || 'The provided data is invalid.',
                    code: ValidationErrorCode.VALIDATION_ERROR,
                    context: { httpError: code, detail, operation: context.operation },
                });

            case HttpErrorCode.TOO_MANY_REQUESTS:
                return ValidationError.create({
                    field: 'rate_limit',
                    value: context.operation,
                    message: 'Too many attempts. Please wait before trying again.',
                    code: ValidationErrorCode.VALUE_TOO_HIGH,
                    context: { httpError: code, detail, operation: context.operation },
                });

            case HttpErrorCode.INTERNAL_SERVER_ERROR:
            case HttpErrorCode.SERVICE_UNAVAILABLE:
                return ValidationError.create({
                    field: 'server',
                    value: context.operation,
                    message: 'The service is temporarily unavailable. Please try again later.',
                    code: ValidationErrorCode.INVALID_STATE,
                    context: { httpError: code, detail, operation: context.operation },
                });

            case HttpErrorCode.NETWORK_ERROR:
                return ValidationError.create({
                    field: 'network',
                    value: context.operation,
                    message: 'Network connection failed. Please check your internet connection.',
                    code: ValidationErrorCode.INVALID_STATE,
                    context: { httpError: code, detail, operation: context.operation },
                });

            case HttpErrorCode.TIMEOUT:
                return ValidationError.create({
                    field: 'request',
                    value: context.operation,
                    message: 'The request timed out. Please try again.',
                    code: ValidationErrorCode.INVALID_STATE,
                    context: { httpError: code, detail, operation: context.operation },
                });

            default:
                return ValidationError.create({
                    field: context.field || 'operation',
                    value: context.operation,
                    message: 'An unexpected error occurred. Please try again.',
                    code: ValidationErrorCode.VALIDATION_ERROR,
                    context: { httpError: code, detail, operation: context.operation },
                });
        }
    }

    /**
     * Extracts user-friendly validation messages from HTTP error details
     */
    private extractValidationMessage(detail: any): string | null {
        if (!detail) return null;

        // Handle common API validation error formats
        if (typeof detail === 'string') {
            return detail;
        }

        if (detail.message) {
            return detail.message;
        }

        if (detail.error) {
            return detail.error;
        }

        // Handle field-specific errors
        if (detail.errors && Array.isArray(detail.errors)) {
            const firstError = detail.errors[0];
            return firstError?.message || firstError?.error || null;
        }

        return null;
    }

    /**
     * Extracts conflict-specific messages from HTTP error details
     */
    private extractConflictMessage(detail: any): string | null {
        if (!detail) return null;

        if (typeof detail === 'string') {
            return detail;
        }

        if (detail.message) {
            return detail.message;
        }

        // Handle common conflict scenarios
        if (detail.code === 'DUPLICATE_EMAIL') {
            return 'An account with this email address already exists.';
        }

        if (detail.code === 'DUPLICATE_USERNAME') {
            return 'This username is already taken.';
        }

        return null;
    }
}
