import { InfrastructureError } from './infrastructure-error';
import { HttpErrorResponse } from '@angular/common/http';

describe('InfrastructureError - Infrastructure Tests', () => {
  describe('Constructor', () => {
    it('should create error with all required properties', () => {
      // Given
      const message = 'Server error occurred';
      const code = 'HTTP_SERVER_ERROR';
      const type: 'NETWORK' | 'HTTP' | 'API' | 'CONNECTIVITY' = 'HTTP';
      const retryable = true;
      const context = { operation: 'create', entityType: 'User' };
      const statusCode = 500;
      const originalError = new Error('Original error');
      const endpoint = '/api/users';

      // When
      const error = new InfrastructureError(
        message,
        code,
        type,
        retryable,
        context,
        statusCode,
        originalError,
        endpoint
      );

      // Then
      expect(error.code).toBe(code);
      expect(error.message).toBe(message);
      expect(error.type).toBe(type);
      expect(error.retryable).toBe(retryable);
      expect(error.statusCode).toBe(statusCode);
      expect(error.endpoint).toBe(endpoint);
      expect(error.originalError).toBe(originalError);
      expect(error.context).toBe(context);
      expect(error.timestamp).toBeInstanceOf(Date);
      expect(error.name).toBe('InfrastructureError');
    });

    it('should create error with minimal required properties', () => {
      // Given
      const message = 'Connection failed';
      const code = 'CONNECTION_FAILED';
      const type: 'NETWORK' | 'HTTP' | 'API' | 'CONNECTIVITY' = 'CONNECTIVITY';
      const retryable = true;

      // When
      const error = new InfrastructureError(message, code, type, retryable);

      // Then
      expect(error.code).toBe(code);
      expect(error.message).toBe(message);
      expect(error.type).toBe(type);
      expect(error.retryable).toBe(retryable);
      expect(error.statusCode).toBeUndefined();
      expect(error.endpoint).toBeUndefined();
      expect(error.originalError).toBeUndefined();
      expect(error.context).toBeUndefined();
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should inherit from Error class', () => {
      // Given
      const error = new InfrastructureError('Bad request', 'HTTP_BAD_REQUEST', 'HTTP', false);

      // Then
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(InfrastructureError);
      expect(error.stack).toBeDefined();
    });

    it('should extract endpoint from context when not provided as parameter', () => {
      // Given
      const context = { endpoint: '/api/from-context', operation: 'test' };
      const error = new InfrastructureError('Test error', 'TEST_ERROR', 'HTTP', false, context);

      // Then
      expect(error.endpoint).toBe('/api/from-context');
    });

    it('should prioritize endpoint parameter over context endpoint', () => {
      // Given
      const context = { endpoint: '/api/from-context' };
      const endpointParam = '/api/from-param';
      const error = new InfrastructureError(
        'Test error',
        'TEST_ERROR',
        'HTTP',
        false,
        context,
        undefined,
        undefined,
        endpointParam
      );

      // Then
      expect(error.endpoint).toBe('/api/from-param');
    });
  });

  describe('Static Factory Methods', () => {
    describe('networkTimeout', () => {
      it('should create network timeout error', () => {
        // Given
        const endpoint = '/api/users';
        const timeout = 5000;

        // When
        const error = InfrastructureError.networkTimeout(endpoint, timeout);

        // Then
        expect(error.code).toBe('NETWORK_TIMEOUT');
        expect(error.message).toBe(`Network timeout after ${timeout}ms`);
        expect(error.type).toBe('NETWORK');
        expect(error.retryable).toBe(true);
        expect(error.context?.['endpoint']).toBe(endpoint);
        expect(error.context?.['timeout']).toBe(timeout);
      });

      it('should handle different timeout values', () => {
        // Given
        const endpoint = '/api/slow';
        const timeout = 10000;

        // When
        const error = InfrastructureError.networkTimeout(endpoint, timeout);

        // Then
        expect(error.message).toBe('Network timeout after 10000ms');
        expect(error.context?.['timeout']).toBe(10000);
      });
    });

    describe('unauthorized', () => {
      it('should create unauthorized error', () => {
        // Given
        const endpoint = '/api/auth';

        // When
        const error = InfrastructureError.unauthorized(endpoint);

        // Then
        expect(error.code).toBe('HTTP_UNAUTHORIZED');
        expect(error.message).toBe('Authentication required');
        expect(error.type).toBe('HTTP');
        expect(error.retryable).toBe(false);
        expect(error.statusCode).toBe(401);
        expect(error.context?.['endpoint']).toBe(endpoint);
      });

      it('should handle different endpoints', () => {
        // Given
        const endpoint = '/api/protected-resource';

        // When
        const error = InfrastructureError.unauthorized(endpoint);

        // Then
        expect(error.context?.['endpoint']).toBe('/api/protected-resource');
      });
    });

    describe('connectionFailed', () => {
      it('should create connection failed error', () => {
        // Given
        const endpoint = '/api/users';
        const originalError = new Error('ECONNREFUSED');

        // When
        const error = InfrastructureError.connectionFailed(endpoint, originalError);

        // Then
        expect(error.code).toBe('CONNECTION_FAILED');
        expect(error.message).toBe('Failed to connect to server');
        expect(error.type).toBe('CONNECTIVITY');
        expect(error.retryable).toBe(true);
        expect(error.originalError).toBe(originalError);
        expect(error.context?.['endpoint']).toBe(endpoint);
      });

      it('should handle different types of connection errors', () => {
        // Given
        const endpoint = '/api/external';
        const originalError = new Error('ETIMEDOUT');

        // When
        const error = InfrastructureError.connectionFailed(endpoint, originalError);

        // Then
        expect(error.originalError).toBe(originalError);
        expect(error.retryable).toBe(true);
      });
    });

    describe('forbidden', () => {
      it('should create forbidden error with action', () => {
        // Given
        const endpoint = '/api/admin';
        const action = 'delete';

        // When
        const error = InfrastructureError.forbidden(endpoint, action);

        // Then
        expect(error.code).toBe('HTTP_FORBIDDEN');
        expect(error.message).toBe(`Access forbidden to ${endpoint}`);
        expect(error.type).toBe('HTTP');
        expect(error.retryable).toBe(false);
        expect(error.statusCode).toBe(403);
        expect(error.context?.['endpoint']).toBe(endpoint);
        expect(error.context?.['action']).toBe(action);
      });

      it('should create forbidden error without action', () => {
        // Given
        const endpoint = '/api/admin';

        // When
        const error = InfrastructureError.forbidden(endpoint);

        // Then
        expect(error.code).toBe('HTTP_FORBIDDEN');
        expect(error.context?.['action']).toBeUndefined();
      });
    });

    describe('badRequest', () => {
      it('should create bad request error with validation errors', () => {
        // Given
        const endpoint = '/api/users';
        const validationErrors = { email: ['Required field'], password: ['Too weak'] };

        // When
        const error = InfrastructureError.badRequest(endpoint, validationErrors);

        // Then
        expect(error.code).toBe('HTTP_BAD_REQUEST');
        expect(error.message).toBe('Bad request sent to server');
        expect(error.type).toBe('HTTP');
        expect(error.retryable).toBe(false);
        expect(error.statusCode).toBe(400);
        expect(error.context?.['endpoint']).toBe(endpoint);
        expect(error.context?.['validationErrors']).toEqual(validationErrors);
      });

      it('should create bad request error without validation errors', () => {
        // Given
        const endpoint = '/api/users';

        // When
        const error = InfrastructureError.badRequest(endpoint);

        // Then
        expect(error.code).toBe('HTTP_BAD_REQUEST');
        expect(error.context?.['validationErrors']).toBeUndefined();
      });
    });

    describe('serverError', () => {
      it('should create server error with original error', () => {
        // Given
        const endpoint = '/api/users';
        const originalError = new HttpErrorResponse({ status: 500 });

        // When
        const error = InfrastructureError.serverError(endpoint, originalError);

        // Then
        expect(error.code).toBe('HTTP_SERVER_ERROR');
        expect(error.message).toBe('Internal server error');
        expect(error.type).toBe('HTTP');
        expect(error.retryable).toBe(true);
        expect(error.statusCode).toBe(500);
        expect(error.originalError).toBe(originalError);
        expect(error.context?.['endpoint']).toBe(endpoint);
      });

      it('should create server error without original error', () => {
        // Given
        const endpoint = '/api/users';

        // When
        const error = InfrastructureError.serverError(endpoint);

        // Then
        expect(error.code).toBe('HTTP_SERVER_ERROR');
        expect(error.originalError).toBeUndefined();
      });
    });

    describe('dnsResolutionFailed', () => {
      it('should create DNS resolution failed error', () => {
        // Given
        const hostname = 'api.example.com';

        // When
        const error = InfrastructureError.dnsResolutionFailed(hostname);

        // Then
        expect(error.code).toBe('DNS_RESOLUTION_FAILED');
        expect(error.message).toBe(`DNS resolution failed for ${hostname}`);
        expect(error.type).toBe('CONNECTIVITY');
        expect(error.retryable).toBe(true);
        expect(error.context?.['hostname']).toBe(hostname);
      });

      it('should handle different hostnames', () => {
        // Given
        const hostname = 'invalid-domain.test';

        // When
        const error = InfrastructureError.dnsResolutionFailed(hostname);

        // Then
        expect(error.message).toBe('DNS resolution failed for invalid-domain.test');
        expect(error.context?.['hostname']).toBe('invalid-domain.test');
      });
    });

    describe('certificateError', () => {
      it('should create certificate error', () => {
        // Given
        const endpoint = 'https://api.example.com';
        const certificateError = new Error('CERT_UNTRUSTED');

        // When
        const error = InfrastructureError.certificateError(endpoint, certificateError);

        // Then
        expect(error.code).toBe('CERTIFICATE_ERROR');
        expect(error.message).toBe('SSL certificate verification failed');
        expect(error.type).toBe('CONNECTIVITY');
        expect(error.retryable).toBe(false);
        expect(error.originalError).toBe(certificateError);
        expect(error.context?.['endpoint']).toBe(endpoint);
      });

      it('should handle different certificate errors', () => {
        // Given
        const endpoint = 'https://expired-cert.example.com';
        const certificateError = new Error('CERT_EXPIRED');

        // When
        const error = InfrastructureError.certificateError(endpoint, certificateError);

        // Then
        expect(error.originalError).toBe(certificateError);
        expect(error.retryable).toBe(false);
      });
    });

    describe('rateLimitExceeded', () => {
      it('should create rate limit exceeded error with retry after', () => {
        // Given
        const endpoint = '/api/data';
        const retryAfter = 60;

        // When
        const error = InfrastructureError.rateLimitExceeded(endpoint, retryAfter);

        // Then
        expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
        expect(error.message).toBe('API rate limit exceeded');
        expect(error.type).toBe('API');
        expect(error.retryable).toBe(true);
        expect(error.context?.['endpoint']).toBe(endpoint);
        expect(error.context?.['retryAfter']).toBe(retryAfter);
      });

      it('should create rate limit exceeded error without retry after', () => {
        // Given
        const endpoint = '/api/data';

        // When
        const error = InfrastructureError.rateLimitExceeded(endpoint);

        // Then
        expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
        expect(error.context?.['retryAfter']).toBeUndefined();
      });
    });

    describe('apiVersionNotSupported', () => {
      it('should create API version not supported error', () => {
        // Given
        const endpoint = '/api/v1/users';
        const version = 'v1';

        // When
        const error = InfrastructureError.apiVersionNotSupported(endpoint, version);

        // Then
        expect(error.code).toBe('API_VERSION_NOT_SUPPORTED');
        expect(error.message).toBe(`API version ${version} not supported`);
        expect(error.type).toBe('API');
        expect(error.retryable).toBe(false);
        expect(error.context?.['endpoint']).toBe(endpoint);
        expect(error.context?.['version']).toBe(version);
      });

      it('should handle different API versions', () => {
        // Given
        const endpoint = '/api/v2/deprecated';
        const version = 'v2';

        // When
        const error = InfrastructureError.apiVersionNotSupported(endpoint, version);

        // Then
        expect(error.message).toBe('API version v2 not supported');
        expect(error.context?.['version']).toBe('v2');
      });
    });
  });

  describe('Error Properties and Behavior', () => {
    it('should set timestamp to current time', () => {
      // Given
      const beforeCreation = new Date();

      // When
      const error = InfrastructureError.connectionFailed('/api/test', new Error('test'));
      const afterCreation = new Date();

      // Then
      expect(error.timestamp).toBeInstanceOf(Date);
      expect(error.timestamp.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(error.timestamp.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });

    it('should maintain error stack trace', () => {
      // When
      const error = InfrastructureError.serverError('/api/test');

      // Then
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('InfrastructureError');
    });

    it('should be serializable to JSON', () => {
      // Given
      const originalError = new Error('Original');
      const context = { operation: 'test', data: { id: 123 } };
      const error = new InfrastructureError(
        'Test error',
        'HTTP_SERVER_ERROR',
        'HTTP',
        true,
        context,
        500,
        originalError,
        '/api/test'
      );

      // When
      const serialized = JSON.stringify(error);
      const parsed = JSON.parse(serialized);

      // Then
      expect(parsed.code).toBe('HTTP_SERVER_ERROR');
      expect(parsed.message).toBe('Test error');
      expect(parsed.type).toBe('HTTP');
      expect(parsed.retryable).toBe(true);
      expect(parsed.statusCode).toBe(500);
      expect(parsed.endpoint).toBe('/api/test');
      expect(parsed.context).toEqual(context);
      expect(parsed.timestamp).toBeDefined();
    });

    it('should handle circular references in context', () => {
      // Given
      const circularContext: any = { name: 'test' };
      circularContext.self = circularContext;

      // When/Then - Should throw for circular references
      expect(() => {
        const error = new InfrastructureError(
          'Test error',
          'TEST_ERROR',
          'HTTP',
          false,
          circularContext
        );
        JSON.stringify(error);
      }).toThrow();
    });
  });

  describe('Error Type Guards', () => {
    it('should identify retryable errors correctly', () => {
      // Given
      const retryableError = InfrastructureError.serverError('/api/test');
      const nonRetryableError = InfrastructureError.badRequest('/api/test');

      // Then
      expect(retryableError.retryable).toBe(true);
      expect(nonRetryableError.retryable).toBe(false);
    });

    it('should categorize error types correctly', () => {
      // Given
      const httpError = InfrastructureError.serverError('/api/test');
      const apiError = InfrastructureError.rateLimitExceeded('/api/test');
      const connectivityError = InfrastructureError.connectionFailed(
        '/api/test',
        new Error('test')
      );
      const networkError = InfrastructureError.networkTimeout('/api/test', 5000);

      // Then
      expect(httpError.type).toBe('HTTP');
      expect(apiError.type).toBe('API');
      expect(connectivityError.type).toBe('CONNECTIVITY');
      expect(networkError.type).toBe('NETWORK');
    });
  });

  describe('Context Handling', () => {
    it('should merge context objects correctly', () => {
      // Given
      const baseContext = { operation: 'create', entityType: 'User' };
      const additionalContext = { field: 'email', value: 'test@example.com' };
      const mergedContext = { ...baseContext, ...additionalContext };

      // When
      const error = new InfrastructureError(
        'Test error',
        'VALIDATION_ERROR',
        'HTTP',
        false,
        mergedContext
      );

      // Then
      expect(error.context?.['operation']).toBe('create');
      expect(error.context?.['entityType']).toBe('User');
      expect(error.context?.['field']).toBe('email');
      expect(error.context?.['value']).toBe('test@example.com');
    });

    it('should handle undefined context gracefully', () => {
      // When
      const error = InfrastructureError.connectionFailed('/api/test', new Error('test'));

      // Then
      expect(error.context).toBeDefined(); // Context is always defined in static methods
      expect(() => error.context?.['anyProperty']).not.toThrow();
    });

    it('should handle empty context objects', () => {
      // Given
      const emptyContext = {};

      // When
      const error = new InfrastructureError(
        'Test error',
        'TEST_ERROR',
        'HTTP',
        false,
        emptyContext
      );

      // Then
      expect(error.context).toEqual({});
      expect(Object.keys(error.context || {}).length).toBe(0);
    });
  });

  describe('Error Inheritance and Properties', () => {
    it('should maintain proper error name', () => {
      // Given
      const error = InfrastructureError.unauthorized('/api/test');

      // Then
      expect(error.name).toBe('InfrastructureError');
    });

    it('should be instanceof Error and InfrastructureError', () => {
      // Given
      const error = InfrastructureError.serverError('/api/test');

      // Then
      expect(error instanceof Error).toBe(true);
      expect(error instanceof InfrastructureError).toBe(true);
    });

    it('should have all required interface properties', () => {
      // Given
      const error = InfrastructureError.badRequest('/api/test', { field: 'error' });

      // Then
      expect(error.type).toBeDefined();
      expect(error.code).toBeDefined();
      expect(error.message).toBeDefined();
      expect(error.timestamp).toBeDefined();
      expect(typeof error.retryable).toBe('boolean');
      expect(error.context).toBeDefined();
      expect(error.statusCode).toBe(400);
      expect(error.originalError).toBeUndefined();
      expect(error.endpoint).toBeDefined();
    });
  });
});
