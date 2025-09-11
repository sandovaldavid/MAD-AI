import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { TOKEN_STORE_PORT, SECURITY_EVENT_REPOSITORY } from '@di/tokens';
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
        { provide: SECURITY_EVENT_REPOSITORY, useValue: mockSecurityLogger },
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
});
