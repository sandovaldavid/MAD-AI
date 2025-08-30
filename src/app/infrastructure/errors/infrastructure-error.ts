import type { InfrastructureError as InfrastructureErrorInterface } from './infrastructure-error.type';

export class InfrastructureError extends Error implements InfrastructureErrorInterface {
  public readonly type: 'NETWORK' | 'HTTP' | 'API' | 'CONNECTIVITY';
  public readonly originalError?: any;
  public readonly statusCode?: number;
  public readonly endpoint?: string;
  public readonly code: string;
  public readonly timestamp: Date;
  public readonly retryable: boolean;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    code: string,
    type: 'NETWORK' | 'HTTP' | 'API' | 'CONNECTIVITY',
    retryable: boolean,
    context?: Record<string, any>,
    statusCode?: number,
    originalError?: any,
    endpoint?: string
  ) {
    super(message);
    this.name = 'InfrastructureError';
    this.code = code;
    this.type = type;
    this.retryable = retryable;
    this.context = context;
    this.statusCode = statusCode;
    this.originalError = originalError;
    this.timestamp = new Date();
    // endpoint puede venir en context o como parámetro
    this.endpoint = endpoint ?? context?.['endpoint'] ?? undefined;
  }

  static networkTimeout(endpoint: string, timeout: number): InfrastructureError {
    return new InfrastructureError(
      `Network timeout after ${timeout}ms`,
      'NETWORK_TIMEOUT',
      'NETWORK',
      true,
      { endpoint, timeout }
    );
  }

  static unauthorized(endpoint: string): InfrastructureError {
    return new InfrastructureError(
      'Authentication required',
      'HTTP_UNAUTHORIZED',
      'HTTP',
      false,
      { endpoint },
      401
    );
  }

  static connectionFailed(endpoint: string, originalError: any): InfrastructureError {
    return new InfrastructureError(
      'Failed to connect to server',
      'CONNECTION_FAILED',
      'CONNECTIVITY',
      true,
      { endpoint },
      undefined,
      originalError
    );
  }

  // Errores HTTP específicos
  static forbidden(endpoint: string, action?: string): InfrastructureError {
    return new InfrastructureError(
      `Access forbidden to ${endpoint}`,
      'HTTP_FORBIDDEN',
      'HTTP',
      false,
      { endpoint, action },
      403
    );
  }

  static badRequest(endpoint: string, validationErrors?: any): InfrastructureError {
    return new InfrastructureError(
      'Bad request sent to server',
      'HTTP_BAD_REQUEST',
      'HTTP',
      false,
      { endpoint, validationErrors },
      400
    );
  }

  static serverError(endpoint: string, originalError?: any): InfrastructureError {
    return new InfrastructureError(
      'Internal server error',
      'HTTP_SERVER_ERROR',
      'HTTP',
      true, // retryable
      { endpoint },
      500,
      originalError
    );
  }

  // Errores de red específicos
  static dnsResolutionFailed(hostname: string): InfrastructureError {
    return new InfrastructureError(
      `DNS resolution failed for ${hostname}`,
      'DNS_RESOLUTION_FAILED',
      'CONNECTIVITY',
      true,
      { hostname }
    );
  }

  static certificateError(endpoint: string, certificateError: any): InfrastructureError {
    return new InfrastructureError(
      'SSL certificate verification failed',
      'CERTIFICATE_ERROR',
      'CONNECTIVITY',
      false,
      { endpoint },
      undefined,
      certificateError
    );
  }

  // Errores de API específicos
  static rateLimitExceeded(endpoint: string, retryAfter?: number): InfrastructureError {
    return new InfrastructureError('API rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 'API', true, {
      endpoint,
      retryAfter,
    });
  }

  static apiVersionNotSupported(endpoint: string, version: string): InfrastructureError {
    return new InfrastructureError(
      `API version ${version} not supported`,
      'API_VERSION_NOT_SUPPORTED',
      'API',
      false,
      { endpoint, version }
    );
  }
}
