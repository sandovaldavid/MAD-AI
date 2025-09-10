import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { InfrastructureError } from './infrastructure-error';

export interface HttpErrorContext {
  endpoint: string;
  operation: string;
  entityType?: string;
  field?: string;
}

@Injectable({ providedIn: 'root' })
export class HttpErrorTransformer {
  /**
   * Transforma un error HTTP en un InfrastructureError apropiado
   */
  transform(error: unknown, context: HttpErrorContext): InfrastructureError {
    if (error instanceof HttpErrorResponse) {
      return this.transformHttpError(error, context);
    }

    // Para errores no HTTP (errores de red, etc.)
    const connectionError = InfrastructureError.connectionFailed(context.endpoint, error);
    // Add the full context including operation
    return new InfrastructureError(
      connectionError.message,
      connectionError.code,
      connectionError.type,
      connectionError.retryable,
      { endpoint: context.endpoint, operation: context.operation },
      connectionError.statusCode,
      connectionError.originalError
    );
  }

  /**
   * Transforma específicamente errores HttpErrorResponse
   */
  private transformHttpError(
    error: HttpErrorResponse,
    context: HttpErrorContext
  ): InfrastructureError {
    const { endpoint, operation, entityType, field } = context;

    switch (error.status) {
      case 0:
        // Network errors (connection refused, timeout, etc.)
        return InfrastructureError.connectionFailed(endpoint, error);

      case 400: {
        // Bad Request - validation errors
        const badRequestError = InfrastructureError.badRequest(endpoint, error.error);
        return new InfrastructureError(
          badRequestError.message,
          badRequestError.code,
          badRequestError.type,
          badRequestError.retryable,
          { endpoint, operation, entityType, field, ...badRequestError.context },
          badRequestError.statusCode,
          badRequestError.originalError
        );
      }

      case 401: {
        // Unauthorized - authentication required
        const unauthorizedError = InfrastructureError.unauthorized(endpoint);
        return new InfrastructureError(
          unauthorizedError.message,
          unauthorizedError.code,
          unauthorizedError.type,
          unauthorizedError.retryable,
          { endpoint, operation, entityType, field },
          unauthorizedError.statusCode,
          unauthorizedError.originalError
        );
      }

      case 403:
        // Forbidden - insufficient permissions
        return InfrastructureError.forbidden(endpoint, operation);

      case 404: {
        // Not Found - resource doesn't exist
        const notFoundError = InfrastructureError.serverError(endpoint, error);
        return new InfrastructureError(
          notFoundError.message,
          notFoundError.code,
          notFoundError.type,
          notFoundError.retryable,
          { endpoint, operation, entityType, field, ...notFoundError.context },
          notFoundError.statusCode,
          notFoundError.originalError
        );
      }

      case 409: {
        // Conflict - resource already exists or state conflict
        const conflictError = InfrastructureError.serverError(endpoint, error);
        return new InfrastructureError(
          conflictError.message,
          conflictError.code,
          conflictError.type,
          conflictError.retryable,
          { endpoint, operation, entityType, field, ...conflictError.context },
          conflictError.statusCode,
          conflictError.originalError
        );
      }

      case 422: {
        // Unprocessable Entity - validation failed
        const validationError = InfrastructureError.badRequest(endpoint, error.error);
        return new InfrastructureError(
          validationError.message,
          validationError.code,
          validationError.type,
          validationError.retryable,
          { endpoint, operation, entityType, field, ...validationError.context },
          validationError.statusCode,
          validationError.originalError
        );
      }

      case 429: {
        // Too Many Requests - rate limit exceeded
        const rateLimitError = InfrastructureError.rateLimitExceeded(endpoint);
        return new InfrastructureError(
          rateLimitError.message,
          rateLimitError.code,
          rateLimitError.type,
          rateLimitError.retryable,
          { endpoint, operation, entityType, field, ...rateLimitError.context },
          rateLimitError.statusCode,
          rateLimitError.originalError
        );
      }

      case 500:
      case 502:
      case 503:
      case 504: {
        // Server errors - retryable
        const serverError = InfrastructureError.serverError(endpoint, error);
        return new InfrastructureError(
          serverError.message,
          serverError.code,
          serverError.type,
          serverError.retryable,
          { endpoint, operation, entityType, field, ...serverError.context },
          serverError.statusCode,
          serverError.originalError
        );
      }

      default: {
        // Unknown status codes - treat as server error
        const unknownError = InfrastructureError.serverError(endpoint, error);
        return new InfrastructureError(
          unknownError.message,
          unknownError.code,
          unknownError.type,
          unknownError.retryable,
          { endpoint, operation, entityType, field, ...unknownError.context },
          unknownError.statusCode,
          unknownError.originalError
        );
      }
    }
  }

  /**
   * Método de conveniencia para casos comunes
   */
  transformWithDefaults(error: unknown, endpoint: string, operation: string): InfrastructureError {
    return this.transform(error, { endpoint, operation });
  }
}
