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

      it('should transform network error with complete context', () => {
        // Given
        const completeContext: HttpErrorContext = {
          endpoint: '/api/users/123',
          operation: 'update',
          entityType: 'User',
          field: 'email',
        };
        const httpError = new HttpErrorResponse({
          status: 0,
          statusText: 'Unknown Error',
          error: 'Connection refused',
          url: '/api/users/123',
        });

        // When
        const result = transformer.transform(httpError, completeContext);

        // Then
        expect(result.code).toBe('CONNECTION_FAILED');
        expect(result.type).toBe('CONNECTIVITY');
        expect(result.retryable).toBe(true);
        expect(result.endpoint).toBe('/api/users/123');
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

      it('should transform 400 with complete context and different error formats', () => {
        // Given
        const completeContext: HttpErrorContext = {
          endpoint: '/api/users/123',
          operation: 'update',
          entityType: 'User',
          field: 'email',
        };
        const stringError = 'Invalid request format';
        const httpError = new HttpErrorResponse({
          status: 400,
          statusText: 'Bad Request',
          error: stringError,
          url: '/api/users/123',
        });

        // When
        const result = transformer.transform(httpError, completeContext);

        // Then
        expect(result.code).toBe('HTTP_BAD_REQUEST');
        expect(result.context?.['endpoint']).toBe('/api/users/123');
        expect(result.context?.['operation']).toBe('update');
        expect(result.context?.['entityType']).toBe('User');
        expect(result.context?.['field']).toBe('email');
      });

      it('should transform 400 with nested error object', () => {
        // Given
        const nestedError = {
          detail: 'Validation failed',
          errors: {
            name: ['Required field'],
            age: ['Must be positive'],
          },
        };
        const httpError = new HttpErrorResponse({
          status: 400,
          statusText: 'Bad Request',
          error: nestedError,
          url: '/api/users',
        });

        // When
        const result = transformer.transform(httpError, mockContext);

        // Then
        expect(result.code).toBe('HTTP_BAD_REQUEST');
        expect(result.statusCode).toBe(400);
        expect(result.context?.['validationErrors']).toEqual(nestedError);
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

      it('should transform 401 with complete context including field', () => {
        // Given
        const completeContext: HttpErrorContext = {
          endpoint: '/api/auth/login',
          operation: 'authenticate',
          entityType: 'Auth',
          field: 'token',
        };
        const httpError = new HttpErrorResponse({
          status: 401,
          statusText: 'Unauthorized',
          error: { detail: 'Invalid token' },
          url: '/api/auth/login',
        });

        // When
        const result = transformer.transform(httpError, completeContext);

        // Then
        expect(result.code).toBe('HTTP_UNAUTHORIZED');
        expect(result.context?.['endpoint']).toBe('/api/auth/login');
        expect(result.context?.['operation']).toBe('authenticate');
        expect(result.context?.['entityType']).toBe('Auth');
        expect(result.context?.['field']).toBe('token');
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

      it('should transform 404 with complete context and string error', () => {
        // Given
        const completeContext: HttpErrorContext = {
          endpoint: '/api/users/999',
          operation: 'fetch',
          entityType: 'User',
          field: 'id',
        };
        const httpError = new HttpErrorResponse({
          status: 404,
          statusText: 'Not Found',
          error: 'Resource not found',
          url: '/api/users/999',
        });

        // When
        const result = transformer.transform(httpError, completeContext);

        // Then
        expect(result.code).toBe('HTTP_SERVER_ERROR');
        expect(result.context?.['endpoint']).toBe('/api/users/999');
        expect(result.context?.['operation']).toBe('fetch');
        expect(result.context?.['entityType']).toBe('User');
        expect(result.context?.['field']).toBe('id');
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

      it('should transform 409 with complete context and nested error', () => {
        // Given
        const completeContext: HttpErrorContext = {
          endpoint: '/api/roles',
          operation: 'create',
          entityType: 'Role',
          field: 'name',
        };
        const conflictError = {
          code: 'DUPLICATE_RESOURCE',
          message: 'Role name already exists',
          conflicts: ['admin', 'manager'],
        };
        const httpError = new HttpErrorResponse({
          status: 409,
          statusText: 'Conflict',
          error: conflictError,
          url: '/api/roles',
        });

        // When
        const result = transformer.transform(httpError, completeContext);

        // Then
        expect(result.code).toBe('HTTP_SERVER_ERROR');
        expect(result.context?.['endpoint']).toBe('/api/roles');
        expect(result.context?.['operation']).toBe('create');
        expect(result.context?.['entityType']).toBe('Role');
        expect(result.context?.['field']).toBe('name');
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

      it('should transform 422 with complete context and field-specific errors', () => {
        // Given
        const completeContext: HttpErrorContext = {
          endpoint: '/api/users/profile',
          operation: 'validate',
          entityType: 'UserProfile',
          field: 'birthDate',
        };
        const fieldErrors = {
          birthDate: ['Future dates not allowed', 'Must be in YYYY-MM-DD format'],
          age: ['Must be between 13 and 120'],
        };
        const httpError = new HttpErrorResponse({
          status: 422,
          statusText: 'Unprocessable Entity',
          error: fieldErrors,
          url: '/api/users/profile',
        });

        // When
        const result = transformer.transform(httpError, completeContext);

        // Then
        expect(result.code).toBe('HTTP_BAD_REQUEST');
        expect(result.context?.['endpoint']).toBe('/api/users/profile');
        expect(result.context?.['operation']).toBe('validate');
        expect(result.context?.['entityType']).toBe('UserProfile');
        expect(result.context?.['field']).toBe('birthDate');
        expect(result.context?.['validationErrors']).toEqual(fieldErrors);
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

      it('should transform 429 with complete context and custom headers', () => {
        // Given
        const completeContext: HttpErrorContext = {
          endpoint: '/api/webhooks',
          operation: 'trigger',
          entityType: 'Webhook',
          field: 'payload',
        };
        const rateLimitError = {
          error: 'Rate limit exceeded',
          limit: 100,
          window: '1h',
          remaining: 0,
        };
        const httpError = new HttpErrorResponse({
          status: 429,
          statusText: 'Too Many Requests',
          error: rateLimitError,
          url: '/api/webhooks',
          headers: new HttpHeaders()
            .set('Retry-After', '3600')
            .set('X-RateLimit-Limit', '100')
            .set('X-RateLimit-Remaining', '0'),
        });

        // When
        const result = transformer.transform(httpError, completeContext);

        // Then
        expect(result.code).toBe('RATE_LIMIT_EXCEEDED');
        expect(result.context?.['endpoint']).toBe('/api/webhooks');
        expect(result.context?.['operation']).toBe('trigger');
        expect(result.context?.['entityType']).toBe('Webhook');
        expect(result.context?.['field']).toBe('payload');
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

      it('should transform 500 with complete context and detailed error', () => {
        // Given
        const completeContext: HttpErrorContext = {
          endpoint: '/api/complex',
          operation: 'processData',
          entityType: 'ComplexData',
          field: 'calculation',
        };
        const detailedError = {
          error: 'Internal server error',
          trace: 'Stack trace information',
          timestamp: '2024-01-01T00:00:00Z',
          requestId: 'req-123456',
        };
        const httpError = new HttpErrorResponse({
          status: 500,
          statusText: 'Internal Server Error',
          error: detailedError,
          url: '/api/complex',
        });

        // When
        const result = transformer.transform(httpError, completeContext);

        // Then
        expect(result.code).toBe('HTTP_SERVER_ERROR');
        expect(result.context?.['endpoint']).toBe('/api/complex');
        expect(result.context?.['operation']).toBe('processData');
        expect(result.context?.['entityType']).toBe('ComplexData');
        expect(result.context?.['field']).toBe('calculation');
        expect(result.originalError).toBe(httpError);
      });

      it('should transform 502 with complete context', () => {
        // Given
        const completeContext: HttpErrorContext = {
          endpoint: '/api/gateway',
          operation: 'proxy',
          entityType: 'Gateway',
          field: 'upstream',
        };
        const httpError = new HttpErrorResponse({
          status: 502,
          statusText: 'Bad Gateway',
          error: { message: 'Upstream server error', code: 'UPSTREAM_ERROR' },
          url: '/api/gateway',
        });

        // When
        const result = transformer.transform(httpError, completeContext);

        // Then
        expect(result.code).toBe('HTTP_SERVER_ERROR');
        expect(result.context?.['endpoint']).toBe('/api/gateway');
        expect(result.context?.['operation']).toBe('proxy');
        expect(result.context?.['entityType']).toBe('Gateway');
        expect(result.context?.['field']).toBe('upstream');
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

      it('should transform unknown status with complete context', () => {
        // Given
        const completeContext: HttpErrorContext = {
          endpoint: '/api/unusual',
          operation: 'experiment',
          entityType: 'Experiment',
          field: 'result',
        };
        const httpError = new HttpErrorResponse({
          status: 451, // Unavailable For Legal Reasons
          statusText: 'Unavailable For Legal Reasons',
          error: { reason: 'Legal compliance' },
          url: '/api/unusual',
        });

        // When
        const result = transformer.transform(httpError, completeContext);

        // Then
        expect(result.code).toBe('HTTP_SERVER_ERROR');
        expect(result.context?.['endpoint']).toBe('/api/unusual');
        expect(result.context?.['operation']).toBe('experiment');
        expect(result.context?.['entityType']).toBe('Experiment');
        expect(result.context?.['field']).toBe('result');
        expect(result.originalError).toBe(httpError);
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

    it('should transform null error with complete context', () => {
      // Given
      const nullError = null;
      const context: HttpErrorContext = {
        endpoint: '/api/data',
        operation: 'load',
        entityType: 'Data',
        field: 'content',
      };

      // When
      const result = transformer.transform(nullError, context);

      // Then
      expect(result.code).toBe('CONNECTION_FAILED');
      expect(result.type).toBe('CONNECTIVITY');
      expect(result.retryable).toBe(true);
      expect(result.context?.['endpoint']).toBe('/api/data');
      expect(result.context?.['operation']).toBe('load');
      expect(result.originalError).toBe(nullError);
    });

    it('should transform undefined error with context', () => {
      // Given
      const undefinedError = undefined;
      const context: HttpErrorContext = {
        endpoint: '/api/service',
        operation: 'connect',
        entityType: 'Service',
      };

      // When
      const result = transformer.transform(undefinedError, context);

      // Then
      expect(result.code).toBe('CONNECTION_FAILED');
      expect(result.context?.['endpoint']).toBe('/api/service');
      expect(result.context?.['operation']).toBe('connect');
      expect(result.originalError).toBe(undefinedError);
    });

    it('should transform object error with complete context', () => {
      // Given
      const objectError = { message: 'Custom error', code: 'CUSTOM' };
      const context: HttpErrorContext = {
        endpoint: '/api/custom',
        operation: 'process',
        entityType: 'Custom',
        field: 'data',
      };

      // When
      const result = transformer.transform(objectError, context);

      // Then
      expect(result.code).toBe('CONNECTION_FAILED');
      expect(result.context?.['endpoint']).toBe('/api/custom');
      expect(result.context?.['operation']).toBe('process');
      // Note: connectionFailed static method only preserves endpoint in context
      expect(result.originalError).toBe(objectError);
    });

    it('should transform number error type', () => {
      // Given
      const numberError = 500;
      const context: HttpErrorContext = {
        endpoint: '/api/numeric',
        operation: 'calculate',
      };

      // When
      const result = transformer.transform(numberError, context);

      // Then
      expect(result.code).toBe('CONNECTION_FAILED');
      expect(result.originalError).toBe(numberError);
    });

    it('should transform boolean error type', () => {
      // Given
      const booleanError = false;
      const context: HttpErrorContext = {
        endpoint: '/api/boolean',
        operation: 'validate',
      };

      // When
      const result = transformer.transform(booleanError, context);

      // Then
      expect(result.code).toBe('CONNECTION_FAILED');
      expect(result.originalError).toBe(booleanError);
    });

    it('should preserve operation context in non-HTTP errors', () => {
      // Given
      const customError = new TypeError('Type mismatch');
      const context: HttpErrorContext = {
        endpoint: '/api/types',
        operation: 'typecheck',
        entityType: 'TypeValidation',
        field: 'schema',
      };

      // When
      const result = transformer.transform(customError, context);

      // Then
      expect(result.message).toBe('Failed to connect to server');
      expect(result.context?.['endpoint']).toBe('/api/types');
      expect(result.context?.['operation']).toBe('typecheck');
      expect(result.statusCode).toBeUndefined();
      expect(result.originalError).toBe(customError);
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

  describe('InfrastructureError Static Methods Coverage', () => {
    it('should test networkTimeout static method', () => {
      // When
      const result = InfrastructureError.networkTimeout('/api/slow', 5000);

      // Then
      expect(result).toBeInstanceOf(InfrastructureError);
      expect(result.code).toBe('NETWORK_TIMEOUT');
      expect(result.type).toBe('NETWORK');
      expect(result.retryable).toBe(true);
      expect(result.message).toBe('Network timeout after 5000ms');
      expect(result.context?.['endpoint']).toBe('/api/slow');
      expect(result.context?.['timeout']).toBe(5000);
    });

    it('should test dnsResolutionFailed static method', () => {
      // When
      const result = InfrastructureError.dnsResolutionFailed('api.example.com');

      // Then
      expect(result).toBeInstanceOf(InfrastructureError);
      expect(result.code).toBe('DNS_RESOLUTION_FAILED');
      expect(result.type).toBe('CONNECTIVITY');
      expect(result.retryable).toBe(true);
      expect(result.message).toBe('DNS resolution failed for api.example.com');
      expect(result.context?.['hostname']).toBe('api.example.com');
    });

    it('should test certificateError static method', () => {
      // Given
      const certError = new Error('Certificate expired');

      // When
      const result = InfrastructureError.certificateError('https://secure.api.com', certError);

      // Then
      expect(result).toBeInstanceOf(InfrastructureError);
      expect(result.code).toBe('CERTIFICATE_ERROR');
      expect(result.type).toBe('CONNECTIVITY');
      expect(result.retryable).toBe(false);
      expect(result.message).toBe('SSL certificate verification failed');
      expect(result.context?.['endpoint']).toBe('https://secure.api.com');
      expect(result.originalError).toBe(certError);
    });

    it('should test apiVersionNotSupported static method', () => {
      // When
      const result = InfrastructureError.apiVersionNotSupported('/api/v1', 'v1.0');

      // Then
      expect(result).toBeInstanceOf(InfrastructureError);
      expect(result.code).toBe('API_VERSION_NOT_SUPPORTED');
      expect(result.type).toBe('API');
      expect(result.retryable).toBe(false);
      expect(result.message).toBe('API version v1.0 not supported');
      expect(result.context?.['endpoint']).toBe('/api/v1');
      expect(result.context?.['version']).toBe('v1.0');
    });

    it('should test toJSON method coverage', () => {
      // Given
      const error = InfrastructureError.badRequest('/api/test', { field: 'invalid' });

      // When
      const json = error.toJSON();

      // Then
      expect(json['name']).toBe('InfrastructureError');
      expect(json['code']).toBe('HTTP_BAD_REQUEST');
      expect(json['type']).toBe('HTTP');
      expect(json['retryable']).toBe(false);
      expect(json['statusCode']).toBe(400);
      expect(json['endpoint']).toBe('/api/test');
      expect(json['timestamp']).toBeInstanceOf(Date);
    });
  });

  describe('Edge Cases and Coverage', () => {
    it('should handle transform with empty context', () => {
      // Given
      const httpError = new HttpErrorResponse({
        status: 500,
        statusText: 'Internal Server Error',
        url: undefined,
      });
      const emptyContext: HttpErrorContext = {
        endpoint: '',
        operation: '',
      };

      // When
      const result = transformer.transform(httpError, emptyContext);

      // Then
      expect(result).toBeInstanceOf(InfrastructureError);
      expect(result.code).toBe('HTTP_SERVER_ERROR');
      expect(result.context?.['endpoint']).toBe('');
      expect(result.context?.['operation']).toBe('');
    });

    it('should handle HTTP error without status text', () => {
      // Given
      const httpError = new HttpErrorResponse({
        status: 400,
        statusText: '',
        error: null,
        url: '/api/test',
      });
      const context: HttpErrorContext = {
        endpoint: '/api/test',
        operation: 'test',
      };

      // When
      const result = transformer.transform(httpError, context);

      // Then
      expect(result.code).toBe('HTTP_BAD_REQUEST');
      expect(result.statusCode).toBe(400);
      expect(result.context?.['validationErrors']).toBe(null);
    });

    it('should handle HTTP error with complex nested error structure', () => {
      // Given
      const complexError = {
        message: 'Validation failed',
        errors: {
          field1: {
            nested: {
              deep: ['Error message'],
            },
          },
        },
        meta: {
          timestamp: '2024-01-01',
          requestId: 'test-123',
        },
      };
      const httpError = new HttpErrorResponse({
        status: 422,
        statusText: 'Unprocessable Entity',
        error: complexError,
        url: '/api/complex',
      });
      const context: HttpErrorContext = {
        endpoint: '/api/complex',
        operation: 'validate',
        entityType: 'ComplexEntity',
        field: 'nestedField',
      };

      // When
      const result = transformer.transform(httpError, context);

      // Then
      expect(result.code).toBe('HTTP_BAD_REQUEST');
      expect(result.context?.['validationErrors']).toEqual(complexError);
      expect(result.context?.['entityType']).toBe('ComplexEntity');
      expect(result.context?.['field']).toBe('nestedField');
    });

    it('should handle transform with all context fields populated', () => {
      // Given
      const httpError = new HttpErrorResponse({
        status: 403,
        statusText: 'Forbidden',
        error: { detail: 'Access denied' },
        url: '/api/restricted',
      });
      const fullContext: HttpErrorContext = {
        endpoint: '/api/restricted',
        operation: 'access',
        entityType: 'SecureResource',
        field: 'sensitiveData',
      };

      // When
      const result = transformer.transform(httpError, fullContext);

      // Then
      expect(result.code).toBe('HTTP_FORBIDDEN');
      expect(result.context?.['action']).toBe('access');
      expect(result.context?.['entityType']).toBeUndefined(); // forbidden doesn't preserve entityType
      expect(result.context?.['field']).toBeUndefined(); // forbidden doesn't preserve field
    });

    it('should preserve original error for all error types', () => {
      // Given
      const customError = { custom: 'error', nested: { data: 'value' } };
      const context: HttpErrorContext = {
        endpoint: '/api/preserve',
        operation: 'preserve',
      };

      // When
      const result = transformer.transform(customError, context);

      // Then
      expect(result.originalError).toBe(customError);
      expect(result.code).toBe('CONNECTION_FAILED');
      expect(result.type).toBe('CONNECTIVITY');
    });
  });
});
