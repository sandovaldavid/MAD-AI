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
    return InfrastructureError.connectionFailed(context.endpoint, error);
  }

  /**
   * Transforma específicamente errores HttpErrorResponse
   */
  private transformHttpError(
    error: HttpErrorResponse,
    context: HttpErrorContext
  ): InfrastructureError {
    const { endpoint, operation } = context;

    switch (error.status) {
      case 0:
        // Network errors (connection refused, timeout, etc.)
        return InfrastructureError.connectionFailed(endpoint, error);

      case 400:
        // Bad Request - validation errors
        return InfrastructureError.badRequest(endpoint, error.error);

      case 401:
        // Unauthorized - authentication required
        return InfrastructureError.unauthorized(endpoint);

      case 403:
        // Forbidden - insufficient permissions
        return InfrastructureError.forbidden(endpoint, operation);

      case 404:
        // Not Found - resource doesn't exist
        return InfrastructureError.serverError(endpoint, error);

      case 409:
        // Conflict - resource already exists or state conflict
        return InfrastructureError.serverError(endpoint, error);

      case 422:
        // Unprocessable Entity - validation failed
        return InfrastructureError.badRequest(endpoint, error.error);

      case 429:
        // Too Many Requests - rate limit exceeded
        return InfrastructureError.rateLimitExceeded(endpoint);

      case 500:
      case 502:
      case 503:
      case 504:
        // Server errors - retryable
        return InfrastructureError.serverError(endpoint, error);

      default:
        // Unknown status codes - treat as server error
        return InfrastructureError.serverError(endpoint, error);
    }
  }

  /**
   * Método de conveniencia para casos comunes
   */
  transformWithDefaults(error: unknown, endpoint: string, operation: string): InfrastructureError {
    return this.transform(error, { endpoint, operation });
  }
}
