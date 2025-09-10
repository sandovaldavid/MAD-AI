import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { HttpErrorTransformer, HttpErrorContext } from './http-error-transformer';
import { InfrastructureError } from './infrastructure-error';

describe('HttpErrorTransformer - Infrastructure Tests', () => {
  let transformer: HttpErrorTransformer;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HttpErrorTransformer],
    });

    transformer = TestBed.inject(HttpErrorTransformer);
  });

  describe('HTTP Error Transformation', () => {
    const mockContext: HttpErrorContext = {
      endpoint: '/api/users',
      operation: 'create',
      entityType: 'User',
    };

    describe('Network Errors (Status 0)', () => {
      it('should transform network timeout to connection failed error', () => {
        // Given
        const httpError = new HttpErrorResponse({
          status: 0,
          statusText: 'Unknown Error',
          error: 'Network timeout',
          url: '/api/users',
        });

        // When
        const result = transformer.transform(httpError, mockContext);

        // Then
        expect(result).toBeInstanceOf(InfrastructureError);
        expect(result.code).toBe('CONNECTION_FAILED');
        expect(result.type).toBe('CONNECTIVITY');
        expect(result.retryable).toBe(true);
        expect(result.endpoint).toBe('/api/users');
        expect(result.originalError).toBe(httpError);
      });

      it('should handle connection refused errors', () => {
        // Given
        const httpError = new HttpErrorResponse({
          status: 0,
          statusText: 'Unknown Error',
          error: { message: 'Connection refused' },
          url: '/api/users',
        });

        // When
        const result = transformer.transform(httpError, mockContext);

        // Then
        expect(result.code).toBe('CONNECTION_FAILED');
        expect(result.message).toBe('Failed to connect to server');
        expect(result.retryable).toBe(true);
      });
    });

    describe('Client Errors (4xx)', () => {
      it('should transform 400 Bad Request to bad request error', () => {
        // Given
        const validationErrors = {
          email: ['This field is required'],
          password: ['Password too weak'],
        };
        const httpError = new HttpErrorResponse({
          status: 400,
          statusText: 'Bad Request',
          error: validationErrors,
          url: '/api/users',
        });

        // When
        const result = transformer.transform(httpError, mockContext);

        // Then
        expect(result.code).toBe('HTTP_BAD_REQUEST');
        expect(result.type).toBe('HTTP');
        expect(result.statusCode).toBe(400);
        expect(result.retryable).toBe(false);
        expect(result.context?.['validationErrors']).toEqual(validationErrors);
      });

      it('should transform 401 Unauthorized to unauthorized error', () => {
        // Given
        const httpError = new HttpErrorResponse({
          status: 401,
          statusText: 'Unauthorized',
          error: { detail: 'Authentication credentials were not provided' },
          url: '/api/users',
        });

        // When
        const result = transformer.transform(httpError, mockContext);

        // Then
        expect(result.code).toBe('HTTP_UNAUTHORIZED');
        expect(result.type).toBe('HTTP');
        expect(result.statusCode).toBe(401);
        expect(result.retryable).toBe(false);
        expect(result.message).toBe('Authentication required');
      });

      it('should transform 403 Forbidden to forbidden error', () => {
        // Given
        const httpError = new HttpErrorResponse({
          status: 403,
          statusText: 'Forbidden',
          error: { detail: 'You do not have permission to perform this action' },
          url: '/api/users',
        });

        // When
        const result = transformer.transform(httpError, mockContext);

        // Then
        expect(result.code).toBe('HTTP_FORBIDDEN');
        expect(result.type).toBe('HTTP');
        expect(result.statusCode).toBe(403);
        expect(result.retryable).toBe(false);
        expect(result.context?.['action']).toBe('create');
      });

      it('should transform 404 Not Found to server error', () => {
        // Given
        const httpError = new HttpErrorResponse({
          status: 404,
          statusText: 'Not Found',
          error: { detail: 'User not found' },
          url: '/api/users/999',
        });

        // When
        const result = transformer.transform(httpError, mockContext);

        // Then
        expect(result.code).toBe('HTTP_SERVER_ERROR');
        expect(result.type).toBe('HTTP');
        expect(result.statusCode).toBe(500);
        expect(result.retryable).toBe(true);
      });

      it('should transform 409 Conflict to server error', () => {
        // Given
        const httpError = new HttpErrorResponse({
          status: 409,
          statusText: 'Conflict',
          error: { detail: 'User with this email already exists' },
          url: '/api/users',
        });

        // When
        const result = transformer.transform(httpError, mockContext);

        // Then
        expect(result.code).toBe('HTTP_SERVER_ERROR');
        expect(result.type).toBe('HTTP');
        expect(result.retryable).toBe(true);
      });

      it('should transform 422 Unprocessable Entity to bad request error', () => {
        // Given
        const validationErrors = {
          non_field_errors: ['Invalid data provided'],
        };
        const httpError = new HttpErrorResponse({
          status: 422,
          statusText: 'Unprocessable Entity',
          error: validationErrors,
          url: '/api/users',
        });

        // When
        const result = transformer.transform(httpError, mockContext);

        // Then
        expect(result.code).toBe('HTTP_BAD_REQUEST');
        expect(result.type).toBe('HTTP');
        expect(result.statusCode).toBe(400);
        expect(result.retryable).toBe(false);
      });

      it('should transform 429 Too Many Requests to rate limit error', () => {
        // Given
        const httpError = new HttpErrorResponse({
          status: 429,
          statusText: 'Too Many Requests',
          error: { detail: 'Rate limit exceeded' },
          url: '/api/users',
          headers: new HttpHeaders().set('Retry-After', '60'),
        });

        // When
        const result = transformer.transform(httpError, mockContext);

        // Then
        expect(result.code).toBe('RATE_LIMIT_EXCEEDED');
        expect(result.type).toBe('API');
        expect(result.retryable).toBe(true);
        expect(result.message).toBe('API rate limit exceeded');
      });
    });

    describe('Server Errors (5xx)', () => {
      it('should transform 500 Internal Server Error to server error', () => {
        // Given
        const httpError = new HttpErrorResponse({
          status: 500,
          statusText: 'Internal Server Error',
          error: { detail: 'An unexpected error occurred' },
          url: '/api/users',
        });

        // When
        const result = transformer.transform(httpError, mockContext);

        // Then
        expect(result.code).toBe('HTTP_SERVER_ERROR');
        expect(result.type).toBe('HTTP');
        expect(result.statusCode).toBe(500);
        expect(result.retryable).toBe(true);
        expect(result.originalError).toBe(httpError);
      });

      it('should transform 502 Bad Gateway to server error', () => {
        // Given
        const httpError = new HttpErrorResponse({
          status: 502,
          statusText: 'Bad Gateway',
          error: 'Bad Gateway',
          url: '/api/users',
        });

        // When
        const result = transformer.transform(httpError, mockContext);

        // Then
        expect(result.code).toBe('HTTP_SERVER_ERROR');
        expect(result.retryable).toBe(true);
      });

      it('should transform 503 Service Unavailable to server error', () => {
        // Given
        const httpError = new HttpErrorResponse({
          status: 503,
          statusText: 'Service Unavailable',
          error: 'Service temporarily unavailable',
          url: '/api/users',
        });

        // When
        const result = transformer.transform(httpError, mockContext);

        // Then
        expect(result.code).toBe('HTTP_SERVER_ERROR');
        expect(result.retryable).toBe(true);
      });

      it('should transform 504 Gateway Timeout to server error', () => {
        // Given
        const httpError = new HttpErrorResponse({
          status: 504,
          statusText: 'Gateway Timeout',
          error: 'Gateway timeout',
          url: '/api/users',
        });

        // When
        const result = transformer.transform(httpError, mockContext);

        // Then
        expect(result.code).toBe('HTTP_SERVER_ERROR');
        expect(result.retryable).toBe(true);
      });
    });

    describe('Unknown Status Codes', () => {
      it('should transform unknown status codes to server error', () => {
        // Given
        const httpError = new HttpErrorResponse({
          status: 418, // I'm a teapot
          statusText: "I'm a teapot",
          error: 'Teapot error',
          url: '/api/users',
        });

        // When
        const result = transformer.transform(httpError, mockContext);

        // Then
        expect(result.code).toBe('HTTP_SERVER_ERROR');
        expect(result.type).toBe('HTTP');
        expect(result.retryable).toBe(true);
      });
    });
  });

  describe('Non-HTTP Error Transformation', () => {
    it('should transform generic errors to connection failed', () => {
      // Given
      const genericError = new Error('Network connection lost');
      const context: HttpErrorContext = {
        endpoint: '/api/users',
        operation: 'fetch',
      };

      // When
      const result = transformer.transform(genericError, context);

      // Then
      expect(result.code).toBe('CONNECTION_FAILED');
      expect(result.type).toBe('CONNECTIVITY');
      expect(result.retryable).toBe(true);
      expect(result.originalError).toBe(genericError);
    });

    it('should handle unknown error types', () => {
      // Given
      const unknownError = 'String error';
      const context: HttpErrorContext = {
        endpoint: '/api/users',
        operation: 'update',
      };

      // When
      const result = transformer.transform(unknownError, context);

      // Then
      expect(result.code).toBe('CONNECTION_FAILED');
      expect(result.originalError).toBe(unknownError);
    });
  });

  describe('Context Handling', () => {
    it('should preserve all context information in transformed error', () => {
      // Given
      const context: HttpErrorContext = {
        endpoint: '/api/users/123',
        operation: 'update',
        entityType: 'User',
        field: 'email',
      };
      const httpError = new HttpErrorResponse({
        status: 400,
        error: { email: ['Invalid format'] },
        url: '/api/users/123',
      });

      // When
      const result = transformer.transform(httpError, context);

      // Then
      expect(result.context?.['endpoint']).toBe('/api/users/123');
      expect(result.context?.['operation']).toBe('update');
      expect(result.context?.['entityType']).toBe('User');
      expect(result.context?.['field']).toBe('email');
    });

    it('should handle minimal context information', () => {
      // Given
      const context: HttpErrorContext = {
        endpoint: '/api/test',
        operation: 'test',
      };
      const httpError = new HttpErrorResponse({ status: 500 });

      // When
      const result = transformer.transform(httpError, context);

      // Then
      expect(result.context?.['endpoint']).toBe('/api/test');
      expect(result.context?.['operation']).toBe('test');
      expect(result.context?.['entityType']).toBeUndefined();
      expect(result.context?.['field']).toBeUndefined();
    });
  });

  describe('Convenience Methods', () => {
    it('should use transformWithDefaults for simple cases', () => {
      // Given
      const httpError = new HttpErrorResponse({
        status: 401,
        statusText: 'Unauthorized',
        url: '/api/auth',
      });

      // When
      const result = transformer.transformWithDefaults(httpError, '/api/auth', 'authenticate');

      // Then
      expect(result.code).toBe('HTTP_UNAUTHORIZED');
      expect(result.context?.['endpoint']).toBe('/api/auth');
      expect(result.context?.['operation']).toBe('authenticate');
    });

    it('should handle transformWithDefaults with non-HTTP errors', () => {
      // Given
      const networkError = new Error('ECONNREFUSED');

      // When
      const result = transformer.transformWithDefaults(networkError, '/api/data', 'fetch');

      // Then
      expect(result.code).toBe('CONNECTION_FAILED');
      expect(result.context?.['endpoint']).toBe('/api/data');
      expect(result.context?.['operation']).toBe('fetch');
    });
  });

  describe('Error Properties Validation', () => {
    it('should set timestamp on all transformed errors', () => {
      // Given
      const httpError = new HttpErrorResponse({ status: 500 });
      const context: HttpErrorContext = { endpoint: '/api/test', operation: 'test' };
      const beforeTransform = new Date();

      // When
      const result = transformer.transform(httpError, context);
      const afterTransform = new Date();

      // Then
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTransform.getTime());
      expect(result.timestamp.getTime()).toBeLessThanOrEqual(afterTransform.getTime());
    });

    it('should maintain error inheritance chain', () => {
      // Given
      const httpError = new HttpErrorResponse({ status: 400 });
      const context: HttpErrorContext = { endpoint: '/api/test', operation: 'test' };

      // When
      const result = transformer.transform(httpError, context);

      // Then
      expect(result).toBeInstanceOf(Error);
      expect(result).toBeInstanceOf(InfrastructureError);
      expect(result.name).toBe('InfrastructureError');
    });
  });
});
