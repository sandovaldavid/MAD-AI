import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { TOKEN_STORE_PORT } from '@di/tokens';
import { TokenSnapshotContract } from '@domain/repositories/session/token-store.contract';
import { SecurityEvent } from '@domain/repositories/system/security-event.repository';
import { HttpErrorTransformer } from '@infrastructure/errors/http-error-transformer';
import { InfrastructureError } from '@infrastructure/errors/infrastructure-error';
import { API_ENDPOINTS_V1 } from '@infrastructure/config/api-endpoints.config';

describe('AuthInterceptor', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let mockTokenStore: jasmine.SpyObj<any>;
  let mockSecurityLogger: jasmine.SpyObj<any>;
  let mockErrorTransformer: jasmine.SpyObj<HttpErrorTransformer>;

  const testUrl = '/api/test';
  const authUrl = `${API_ENDPOINTS_V1.AUTH.BASE}/login`;
  const validToken = 'valid-jwt-token';
  const expiredToken = 'expired-jwt-token';
  const futureTimestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
  const pastTimestamp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago

  beforeEach(() => {
    // Create spies for dependencies
    mockTokenStore = jasmine.createSpyObj('TokenStore', ['read', 'clear']);
    mockSecurityLogger = jasmine.createSpyObj('SecurityLogger', [
      'logSecurityEvent',
      'classifyHttpError',
    ]);
    mockErrorTransformer = jasmine.createSpyObj('HttpErrorTransformer', ['transformWithDefaults']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: TOKEN_STORE_PORT, useValue: mockTokenStore },
        { provide: HttpErrorTransformer, useValue: mockErrorTransformer },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  describe('Token Injection', () => {
    it('should add Authorization header when valid token exists', () => {
      // Arrange
      const validTokenSnapshot: TokenSnapshotContract = {
        accessToken: validToken,
        accessExp: futureTimestamp,
        refreshToken: 'refresh-token',
      };
      mockTokenStore.read.and.returnValue(of(validTokenSnapshot));

      // Act
      httpClient.get(testUrl).subscribe();

      // Assert
      const req = httpTestingController.expectOne(testUrl);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${validToken}`);
      req.flush({ success: true });
    });

    it('should not add Authorization header when token is expired', () => {
      // Arrange
      const expiredTokenSnapshot: TokenSnapshotContract = {
        accessToken: expiredToken,
        accessExp: pastTimestamp,
        refreshToken: 'refresh-token',
      };
      mockTokenStore.read.and.returnValue(of(expiredTokenSnapshot));

      // Act
      httpClient.get(testUrl).subscribe();

      // Assert
      const req = httpTestingController.expectOne(testUrl);
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush({ success: true });
    });

    it('should not add Authorization header when no token exists', () => {
      // Arrange
      mockTokenStore.read.and.returnValue(of(null));

      // Act
      httpClient.get(testUrl).subscribe();

      // Assert
      const req = httpTestingController.expectOne(testUrl);
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush({ success: true });
    });

    it('should not add Authorization header when token snapshot is incomplete', () => {
      // Arrange
      const incompleteTokenSnapshot: TokenSnapshotContract = {
        accessToken: null,
        accessExp: futureTimestamp,
        refreshToken: 'refresh-token',
      };
      mockTokenStore.read.and.returnValue(of(incompleteTokenSnapshot));

      // Act
      httpClient.get(testUrl).subscribe();

      // Assert
      const req = httpTestingController.expectOne(testUrl);
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush({ success: true });
    });

    it('should not add Authorization header when accessToken exists but accessExp is null', () => {
      // Arrange - Test edge case where accessExp is missing
      const tokenSnapshotWithoutExp: TokenSnapshotContract = {
        accessToken: validToken,
        accessExp: null as any,
        refreshToken: 'refresh-token',
      };
      mockTokenStore.read.and.returnValue(of(tokenSnapshotWithoutExp));

      // Act
      httpClient.get(testUrl).subscribe();

      // Assert
      const req = httpTestingController.expectOne(testUrl);
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush({ success: true });
    });

    it('should not add Authorization header when accessExp exists but accessToken is null', () => {
      // Arrange - Test edge case where token is missing but exp exists
      const tokenSnapshotWithoutToken: TokenSnapshotContract = {
        accessToken: null,
        accessExp: futureTimestamp,
        refreshToken: 'refresh-token',
      };
      mockTokenStore.read.and.returnValue(of(tokenSnapshotWithoutToken));

      // Act
      httpClient.get(testUrl).subscribe();

      // Assert
      const req = httpTestingController.expectOne(testUrl);
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush({ success: true });
    });

    it('should not add Authorization header when token expires exactly at current time', () => {
      // Arrange - Test boundary condition where exp equals current timestamp
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const exactExpirationSnapshot: TokenSnapshotContract = {
        accessToken: validToken,
        accessExp: currentTimestamp, // Expires exactly now
        refreshToken: 'refresh-token',
      };
      mockTokenStore.read.and.returnValue(of(exactExpirationSnapshot));

      // Act
      httpClient.get(testUrl).subscribe();

      // Assert
      const req = httpTestingController.expectOne(testUrl);
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush({ success: true });
    });

    it('should add Authorization header when token expires one second from now', () => {
      // Arrange - Test boundary condition where token is barely valid
      const almostExpiredTimestamp = Math.floor(Date.now() / 1000) + 1; // Expires in 1 second
      const almostExpiredSnapshot: TokenSnapshotContract = {
        accessToken: validToken,
        accessExp: almostExpiredTimestamp,
        refreshToken: 'refresh-token',
      };
      mockTokenStore.read.and.returnValue(of(almostExpiredSnapshot));

      // Act
      httpClient.get(testUrl).subscribe();

      // Assert
      const req = httpTestingController.expectOne(testUrl);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${validToken}`);
      req.flush({ success: true });
    });

    it('should handle token with special characters and formatting', () => {
      // Arrange - Test token with complex formatting
      const complexToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const complexTokenSnapshot: TokenSnapshotContract = {
        accessToken: complexToken,
        accessExp: futureTimestamp,
        refreshToken: 'refresh-token',
      };
      mockTokenStore.read.and.returnValue(of(complexTokenSnapshot));

      // Act
      httpClient.get(testUrl).subscribe();

      // Assert
      const req = httpTestingController.expectOne(testUrl);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${complexToken}`);
      req.flush({ success: true });
    });

    it('should handle undefined vs null token snapshot properties', () => {
      // Arrange - Test with undefined properties (different from null)
      const undefinedPropsSnapshot: any = {
        accessToken: undefined,
        accessExp: undefined,
        refreshToken: 'refresh-token',
      };
      mockTokenStore.read.and.returnValue(of(undefinedPropsSnapshot));

      // Act
      httpClient.get(testUrl).subscribe();

      // Assert
      const req = httpTestingController.expectOne(testUrl);
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush({ success: true });
    });

    it('should handle malformed token snapshot structure', () => {
      // Arrange - Test with completely malformed snapshot
      const malformedSnapshot: any = {
        token: validToken, // Wrong property name
        exp: futureTimestamp, // Wrong property name
        refresh: 'refresh-token', // Wrong property name
      };
      mockTokenStore.read.and.returnValue(of(malformedSnapshot));

      // Act
      httpClient.get(testUrl).subscribe();

      // Assert
      const req = httpTestingController.expectOne(testUrl);
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush({ success: true });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockTokenStore.read.and.returnValue(of(null));
    });

    it('should transform HTTP errors to InfrastructureError', () => {
      // Arrange
      const httpError = new HttpErrorResponse({
        status: 500,
        statusText: 'Internal Server Error',
        url: testUrl,
      });
      const transformedError = InfrastructureError.serverError('Server error', testUrl);
      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);
      mockSecurityLogger.classifyHttpError.and.returnValue('SERVER_ERROR');

      // Act & Assert
      httpClient.get(testUrl).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error).toBe(transformedError);
          expect(mockErrorTransformer.transformWithDefaults).toHaveBeenCalledWith(
            httpError,
            testUrl,
            'GET'
          );
        },
      });

      const req = httpTestingController.expectOne(testUrl);
      req.flush(null, httpError);
    });

    it('should log security events for HTTP errors', () => {
      // Arrange
      mockTokenStore.read.and.returnValue(of(null)); // Explicitly set no token
      const httpError = new HttpErrorResponse({
        status: 401,
        statusText: 'Unauthorized',
        url: testUrl,
      });
      const transformedError = InfrastructureError.unauthorized(testUrl);
      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);
      mockSecurityLogger.classifyHttpError.and.returnValue('AUTHENTICATION_FAILURE');

      // Act
      httpClient.get(testUrl).subscribe({
        next: () => fail('Should have failed'),
        error: () => {
          // Verify security event was logged
          expect(mockSecurityLogger.logSecurityEvent).toHaveBeenCalledWith(
            jasmine.objectContaining({
              type: 'AUTHENTICATION_FAILURE',
              details: jasmine.objectContaining({
                status: 401,
                url: testUrl,
                method: 'GET',
                hasValidToken: undefined,
                infrastructureError: transformedError.code,
              }),
            })
          );
        },
      });

      const req = httpTestingController.expectOne(testUrl);
      req.flush(null, httpError);
    });

    it('should clear tokens on 401 error for non-auth endpoints', () => {
      // Arrange
      const validTokenSnapshot: TokenSnapshotContract = {
        accessToken: validToken,
        accessExp: futureTimestamp,
        refreshToken: 'refresh-token',
      };
      mockTokenStore.read.and.returnValue(of(validTokenSnapshot));

      const httpError = new HttpErrorResponse({
        status: 401,
        statusText: 'Unauthorized',
        url: testUrl,
      });
      const transformedError = InfrastructureError.unauthorized(testUrl);
      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);
      mockSecurityLogger.classifyHttpError.and.returnValue('AUTHENTICATION_FAILURE');

      // Act
      httpClient.get(testUrl).subscribe({
        next: () => fail('Should have failed'),
        error: () => {
          expect(mockTokenStore.clear).toHaveBeenCalled();
        },
      });

      const req = httpTestingController.expectOne(testUrl);
      req.flush(null, httpError);
    });

    it('should NOT clear tokens on 401 error for auth endpoints', () => {
      // Arrange
      const validTokenSnapshot: TokenSnapshotContract = {
        accessToken: validToken,
        accessExp: futureTimestamp,
        refreshToken: 'refresh-token',
      };
      mockTokenStore.read.and.returnValue(of(validTokenSnapshot));

      const httpError = new HttpErrorResponse({
        status: 401,
        statusText: 'Unauthorized',
        url: authUrl,
      });
      const transformedError = InfrastructureError.unauthorized(authUrl);
      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);
      mockSecurityLogger.classifyHttpError.and.returnValue('AUTHENTICATION_FAILURE');

      // Act
      httpClient.get(authUrl).subscribe({
        next: () => fail('Should have failed'),
        error: () => {
          expect(mockTokenStore.clear).not.toHaveBeenCalled();
        },
      });

      const req = httpTestingController.expectOne(authUrl);
      req.flush(null, httpError);
    });

    it('should handle non-HTTP errors', () => {
      // Arrange
      const transformedError = InfrastructureError.connectionFailed(
        testUrl,
        new Error('Network error')
      );
      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);

      // Act & Assert
      httpClient.get(testUrl).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error).toBe(transformedError);
          expect(mockErrorTransformer.transformWithDefaults).toHaveBeenCalledWith(
            jasmine.any(HttpErrorResponse),
            testUrl,
            'GET'
          );
        },
      });

      const req = httpTestingController.expectOne(testUrl);
      req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    });

    it('should handle various client error status codes', () => {
      // Arrange - Test different 4xx errors
      const clientErrors = [
        { status: 400, statusText: 'Bad Request', classification: 'CLIENT_ERROR' },
        { status: 404, statusText: 'Not Found', classification: 'CLIENT_ERROR' },
        { status: 409, statusText: 'Conflict', classification: 'CLIENT_ERROR' },
        { status: 422, statusText: 'Unprocessable Entity', classification: 'VALIDATION_ERROR' },
      ];

      clientErrors.forEach((errorCase) => {
        const httpError = new HttpErrorResponse({
          status: errorCase.status,
          statusText: errorCase.statusText,
          url: testUrl,
        });
        const transformedError = InfrastructureError.serverError(errorCase.statusText, testUrl);
        mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);
        mockSecurityLogger.classifyHttpError.and.returnValue(errorCase.classification);

        httpClient.get(testUrl).subscribe({
          next: () => fail(`Should have failed with ${errorCase.status}`),
          error: (error) => {
            expect(error).toBe(transformedError);
            expect(mockSecurityLogger.logSecurityEvent).toHaveBeenCalledWith(
              jasmine.objectContaining({
                type: errorCase.classification,
                details: jasmine.objectContaining({
                  status: errorCase.status,
                  url: testUrl,
                  method: 'GET',
                }),
              })
            );
          },
        });

        const req = httpTestingController.expectOne(testUrl);
        req.flush(null, httpError);
      });
    });

    it('should handle various server error status codes', () => {
      // Arrange - Test different 5xx errors
      const serverErrors = [
        { status: 500, statusText: 'Internal Server Error', classification: 'SERVER_ERROR' },
        { status: 502, statusText: 'Bad Gateway', classification: 'SERVER_ERROR' },
        { status: 503, statusText: 'Service Unavailable', classification: 'SERVER_ERROR' },
        { status: 504, statusText: 'Gateway Timeout', classification: 'SERVER_ERROR' },
      ];

      serverErrors.forEach((errorCase) => {
        const httpError = new HttpErrorResponse({
          status: errorCase.status,
          statusText: errorCase.statusText,
          url: testUrl,
        });
        const transformedError = InfrastructureError.serverError(errorCase.statusText, testUrl);
        mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);
        mockSecurityLogger.classifyHttpError.and.returnValue(errorCase.classification);

        httpClient.get(testUrl).subscribe({
          next: () => fail(`Should have failed with ${errorCase.status}`),
          error: (error) => {
            expect(error).toBe(transformedError);
            expect(mockErrorTransformer.transformWithDefaults).toHaveBeenCalledWith(
              httpError,
              testUrl,
              'GET'
            );
          },
        });

        const req = httpTestingController.expectOne(testUrl);
        req.flush(null, httpError);
      });
    });

    it('should handle rate limiting errors specifically', () => {
      // Arrange
      const rateLimitError = new HttpErrorResponse({
        status: 429,
        statusText: 'Too Many Requests',
        url: testUrl,
        headers: new HttpHeaders({ 'Retry-After': '60' }),
      });
      const transformedError = InfrastructureError.serverError('Rate limit exceeded', testUrl);
      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);
      mockSecurityLogger.classifyHttpError.and.returnValue('RATE_LIMIT_EXCEEDED');

      // Act & Assert
      httpClient.post(testUrl, { data: 'test' }).subscribe({
        next: () => fail('Should have failed with 429'),
        error: (error) => {
          expect(error).toBe(transformedError);
          expect(mockSecurityLogger.logSecurityEvent).toHaveBeenCalledWith(
            jasmine.objectContaining({
              type: 'RATE_LIMIT_EXCEEDED',
              details: jasmine.objectContaining({
                status: 429,
                url: testUrl,
                method: 'POST',
              }),
            })
          );
        },
      });

      const req = httpTestingController.expectOne(testUrl);
      req.flush(null, rateLimitError);
    });

    it('should handle network connectivity errors (status 0)', () => {
      // Arrange
      const networkError = new HttpErrorResponse({
        status: 0,
        statusText: '',
        url: testUrl,
      });
      const transformedError = InfrastructureError.connectionFailed(
        testUrl,
        new Error('Network connection failed')
      );
      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);
      mockSecurityLogger.classifyHttpError.and.returnValue('NETWORK_ERROR');

      // Act & Assert
      httpClient.get(testUrl).subscribe({
        next: () => fail('Should have failed with network error'),
        error: (error) => {
          expect(error).toBe(transformedError);
          expect(mockSecurityLogger.logSecurityEvent).toHaveBeenCalledWith(
            jasmine.objectContaining({
              type: 'NETWORK_ERROR',
              details: jasmine.objectContaining({
                status: 0,
                url: testUrl,
                method: 'GET',
              }),
            })
          );
        },
      });

      const req = httpTestingController.expectOne(testUrl);
      req.flush(null, networkError);
    });

    it('should handle errors with missing or undefined URL', () => {
      // Arrange - This test verifies interceptor still works when error URL is undefined
      const transformedError = InfrastructureError.serverError('Server error', testUrl);
      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);
      mockSecurityLogger.classifyHttpError.and.returnValue('SERVER_ERROR');

      // Act & Assert
      httpClient.get(testUrl).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error).toBe(transformedError);
          // Verify transformer is called (URL from request, not error response)
          expect(mockErrorTransformer.transformWithDefaults).toHaveBeenCalledWith(
            jasmine.any(HttpErrorResponse),
            testUrl,
            'GET'
          );
        },
      });

      // Create error with undefined URL after request is made
      const req = httpTestingController.expectOne(testUrl);
      const undefinedUrlError = new HttpErrorResponse({
        status: 500,
        statusText: 'Internal Server Error',
        url: undefined,
      });
      req.flush(null, undefinedUrlError);
    });

    it('should handle errors with complex error bodies', () => {
      // Arrange
      const complexErrorBody = {
        error: 'validation_failed',
        message: 'Multiple validation errors occurred',
        details: {
          field_errors: {
            email: ['Email is required', 'Email format is invalid'],
            password: ['Password must be at least 8 characters'],
          },
          global_errors: ['Account is temporarily locked'],
        },
        timestamp: new Date().toISOString(),
        request_id: 'req_12345',
      };

      const validationError = new HttpErrorResponse({
        status: 422,
        statusText: 'Unprocessable Entity',
        url: testUrl,
        error: complexErrorBody,
      });

      const transformedError = InfrastructureError.serverError('Validation failed', testUrl);
      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);
      mockSecurityLogger.classifyHttpError.and.returnValue('VALIDATION_ERROR');

      // Act & Assert
      httpClient.put(testUrl, { email: '', password: '123' }).subscribe({
        next: () => fail('Should have failed with validation error'),
        error: (error) => {
          expect(error).toBe(transformedError);
          expect(mockSecurityLogger.logSecurityEvent).toHaveBeenCalledWith(
            jasmine.objectContaining({
              type: 'VALIDATION_ERROR',
              details: jasmine.objectContaining({
                status: 422,
                url: testUrl,
                method: 'PUT',
              }),
            })
          );
        },
      });

      const req = httpTestingController.expectOne(testUrl);
      req.flush(complexErrorBody, validationError);
    });
  });

  describe('Security Event Logging', () => {
    beforeEach(() => {
      mockTokenStore.read.and.returnValue(of(null));
    });

    it('should include correct security event details', () => {
      // Arrange
      mockTokenStore.read.and.returnValue(of(null)); // Ensure no token available
      const httpError = new HttpErrorResponse({
        status: 403,
        statusText: 'Forbidden',
        url: testUrl,
      });
      const transformedError = InfrastructureError.forbidden('Forbidden', testUrl);
      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);
      mockSecurityLogger.classifyHttpError.and.returnValue('AUTHORIZATION_FAILURE');

      // Act
      httpClient.post(testUrl, { data: 'test' }).subscribe({
        next: () => fail('Should have failed'),
        error: () => {
          const loggedEvent = mockSecurityLogger.logSecurityEvent.calls.mostRecent()
            .args[0] as SecurityEvent;

          expect(loggedEvent.type).toBe('AUTHORIZATION_FAILURE');
          expect(loggedEvent.details['status']).toBe(403);
          expect(loggedEvent.details['url']).toBe(testUrl);
          expect(loggedEvent.details['method']).toBe('POST');
          expect(loggedEvent.details['hasValidToken']).toBeUndefined();
          expect(loggedEvent.details['infrastructureError']).toBe(transformedError.code);
          expect(loggedEvent.details['timestamp']).toBeDefined();
          expect(loggedEvent.timestamp).toBeInstanceOf(Date);
        },
      });

      const req = httpTestingController.expectOne(testUrl);
      req.flush(null, httpError);
    });

    it('should log hasValidToken as true when token is valid', () => {
      // Arrange
      const validTokenSnapshot: TokenSnapshotContract = {
        accessToken: validToken,
        accessExp: futureTimestamp,
        refreshToken: 'refresh-token',
      };
      mockTokenStore.read.and.returnValue(of(validTokenSnapshot));

      const httpError = new HttpErrorResponse({
        status: 403,
        statusText: 'Forbidden',
        url: testUrl,
      });
      const transformedError = InfrastructureError.forbidden('Forbidden', testUrl);
      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);
      mockSecurityLogger.classifyHttpError.and.returnValue('AUTHORIZATION_FAILURE');

      // Act
      httpClient.get(testUrl).subscribe({
        next: () => fail('Should have failed'),
        error: () => {
          const loggedEvent = mockSecurityLogger.logSecurityEvent.calls.mostRecent()
            .args[0] as SecurityEvent;
          expect(loggedEvent.details['hasValidToken']).toBeTruthy();
        },
      });

      const req = httpTestingController.expectOne(testUrl);
      req.flush(null, httpError);
    });

    it('should handle different security event classifications', () => {
      // Arrange - Test various error classifications
      const eventTypes = [
        { status: 400, expectedType: 'CLIENT_ERROR' },
        { status: 401, expectedType: 'AUTHENTICATION_FAILURE' },
        { status: 403, expectedType: 'AUTHORIZATION_FAILURE' },
        { status: 404, expectedType: 'RESOURCE_NOT_FOUND' },
        { status: 429, expectedType: 'RATE_LIMIT_EXCEEDED' },
        { status: 500, expectedType: 'SERVER_ERROR' },
        { status: 0, expectedType: 'NETWORK_ERROR' },
      ];

      eventTypes.forEach(({ status, expectedType }) => {
        const httpError = new HttpErrorResponse({
          status: status,
          statusText: 'Test Error',
          url: testUrl,
        });
        const transformedError = InfrastructureError.serverError('Test error', testUrl);
        mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);
        mockSecurityLogger.classifyHttpError.and.returnValue(expectedType);

        httpClient.get(testUrl).subscribe({
          next: () => fail(`Should have failed with ${status}`),
          error: () => {
            expect(mockSecurityLogger.logSecurityEvent).toHaveBeenCalledWith(
              jasmine.objectContaining({
                type: expectedType,
                details: jasmine.objectContaining({
                  status: status,
                }),
              })
            );
          },
        });

        const req = httpTestingController.expectOne(testUrl);
        req.flush(null, httpError);

        mockSecurityLogger.logSecurityEvent.calls.reset();
      });
    });

    it('should handle security event logging failures gracefully', () => {
      // Arrange - Mock security logger to throw error
      const httpError = new HttpErrorResponse({
        status: 401,
        statusText: 'Unauthorized',
        url: testUrl,
      });
      const transformedError = InfrastructureError.unauthorized(testUrl);
      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);
      mockSecurityLogger.classifyHttpError.and.returnValue('AUTHENTICATION_FAILURE');
      mockSecurityLogger.logSecurityEvent.and.throwError('Logging failed');

      // Act & Assert - Logging failure should propagate and replace the transformed error
      httpClient.get(testUrl).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          // When logging fails, the logging error is propagated instead
          expect(error).toEqual(jasmine.any(Error));
          expect(error.message).toBe('Logging failed');
          expect(mockSecurityLogger.logSecurityEvent).toHaveBeenCalled();
        },
      });

      const req = httpTestingController.expectOne(testUrl);
      req.flush(null, httpError);
    });

    it('should include correct timestamp information in security events', () => {
      // Arrange
      const beforeTime = new Date();
      const httpError = new HttpErrorResponse({
        status: 403,
        statusText: 'Forbidden',
        url: testUrl,
      });
      const transformedError = InfrastructureError.forbidden('Forbidden', testUrl);
      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);
      mockSecurityLogger.classifyHttpError.and.returnValue('AUTHORIZATION_FAILURE');

      // Act
      httpClient.get(testUrl).subscribe({
        next: () => fail('Should have failed'),
        error: () => {
          const loggedEvent = mockSecurityLogger.logSecurityEvent.calls.mostRecent()
            .args[0] as SecurityEvent;
          const afterTime = new Date();

          // Verify timestamp is within reasonable bounds
          expect(loggedEvent.timestamp).toBeInstanceOf(Date);
          expect(loggedEvent.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
          expect(loggedEvent.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());

          // Verify ISO string timestamp in details
          expect(loggedEvent.details['timestamp']).toBeDefined();
          expect(typeof loggedEvent.details['timestamp']).toBe('string');
          expect(new Date(loggedEvent.details['timestamp'] as string)).toBeInstanceOf(Date);
        },
      });

      const req = httpTestingController.expectOne(testUrl);
      req.flush(null, httpError);
    });

    it('should log different HTTP methods correctly', () => {
      // Arrange - Test different HTTP methods
      const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

      httpMethods.forEach((method) => {
        const httpError = new HttpErrorResponse({
          status: 401,
          statusText: 'Unauthorized',
          url: testUrl,
        });
        const transformedError = InfrastructureError.unauthorized(testUrl);
        mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);
        mockSecurityLogger.classifyHttpError.and.returnValue('AUTHENTICATION_FAILURE');

        // Act based on method
        const request =
          method === 'GET'
            ? httpClient.get(testUrl)
            : method === 'POST'
              ? httpClient.post(testUrl, {})
              : method === 'PUT'
                ? httpClient.put(testUrl, {})
                : method === 'DELETE'
                  ? httpClient.delete(testUrl)
                  : httpClient.patch(testUrl, {});

        request.subscribe({
          next: () => fail(`Should have failed for ${method}`),
          error: () => {
            expect(mockSecurityLogger.logSecurityEvent).toHaveBeenCalledWith(
              jasmine.objectContaining({
                details: jasmine.objectContaining({
                  method: method,
                }),
              })
            );
          },
        });

        const req = httpTestingController.expectOne(testUrl);
        req.flush(null, httpError);

        mockSecurityLogger.logSecurityEvent.calls.reset();
      });
    });

    it('should handle edge cases in security event details', () => {
      // Arrange - Test with complex URL and headers
      const complexUrl =
        'https://api.example.com/v1/users/123?include=roles&fields=id,name#section';
      const httpError = new HttpErrorResponse({
        status: 403,
        statusText: 'Forbidden',
        url: complexUrl,
        headers: new HttpHeaders({
          'X-Request-ID': 'req-123',
          'X-Rate-Limit-Remaining': '0',
        }),
      });
      const transformedError = InfrastructureError.forbidden('Access denied', complexUrl);
      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);
      mockSecurityLogger.classifyHttpError.and.returnValue('AUTHORIZATION_FAILURE');

      // Act
      httpClient.get(complexUrl).subscribe({
        next: () => fail('Should have failed'),
        error: () => {
          const loggedEvent = mockSecurityLogger.logSecurityEvent.calls.mostRecent()
            .args[0] as SecurityEvent;

          expect(loggedEvent.details['url']).toBe(complexUrl);
          expect(loggedEvent.details['infrastructureError']).toBe(transformedError.code);
          expect(loggedEvent.type).toBe('AUTHORIZATION_FAILURE');
        },
      });

      const req = httpTestingController.expectOne(complexUrl);
      req.flush(null, httpError);
    });
  });

  describe('URL Matching and Auth Endpoint Logic', () => {
    beforeEach(() => {
      const validTokenSnapshot: TokenSnapshotContract = {
        accessToken: validToken,
        accessExp: futureTimestamp,
        refreshToken: 'refresh-token',
      };
      mockTokenStore.read.and.returnValue(of(validTokenSnapshot));
    });

    it('should NOT clear tokens for URLs that START with auth base path', () => {
      // Arrange - Test exact auth URL matching
      const authUrls = [
        `${API_ENDPOINTS_V1.AUTH.BASE}/login`,
        `${API_ENDPOINTS_V1.AUTH.BASE}/refresh`,
        `${API_ENDPOINTS_V1.AUTH.BASE}/logout`,
        `${API_ENDPOINTS_V1.AUTH.BASE}/register`,
      ];

      authUrls.forEach((url) => {
        const httpError = new HttpErrorResponse({
          status: 401,
          statusText: 'Unauthorized',
          url: url,
        });
        const transformedError = InfrastructureError.unauthorized(url);
        mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);
        mockSecurityLogger.classifyHttpError.and.returnValue('AUTHENTICATION_FAILURE');

        httpClient.post(url, {}).subscribe({
          next: () => fail(`Should have failed for ${url}`),
          error: () => {
            expect(mockTokenStore.clear).not.toHaveBeenCalled();
          },
        });

        const req = httpTestingController.expectOne(url);
        req.flush(null, httpError);
      });
    });

    it('should clear tokens for URLs that CONTAIN but do not START with auth base path', () => {
      // Arrange - Test URLs that contain auth path but don't start with it
      const nonAuthUrls = [
        `/api/v1/users/auth/profile`, // Contains auth but doesn't start with it
        `/different${API_ENDPOINTS_V1.AUTH.BASE}/login`, // Prefixed with other path
        `/api/v1/admin/auth/settings`, // Different context
      ];

      nonAuthUrls.forEach((url) => {
        const httpError = new HttpErrorResponse({
          status: 401,
          statusText: 'Unauthorized',
          url: url,
        });
        const transformedError = InfrastructureError.unauthorized(url);
        mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);
        mockSecurityLogger.classifyHttpError.and.returnValue('AUTHENTICATION_FAILURE');

        httpClient.get(url).subscribe({
          next: () => fail(`Should have failed for ${url}`),
          error: () => {
            expect(mockTokenStore.clear).toHaveBeenCalled();
          },
        });

        const req = httpTestingController.expectOne(url);
        req.flush(null, httpError);

        // Reset spy for next iteration
        mockTokenStore.clear.calls.reset();
      });
    });

    it('should handle URLs with query parameters and fragments', () => {
      // Arrange - Test complex URLs
      const complexUrls = [
        `${API_ENDPOINTS_V1.AUTH.BASE}/login?redirect=/dashboard&state=abc123`,
        `${API_ENDPOINTS_V1.AUTH.BASE}/refresh?force=true`,
        `/api/v1/users/profile?auth=true&token=xyz#section`, // Non-auth URL
      ];

      complexUrls.forEach((url) => {
        const isAuthUrl = url.startsWith(API_ENDPOINTS_V1.AUTH.BASE);
        const httpError = new HttpErrorResponse({
          status: 401,
          statusText: 'Unauthorized',
          url: url,
        });
        const transformedError = InfrastructureError.unauthorized(url);
        mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);
        mockSecurityLogger.classifyHttpError.and.returnValue('AUTHENTICATION_FAILURE');

        httpClient.get(url).subscribe({
          next: () => fail(`Should have failed for ${url}`),
          error: () => {
            if (isAuthUrl) {
              expect(mockTokenStore.clear).not.toHaveBeenCalled();
            } else {
              expect(mockTokenStore.clear).toHaveBeenCalled();
            }
          },
        });

        const req = httpTestingController.expectOne(url);
        req.flush(null, httpError);

        mockTokenStore.clear.calls.reset();
      });
    });

    it('should handle relative URLs correctly', () => {
      // Arrange - Test relative URL handling
      const relativeUrls = [
        '/api/auth/login', // Relative auth URL
        './api/auth/refresh', // Relative with dot notation
        '../auth/logout', // Relative with parent directory
      ];

      relativeUrls.forEach((url) => {
        // For relative URLs, startsWith check works the same way
        const isAuthUrl = url.startsWith(API_ENDPOINTS_V1.AUTH.BASE);
        const httpError = new HttpErrorResponse({
          status: 401,
          statusText: 'Unauthorized',
          url: url,
        });
        const transformedError = InfrastructureError.unauthorized(url);
        mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);
        mockSecurityLogger.classifyHttpError.and.returnValue('AUTHENTICATION_FAILURE');

        httpClient.get(url).subscribe({
          next: () => fail(`Should have failed for ${url}`),
          error: () => {
            if (isAuthUrl) {
              expect(mockTokenStore.clear).not.toHaveBeenCalled();
            } else {
              expect(mockTokenStore.clear).toHaveBeenCalled();
            }
          },
        });

        const req = httpTestingController.expectOne(url);
        req.flush(null, httpError);

        mockTokenStore.clear.calls.reset();
      });
    });

    it('should handle empty or null URLs gracefully', () => {
      // Arrange - Test edge cases with missing URLs
      const edgeCaseUrls = [
        '', // Empty string
        null as any, // Null URL
        undefined as any, // Undefined URL
      ];

      edgeCaseUrls.forEach((url) => {
        const httpError = new HttpErrorResponse({
          status: 401,
          statusText: 'Unauthorized',
          url: url,
        });
        const transformedError = InfrastructureError.unauthorized(url);
        mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);
        mockSecurityLogger.classifyHttpError.and.returnValue('AUTHENTICATION_FAILURE');

        // For null/undefined URLs, should clear tokens (safe default)
        httpClient.get(testUrl).subscribe({
          next: () => fail(`Should have failed for ${url}`),
          error: () => {
            expect(mockTokenStore.clear).toHaveBeenCalled();
          },
        });

        const req = httpTestingController.expectOne(testUrl);
        req.flush(null, httpError);

        mockTokenStore.clear.calls.reset();
      });
    });

    it('should handle case sensitivity in URL matching', () => {
      // Arrange - Test case sensitivity behavior
      const caseVariations = [
        API_ENDPOINTS_V1.AUTH.BASE.toUpperCase() + '/LOGIN', // Uppercase
        API_ENDPOINTS_V1.AUTH.BASE.toLowerCase() + '/login', // Lowercase
        API_ENDPOINTS_V1.AUTH.BASE + '/LOGIN', // Mixed case endpoint
      ];

      caseVariations.forEach((url) => {
        const isExactMatch = url.startsWith(API_ENDPOINTS_V1.AUTH.BASE);
        const httpError = new HttpErrorResponse({
          status: 401,
          statusText: 'Unauthorized',
          url: url,
        });
        const transformedError = InfrastructureError.unauthorized(url);
        mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);
        mockSecurityLogger.classifyHttpError.and.returnValue('AUTHENTICATION_FAILURE');

        httpClient.get(url).subscribe({
          next: () => fail(`Should have failed for ${url}`),
          error: () => {
            if (isExactMatch) {
              expect(mockTokenStore.clear).not.toHaveBeenCalled();
            } else {
              expect(mockTokenStore.clear).toHaveBeenCalled();
            }
          },
        });

        const req = httpTestingController.expectOne(url);
        req.flush(null, httpError);

        mockTokenStore.clear.calls.reset();
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete flow with valid token and successful response', () => {
      // Arrange
      const validTokenSnapshot: TokenSnapshotContract = {
        accessToken: validToken,
        accessExp: futureTimestamp,
        refreshToken: 'refresh-token',
      };
      mockTokenStore.read.and.returnValue(of(validTokenSnapshot));
      const responseData = { id: 1, name: 'Test' };

      // Act
      httpClient.get(testUrl).subscribe((response) => {
        expect(response).toEqual(responseData);
      });

      // Assert
      const req = httpTestingController.expectOne(testUrl);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${validToken}`);
      req.flush(responseData);

      // Verify no security events were logged for successful requests
      expect(mockSecurityLogger.logSecurityEvent).not.toHaveBeenCalled();
    });

    it('should handle token store read errors gracefully', () => {
      // Arrange
      mockTokenStore.read.and.returnValue(throwError(() => new Error('Storage error')));

      // Act & Assert
      httpClient.get(testUrl).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toBe('Storage error');
        },
      });

      // No HTTP request should be made if token store fails
      httpTestingController.expectNone(testUrl);
    });
  });

  describe('Concurrent Request Scenarios', () => {
    it('should handle multiple simultaneous requests with same token', () => {
      // Arrange
      const validTokenSnapshot: TokenSnapshotContract = {
        accessToken: validToken,
        accessExp: futureTimestamp,
        refreshToken: 'refresh-token',
      };
      mockTokenStore.read.and.returnValue(of(validTokenSnapshot));

      const urls = ['/api/users', '/api/roles', '/api/permissions'];
      const responses: any[] = [];

      // Act - Make multiple concurrent requests
      urls.forEach((url, index) => {
        httpClient.get(url).subscribe((response) => {
          responses.push({ url, response, index });
        });
      });

      // Assert - All requests should have Authorization header
      urls.forEach((url) => {
        const req = httpTestingController.expectOne(url);
        expect(req.request.headers.get('Authorization')).toBe(`Bearer ${validToken}`);
        req.flush({ success: true, url });
      });

      expect(responses.length).toBe(3);
      expect(mockTokenStore.read).toHaveBeenCalledTimes(3); // Called once per request
    });

    it('should handle token expiration during concurrent requests', () => {
      // Arrange - Token expires between requests
      const expiredTokenSnapshot: TokenSnapshotContract = {
        accessToken: expiredToken,
        accessExp: pastTimestamp,
        refreshToken: 'refresh-token',
      };
      mockTokenStore.read.and.returnValue(of(expiredTokenSnapshot));

      // Act - Multiple requests with expired token
      httpClient.get('/api/users').subscribe();
      httpClient.get('/api/roles').subscribe();

      // Assert - No Authorization headers should be added
      const req1 = httpTestingController.expectOne('/api/users');
      const req2 = httpTestingController.expectOne('/api/roles');

      expect(req1.request.headers.has('Authorization')).toBeFalse();
      expect(req2.request.headers.has('Authorization')).toBeFalse();

      req1.flush({});
      req2.flush({});
    });

    it('should handle race conditions in token clearing', () => {
      // Arrange - Valid token but will cause 401
      const validTokenSnapshot: TokenSnapshotContract = {
        accessToken: validToken,
        accessExp: futureTimestamp,
        refreshToken: 'refresh-token',
      };
      mockTokenStore.read.and.returnValue(of(validTokenSnapshot));

      const httpError = new HttpErrorResponse({
        status: 401,
        statusText: 'Unauthorized',
        url: '/api/users',
      });
      const transformedError = InfrastructureError.unauthorized('/api/users');
      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);
      mockSecurityLogger.classifyHttpError.and.returnValue('AUTHENTICATION_FAILURE');

      // Act - Multiple requests that will all get 401
      const errors: any[] = [];
      ['/api/users', '/api/roles', '/api/permissions'].forEach((url) => {
        httpClient.get(url).subscribe({
          next: () => fail(`Should have failed for ${url}`),
          error: (error) => errors.push({ url, error }),
        });
      });

      // Assert - All should attempt to clear tokens
      const requests = httpTestingController.match(() => true);
      requests.forEach((req) => {
        req.flush(null, httpError);
      });

      expect(errors.length).toBe(3);
      // Token clear should be called multiple times (once per request)
      expect(mockTokenStore.clear).toHaveBeenCalledTimes(3);
    });
  });

  describe('Header Manipulation Edge Cases', () => {
    beforeEach(() => {
      const validTokenSnapshot: TokenSnapshotContract = {
        accessToken: validToken,
        accessExp: futureTimestamp,
        refreshToken: 'refresh-token',
      };
      mockTokenStore.read.and.returnValue(of(validTokenSnapshot));
    });

    it('should handle requests with existing Authorization header', () => {
      // Arrange - Request already has Authorization header
      const existingToken = 'existing-token';
      const requestWithAuth = httpClient.get(testUrl, {
        headers: { Authorization: `Bearer ${existingToken}` },
      });

      // Act
      requestWithAuth.subscribe();

      // Assert - Should replace with valid token
      const req = httpTestingController.expectOne(testUrl);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${validToken}`);
      expect(req.request.headers.get('Authorization')).not.toContain(existingToken);
      req.flush({});
    });

    it('should handle requests with other custom headers', () => {
      // Arrange - Request with multiple custom headers
      const customHeaders = {
        'X-Custom-Header': 'custom-value',
        'Content-Type': 'application/json',
        'X-Request-ID': 'req-123',
      };

      // Act
      httpClient.post(testUrl, {}, { headers: customHeaders }).subscribe();

      // Assert - Should preserve other headers and add Authorization
      const req = httpTestingController.expectOne(testUrl);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${validToken}`);
      expect(req.request.headers.get('X-Custom-Header')).toBe('custom-value');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('X-Request-ID')).toBe('req-123');
      req.flush({});
    });

    it('should handle case-insensitive header operations', () => {
      // Arrange - Headers with different cases
      const mixedCaseHeaders = {
        authorization: 'existing-lowercase',
        Authorization: 'existing-proper',
        AUTHORIZATION: 'existing-uppercase',
      };

      // Act
      httpClient.get(testUrl, { headers: mixedCaseHeaders }).subscribe();

      // Assert - Should handle case sensitivity properly
      const req = httpTestingController.expectOne(testUrl);
      const authHeader = req.request.headers.get('Authorization');
      expect(authHeader).toBe(`Bearer ${validToken}`);
      req.flush({});
    });

    it('should handle requests with no headers initially', () => {
      // Arrange - Plain request without any headers
      // Act
      httpClient.get(testUrl).subscribe();

      // Assert - Should add Authorization header
      const req = httpTestingController.expectOne(testUrl);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${validToken}`);

      // Verify no other headers were accidentally added
      const headerKeys = req.request.headers.keys();
      expect(headerKeys).toContain('Authorization');
      req.flush({});
    });

    it('should handle header cloning edge cases', () => {
      // Arrange - Test request cloning with complex header scenarios
      const complexHeaders = {
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      };

      // Act
      httpClient.put(testUrl, { data: 'test' }, { headers: complexHeaders }).subscribe();

      // Assert - All headers should be preserved during cloning
      const req = httpTestingController.expectOne(testUrl);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${validToken}`);
      expect(req.request.headers.get('Accept')).toBe('application/json, text/plain, */*');
      expect(req.request.headers.get('Accept-Language')).toBe('en-US,en;q=0.9');
      expect(req.request.headers.get('Cache-Control')).toBe('no-cache');
      expect(req.request.headers.get('Pragma')).toBe('no-cache');
      req.flush({});
    });
  });

  describe('Error Propagation and Integration', () => {
    it('should handle error transformer failures', () => {
      // Arrange - Mock error transformer to throw
      mockTokenStore.read.and.returnValue(of(null));
      const httpError = new HttpErrorResponse({
        status: 500,
        statusText: 'Internal Server Error',
        url: testUrl,
      });
      mockErrorTransformer.transformWithDefaults.and.throwError('Transformer failed');

      // Act & Assert - Should propagate transformer error
      httpClient.get(testUrl).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toBe('Transformer failed');
        },
      });

      const req = httpTestingController.expectOne(testUrl);
      req.flush(null, httpError);
    });

    it('should handle complex error scenarios with all components failing', () => {
      // Arrange - Everything fails
      mockTokenStore.read.and.returnValue(of(null));
      const httpError = new HttpErrorResponse({
        status: 500,
        statusText: 'Internal Server Error',
        url: testUrl,
      });
      const transformedError = InfrastructureError.serverError('Server error', testUrl);
      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);
      mockSecurityLogger.classifyHttpError.and.throwError('Classification failed');
      mockSecurityLogger.logSecurityEvent.and.throwError('Logging failed');

      // Act & Assert - Classification failure should propagate and replace the transformed error
      httpClient.get(testUrl).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          // When classification fails, the classification error is propagated instead
          expect(error).toEqual(jasmine.any(Error));
          expect(error.message).toBe('Classification failed');
        },
      });

      const req = httpTestingController.expectOne(testUrl);
      req.flush(null, httpError);
    });

    it('should handle non-HTTP errors in the pipeline', () => {
      // Arrange - Simulate non-HTTP error (e.g., network, parsing)
      mockTokenStore.read.and.returnValue(of(null));
      const nonHttpError = new Error('Network connection failed');
      const transformedError = InfrastructureError.connectionFailed(testUrl, nonHttpError);
      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);

      // Act & Assert
      httpClient.get(testUrl).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error).toBe(transformedError);
          // Should still attempt to transform non-HTTP errors
          expect(mockErrorTransformer.transformWithDefaults).toHaveBeenCalled();
        },
      });

      const req = httpTestingController.expectOne(testUrl);
      req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    });
  });
});
