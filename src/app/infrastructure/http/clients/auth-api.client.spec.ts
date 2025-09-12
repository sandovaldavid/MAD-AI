import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthApiClient } from './auth-api.client';
import { API_ENDPOINTS_V1 } from '@infrastructure/config/api-endpoints.config';
import {
  LoginRequestDTO,
  LoginResponseDTO,
  MeResponseDTO,
  RefreshRequestDTO,
  RefreshResponseDTO,
  LogoutRequestDTO,
  LogoutResponseDTO,
  RegisterRequestDTO,
  RegisterResponseDTO,
  ResetPasswordRequestDTO,
  ResetPasswordResponseDTO,
  ResetPasswordConfirmRequestDTO,
  ResetPasswordConfirmResponseDTO,
  ConfirmEmailResponseDTO,
} from '@infrastructure/dtos/auth';

describe('AuthApiClient - Infrastructure Tests', () => {
  let client: AuthApiClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthApiClient, provideHttpClient(), provideHttpClientTesting()],
    });

    client = TestBed.inject(AuthApiClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Service Instantiation and Dependency Injection', () => {
    it('should be created successfully', () => {
      // Then
      expect(client).toBeTruthy();
      expect(client).toBeInstanceOf(AuthApiClient);
    });

    it('should inject HttpClient dependency correctly', () => {
      // Then
      expect((client as any).http).toBeTruthy();
    });

    it('should be provided as root service', () => {
      // Given
      const secondInstance = TestBed.inject(AuthApiClient);

      // Then
      expect(secondInstance).toBe(client); // Same instance (singleton)
    });

    it('should work with different TestBed configurations', () => {
      // Given
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          // AuthApiClient not explicitly provided, should use providedIn: 'root'
          provideHttpClient(),
          provideHttpClientTesting(),
        ],
      });

      // When
      const newClient = TestBed.inject(AuthApiClient);
      const newHttpMock = TestBed.inject(HttpTestingController);

      // Then
      expect(newClient).toBeTruthy();
      expect(newClient).toBeInstanceOf(AuthApiClient);

      // Test that it actually works
      newClient.me().subscribe();
      const req = newHttpMock.expectOne(API_ENDPOINTS_V1.AUTH.ME);
      expect(req).toBeTruthy();
      req.flush({});
      newHttpMock.verify();
    });

    it('should have proper constructor initialization', () => {
      // When - Test constructor and initialization
      expect(client).toBeInstanceOf(AuthApiClient);
      expect((client as any).http).toBeTruthy();

      // Test that constructor properly initializes private properties
      expect(typeof (client as any).http.request).toBe('function');
    });

    it('should maintain singleton pattern across different injection contexts', () => {
      // Given
      const context1 = TestBed.inject(AuthApiClient);
      const context2 = TestBed.inject(AuthApiClient);

      // When - Test object identity
      const areSameInstance = context1 === context2;
      const areSameType = context1.constructor === context2.constructor;

      // Then
      expect(areSameInstance).toBe(true);
      expect(areSameType).toBe(true);
      expect(Object.getPrototypeOf(context1)).toBe(Object.getPrototypeOf(context2));
    });

    it('should properly initialize with Angular DI metadata', () => {
      // Then - Test that Angular decorators and class are properly defined
      expect(client).toBeTruthy();
      expect(typeof AuthApiClient).toBe('function');
      expect(AuthApiClient.name).toMatch(/AuthApiClient/);
      expect(Object.getOwnPropertyDescriptor(AuthApiClient.prototype, 'constructor')).toBeDefined();
    });
  });

  describe('Complete Method Coverage', () => {
    it('should have all public methods defined', () => {
      // Verify all expected methods exist
      expect(typeof client.login).toBe('function');
      expect(typeof client.me).toBe('function');
      expect(typeof client.refresh).toBe('function');
      expect(typeof client.logout).toBe('function');
      expect(typeof client.register).toBe('function');
      expect(typeof client.confirmEmail).toBe('function');
      expect(typeof client.requestPasswordReset).toBe('function');
      expect(typeof client.confirmPasswordReset).toBe('function');
    });

    it('should exercise every method at least once', () => {
      // Call every method to ensure full coverage
      const loginRequest: LoginRequestDTO = { identifier: { username: 'test' }, password: 'test' };
      const refreshRequest: RefreshRequestDTO = { refresh_token: 'test' };
      const logoutRequest: LogoutRequestDTO = { refresh_token: 'test' };
      const registerRequest: RegisterRequestDTO = {
        username: 'test',
        email: 'test@test.com',
        password: 'test',
        password_confirm: 'test',
        first_name: 'Test',
        last_name: 'User',
        role_id: 1,
      };
      const resetRequest: ResetPasswordRequestDTO = { email: 'test@test.com' };
      const confirmResetRequest: ResetPasswordConfirmRequestDTO = {
        token: 'test',
        new_password: 'test',
        new_password_confirm: 'test',
      };

      // Execute all methods
      client.login(loginRequest).subscribe();
      client.me().subscribe();
      client.refresh(refreshRequest).subscribe();
      client.logout(logoutRequest).subscribe();
      client.register(registerRequest).subscribe();
      client.confirmEmail('test-token').subscribe();
      client.requestPasswordReset(resetRequest).subscribe();
      client.confirmPasswordReset(confirmResetRequest).subscribe();

      // Verify all requests were made
      const requests = httpMock.match(() => true);
      expect(requests.length).toBe(8);

      // Flush all requests
      requests.forEach((req) => req.flush({}));
    });
  });

  describe('HTTP Method Coverage and Request Validation', () => {
    it('should use correct HTTP methods for all endpoints', () => {
      // Test that we can verify HTTP methods are correctly used
      const loginRequest: LoginRequestDTO = {
        identifier: { username: 'test' },
        password: 'test',
      };

      // When - Test different HTTP methods
      client.login(loginRequest).subscribe();
      client.me().subscribe();
      client.refresh({ refresh_token: 'token' }).subscribe();

      // Then
      const loginReq = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.LOGIN);
      expect(loginReq.request.method).toBe('POST');
      loginReq.flush({});

      const meReq = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.ME);
      expect(meReq.request.method).toBe('GET');
      meReq.flush({});

      const refreshReq = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.REFRESH);
      expect(refreshReq.request.method).toBe('POST');
      refreshReq.flush({});
    });

    it('should construct correct API endpoint URLs', () => {
      // When
      client.login({ identifier: { username: 'test' }, password: 'test' }).subscribe();
      client
        .register({
          username: 'test',
          email: 'test@test.com',
          password: 'test',
          password_confirm: 'test',
          first_name: 'Test',
          last_name: 'User',
          role_id: 1,
        })
        .subscribe();
      client.confirmEmail('token').subscribe();

      // Then
      const loginReq = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.LOGIN);
      expect(loginReq.request.url).toBe(API_ENDPOINTS_V1.AUTH.LOGIN);
      loginReq.flush({});

      const registerReq = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.REGISTER);
      expect(registerReq.request.url).toBe(API_ENDPOINTS_V1.AUTH.REGISTER);
      registerReq.flush({});

      const confirmReq = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.CONFIRM_EMAIL);
      expect(confirmReq.request.url).toBe(API_ENDPOINTS_V1.AUTH.CONFIRM_EMAIL);
      confirmReq.flush({});
    });

    it('should send correct request bodies for POST methods', () => {
      // Given
      const loginData: LoginRequestDTO = {
        identifier: { username: 'testuser' },
        password: 'password123',
      };
      const resetData: ResetPasswordRequestDTO = {
        email: 'test@example.com',
      };

      // When
      client.login(loginData).subscribe();
      client.requestPasswordReset(resetData).subscribe();
      client.confirmEmail('test-token').subscribe();

      // Then
      const loginReq = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.LOGIN);
      expect(loginReq.request.body).toEqual(loginData);
      loginReq.flush({});

      const resetReq = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.RESET_PASSWORD);
      expect(resetReq.request.body).toEqual(resetData);
      resetReq.flush({});

      const confirmReq = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.CONFIRM_EMAIL);
      expect(confirmReq.request.body).toEqual({ token: 'test-token' });
      confirmReq.flush({});
    });

    it('should handle GET requests without body', () => {
      // When
      client.me().subscribe();

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.ME);
      expect(req.request.method).toBe('GET');
      expect(req.request.body).toBeNull();
      req.flush({});
    });
  });

  describe('login', () => {
    it('should make POST request to login endpoint', () => {
      // Given
      const loginRequest: LoginRequestDTO = {
        identifier: { username: 'testuser' },
        password: 'password123',
      };
      const expectedResponse: LoginResponseDTO = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          full_name: 'Test User',
          status: 'active',
          is_email_confirmed: true,
          profile_completed: true,
          email_notifications_enabled: true,
          system_notifications_enabled: true,
          task_notifications_enabled: true,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          role_id: 1,
          role_name: 'user',
          last_activity_at: '2024-01-01T00:00:00Z',
        },
      };

      // When
      client.login(loginRequest).subscribe((response) => {
        expect(response).toEqual(expectedResponse);
      });

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.LOGIN);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(loginRequest);
      req.flush(expectedResponse);
    });

    it('should handle login HTTP errors', () => {
      // Given
      const loginRequest: LoginRequestDTO = {
        identifier: { username: 'wronguser' },
        password: 'wrongpassword',
      };

      // When
      client.login(loginRequest).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(401);
        },
      });

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.LOGIN);
      req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle various HTTP error statuses for login', () => {
      const testCases = [
        { status: 400, statusText: 'Bad Request', expectedError: 'Invalid credentials format' },
        { status: 403, statusText: 'Forbidden', expectedError: 'Account suspended' },
        { status: 404, statusText: 'Not Found', expectedError: 'User not found' },
        { status: 429, statusText: 'Too Many Requests', expectedError: 'Rate limited' },
        { status: 500, statusText: 'Internal Server Error', expectedError: 'Server error' },
      ];

      testCases.forEach((testCase) => {
        // Given
        const loginRequest: LoginRequestDTO = {
          identifier: { username: 'testuser' },
          password: 'password',
        };

        // When
        client.login(loginRequest).subscribe({
          next: () => fail(`Should have failed with ${testCase.status}`),
          error: (error) => {
            expect(error.status).toBe(testCase.status);
            expect(error.statusText).toBe(testCase.statusText);
          },
        });

        // Then
        const req = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.LOGIN);
        req.flush(
          { message: testCase.expectedError },
          {
            status: testCase.status,
            statusText: testCase.statusText,
          }
        );
      });
    });
  });

  describe('me', () => {
    it('should make GET request to me endpoint', () => {
      // Given
      const expectedResponse: MeResponseDTO = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: {
          id: 1,
          name: 'user',
          access_level: 1,
          is_active: true,
        },
        notification_preferences: {
          email_notifications: true,
          system_notifications: true,
          task_notifications: false,
        },
      };

      // When
      client.me().subscribe((response) => {
        expect(response).toEqual(expectedResponse);
      });

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.ME);
      expect(req.request.method).toBe('GET');
      req.flush(expectedResponse);
    });

    it('should handle me HTTP errors', () => {
      // When
      client.me().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(401);
        },
      });

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.ME);
      req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle network and server errors for me endpoint', () => {
      const errorScenarios = [
        { status: 0, statusText: '', description: 'Network error' },
        { status: 502, statusText: 'Bad Gateway', description: 'Proxy error' },
        { status: 503, statusText: 'Service Unavailable', description: 'Server maintenance' },
        { status: 504, statusText: 'Gateway Timeout', description: 'Request timeout' },
      ];

      errorScenarios.forEach((scenario) => {
        // When
        client.me().subscribe({
          next: () => fail(`Should have failed with ${scenario.description}`),
          error: (error) => {
            expect(error.status).toBe(scenario.status);
          },
        });

        // Then
        const req = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.ME);
        req.flush('', { status: scenario.status, statusText: scenario.statusText });
      });
    });
  });

  describe('refresh', () => {
    it('should make POST request to refresh endpoint', () => {
      // Given
      const refreshRequest: RefreshRequestDTO = {
        refresh_token: 'refresh-token',
      };
      const expectedResponse: RefreshResponseDTO = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
      };

      // When
      client.refresh(refreshRequest).subscribe((response) => {
        expect(response).toEqual(expectedResponse);
      });

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.REFRESH);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(refreshRequest);
      req.flush(expectedResponse);
    });

    it('should handle refresh HTTP errors', () => {
      // Given
      const refreshRequest: RefreshRequestDTO = {
        refresh_token: 'invalid-token',
      };

      // When
      client.refresh(refreshRequest).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(401);
        },
      });

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.REFRESH);
      req.flush({ message: 'Invalid refresh token' }, { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle expired refresh token', () => {
      // Given
      const expiredRefreshRequest: RefreshRequestDTO = {
        refresh_token: 'expired.refresh.token',
      };

      // When
      client.refresh(expiredRefreshRequest).subscribe({
        next: () => fail('Should have failed with expired refresh token'),
        error: (error) => {
          expect(error.status).toBe(401);
          expect(error.error.code).toBe('REFRESH_TOKEN_EXPIRED');
        },
      });

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.REFRESH);
      req.flush(
        {
          message: 'Refresh token has expired',
          code: 'REFRESH_TOKEN_EXPIRED',
          timestamp: new Date().toISOString(),
        },
        { status: 401, statusText: 'Unauthorized' }
      );
    });
  });

  describe('logout', () => {
    it('should make POST request to logout endpoint', () => {
      // Given
      const logoutRequest: LogoutRequestDTO = {
        refresh_token: 'refresh-token',
      };
      const expectedResponse: LogoutResponseDTO = {
        message: 'Logged out successfully',
      };

      // When
      client.logout(logoutRequest).subscribe((response) => {
        expect(response).toEqual(expectedResponse);
      });

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.LOGOUT);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(logoutRequest);
      req.flush(expectedResponse);
    });

    it('should handle logout errors gracefully', () => {
      // Given
      const logoutRequest: LogoutRequestDTO = {
        refresh_token: 'invalid-refresh-token',
      };

      // When
      client.logout(logoutRequest).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect([400, 401, 404]).toContain(error.status);
        },
      });

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.LOGOUT);
      req.flush({ message: 'Invalid refresh token' }, { status: 400, statusText: 'Bad Request' });
    });

    it('should complete logout even with server errors', () => {
      // Given
      const logoutRequest: LogoutRequestDTO = {
        refresh_token: 'valid-token',
      };

      // When
      client.logout(logoutRequest).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          // Logout should still be considered successful client-side
        },
      });

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.LOGOUT);
      req.flush(
        { message: 'Internal server error' },
        { status: 500, statusText: 'Internal Server Error' }
      );
    });
  });

  describe('register', () => {
    it('should make POST request to register endpoint', () => {
      // Given
      const registerRequest: RegisterRequestDTO = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        password_confirm: 'password123',
        first_name: 'New',
        last_name: 'User',
        role_id: 1,
      };
      const expectedResponse: RegisterResponseDTO = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
        user: {
          id: 2,
          username: 'newuser',
          email: 'newuser@example.com',
          first_name: 'New',
          last_name: 'User',
          full_name: 'New User',
          status: 'active',
          is_email_confirmed: false,
          profile_completed: false,
          email_notifications_enabled: true,
          system_notifications_enabled: true,
          task_notifications_enabled: true,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          role_id: 1,
          role_name: 'user',
          last_activity_at: '2024-01-01T00:00:00Z',
        },
      };

      // When
      client.register(registerRequest).subscribe((response) => {
        expect(response).toEqual(expectedResponse);
      });

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.REGISTER);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(registerRequest);
      req.flush(expectedResponse);
    });

    it('should handle register HTTP errors', () => {
      // Given
      const registerRequest: RegisterRequestDTO = {
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password123',
        password_confirm: 'password123',
        first_name: 'Existing',
        last_name: 'User',
        role_id: 1,
      };

      // When
      client.register(registerRequest).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(409);
        },
      });

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.REGISTER);
      req.flush({ message: 'User already exists' }, { status: 409, statusText: 'Conflict' });
    });

    it('should handle validation errors for register', () => {
      // Given
      const invalidRequest: RegisterRequestDTO = {
        username: '',
        email: 'invalid-email',
        password: '123',
        password_confirm: '456',
        first_name: '',
        last_name: '',
        role_id: 999,
      };

      // When
      client.register(invalidRequest).subscribe({
        next: () => fail('Should have failed with validation errors'),
        error: (error) => {
          expect(error.status).toBe(422);
          expect(error.error.errors).toBeDefined();
        },
      });

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.REGISTER);
      req.flush(
        {
          message: 'Validation failed',
          errors: {
            username: ['Username is required'],
            email: ['Invalid email format'],
            password: ['Password too short', 'Passwords do not match'],
            role_id: ['Invalid role'],
          },
        },
        { status: 422, statusText: 'Unprocessable Entity' }
      );
    });
  });

  describe('confirmEmail', () => {
    it('should make POST request to confirm email endpoint', () => {
      // Given
      const token = 'confirmation-token';
      const expectedResponse: ConfirmEmailResponseDTO = {
        message: 'Email confirmed successfully',
      };

      // When
      client.confirmEmail(token).subscribe((response) => {
        expect(response).toEqual(expectedResponse);
      });

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.CONFIRM_EMAIL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ token });
      req.flush(expectedResponse);
    });

    it('should handle confirm email HTTP errors', () => {
      // Given
      const token = 'invalid-token';

      // When
      client.confirmEmail(token).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
        },
      });

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.CONFIRM_EMAIL);
      req.flush({ message: 'Invalid token' }, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle expired token for email confirmation', () => {
      // Given
      const expiredToken = 'expired-token-12345';

      // When
      client.confirmEmail(expiredToken).subscribe({
        next: () => fail('Should have failed with expired token'),
        error: (error) => {
          expect(error.status).toBe(410);
          expect(error.error.message).toContain('expired');
        },
      });

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.CONFIRM_EMAIL);
      expect(req.request.body).toEqual({ token: expiredToken });
      req.flush(
        {
          message: 'Token has expired',
          code: 'TOKEN_EXPIRED',
        },
        { status: 410, statusText: 'Gone' }
      );
    });
  });

  describe('requestPasswordReset', () => {
    it('should make POST request to reset password endpoint', () => {
      // Given
      const resetRequest: ResetPasswordRequestDTO = {
        email: 'test@example.com',
      };
      const expectedResponse: ResetPasswordResponseDTO = {
        message: 'Password reset email sent',
      };

      // When
      client.requestPasswordReset(resetRequest).subscribe((response) => {
        expect(response).toEqual(expectedResponse);
      });

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.RESET_PASSWORD);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(resetRequest);
      req.flush(expectedResponse);
    });

    it('should handle password reset errors', () => {
      // Given
      const resetRequest: ResetPasswordRequestDTO = {
        email: 'nonexistent@example.com',
      };

      // When
      client.requestPasswordReset(resetRequest).subscribe({
        next: () => fail('Should have failed for non-existent email'),
        error: (error) => {
          expect(error.status).toBe(404);
          expect(error.error.message).toContain('not found');
        },
      });

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.RESET_PASSWORD);
      req.flush(
        {
          message: 'Email address not found',
          code: 'EMAIL_NOT_FOUND',
        },
        { status: 404, statusText: 'Not Found' }
      );
    });

    it('should handle rate limiting for password reset', () => {
      // Given
      const resetRequest: ResetPasswordRequestDTO = {
        email: 'ratelimited@example.com',
      };

      // When
      client.requestPasswordReset(resetRequest).subscribe({
        next: () => fail('Should have been rate limited'),
        error: (error) => {
          expect(error.status).toBe(429);
          expect(error.error.retry_after).toBeDefined();
        },
      });

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.RESET_PASSWORD);
      req.flush(
        {
          message: 'Too many reset requests',
          retry_after: 300, // 5 minutes
        },
        { status: 429, statusText: 'Too Many Requests' }
      );
    });
  });

  describe('confirmPasswordReset', () => {
    it('should make POST request to confirm password reset endpoint', () => {
      // Given
      const confirmRequest: ResetPasswordConfirmRequestDTO = {
        token: 'reset-token',
        new_password: 'newpassword123',
        new_password_confirm: 'newpassword123',
      };
      const expectedResponse: ResetPasswordConfirmResponseDTO = {
        message: 'Password reset successfully',
      };

      // When
      client.confirmPasswordReset(confirmRequest).subscribe((response) => {
        expect(response).toEqual(expectedResponse);
      });

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.RESET_PASSWORD_CONFIRM);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(confirmRequest);
      req.flush(expectedResponse);
    });

    it('should handle confirm password reset HTTP errors', () => {
      // Given
      const confirmRequest: ResetPasswordConfirmRequestDTO = {
        token: 'invalid-token',
        new_password: 'newpassword123',
        new_password_confirm: 'newpassword123',
      };

      // When
      client.confirmPasswordReset(confirmRequest).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
        },
      });

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.RESET_PASSWORD_CONFIRM);
      req.flush(
        { message: 'Invalid or expired token' },
        { status: 400, statusText: 'Bad Request' }
      );
    });

    it('should handle password validation errors in reset confirmation', () => {
      // Given
      const weakPasswordRequest: ResetPasswordConfirmRequestDTO = {
        token: 'valid-reset-token',
        new_password: '123',
        new_password_confirm: '456',
      };

      // When
      client.confirmPasswordReset(weakPasswordRequest).subscribe({
        next: () => fail('Should have failed with weak password'),
        error: (error) => {
          expect(error.status).toBe(422);
          expect(error.error.errors.new_password).toBeDefined();
        },
      });

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.RESET_PASSWORD_CONFIRM);
      req.flush(
        {
          message: 'Password validation failed',
          errors: {
            new_password: [
              'Password must be at least 8 characters',
              'Password must contain uppercase letter',
              'Passwords do not match',
            ],
          },
        },
        { status: 422, statusText: 'Unprocessable Entity' }
      );
    });

    it('should handle expired reset tokens', () => {
      // Given
      const expiredTokenRequest: ResetPasswordConfirmRequestDTO = {
        token: 'expired-reset-token',
        new_password: 'ValidPassword123!',
        new_password_confirm: 'ValidPassword123!',
      };

      // When
      client.confirmPasswordReset(expiredTokenRequest).subscribe({
        next: () => fail('Should have failed with expired token'),
        error: (error) => {
          expect(error.status).toBe(410);
          expect(error.error.code).toBe('TOKEN_EXPIRED');
        },
      });

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.RESET_PASSWORD_CONFIRM);
      req.flush(
        {
          message: 'Reset token has expired',
          code: 'TOKEN_EXPIRED',
          expires_at: '2024-01-01T00:00:00Z',
        },
        { status: 410, statusText: 'Gone' }
      );
    });
  });

  describe('Observable Stream Behavior', () => {
    it('should complete Observable streams on successful responses', (done) => {
      // Given
      const loginRequest: LoginRequestDTO = {
        identifier: { username: 'testuser' },
        password: 'password123',
      };
      const expectedResponse: LoginResponseDTO = {
        access_token: 'token',
        refresh_token: 'refresh',
        token_type: 'Bearer',
        expires_in: 3600,
        user: {
          id: 1,
          username: 'test',
          email: 'test@test.com',
          first_name: 'Test',
          last_name: 'User',
          full_name: 'Test User',
          status: 'active',
          is_email_confirmed: true,
          profile_completed: true,
          email_notifications_enabled: true,
          system_notifications_enabled: true,
          task_notifications_enabled: true,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          role_id: 1,
          role_name: 'user',
          last_activity_at: '2024-01-01T00:00:00Z',
        },
      };

      // When
      client.login(loginRequest).subscribe({
        next: (response) => {
          expect(response).toEqual(expectedResponse);
        },
        error: () => fail('Should not have errored'),
        complete: () => {
          done(); // Observable completed successfully
        },
      });

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.LOGIN);
      req.flush(expectedResponse);
    });

    it('should handle multiple concurrent requests', () => {
      // Given
      const loginRequest: LoginRequestDTO = {
        identifier: { username: 'user1' },
        password: 'pass1',
      };
      const refreshRequest: RefreshRequestDTO = {
        refresh_token: 'refresh1',
      };

      let loginCompleted = false;
      let refreshCompleted = false;
      let meCompleted = false;

      // When - Make concurrent requests
      client.login(loginRequest).subscribe(() => {
        loginCompleted = true;
      });
      client.me().subscribe(() => {
        meCompleted = true;
      });
      client.refresh(refreshRequest).subscribe(() => {
        refreshCompleted = true;
      });

      // Then - Verify all requests are made
      const loginReq = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.LOGIN);
      const meReq = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.ME);
      const refreshReq = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.REFRESH);

      // Complete requests in different order
      refreshReq.flush({
        access_token: 'new-token',
        refresh_token: 'new-refresh',
        token_type: 'Bearer',
        expires_in: 3600,
      });
      loginReq.flush({
        access_token: 'login-token',
        refresh_token: 'login-refresh',
        token_type: 'Bearer',
        expires_in: 3600,
        user: {} as any,
      });
      meReq.flush({
        id: 1,
        username: 'user1',
        email: 'user1@test.com',
        first_name: 'User',
        last_name: 'One',
        role: { id: 1, name: 'user', access_level: 1, is_active: true },
        notification_preferences: {
          email_notifications: true,
          system_notifications: true,
          task_notifications: false,
        },
      });

      expect(loginCompleted).toBe(true);
      expect(refreshCompleted).toBe(true);
      expect(meCompleted).toBe(true);
    });

    it('should propagate errors correctly through Observable chain', () => {
      // Given
      let errorReceived = false;
      let completeCalled = false;

      // When
      client.me().subscribe({
        next: () => fail('Should not succeed'),
        error: (error) => {
          errorReceived = true;
          expect(error.status).toBe(401);
        },
        complete: () => {
          completeCalled = true;
        },
      });

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.ME);
      req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

      expect(errorReceived).toBe(true);
      expect(completeCalled).toBe(false); // Complete should not be called on error
    });

    it('should handle subscription and unsubscription correctly', () => {
      // Given
      let responseReceived = false;

      // When
      const subscription = client.me().subscribe({
        next: () => {
          responseReceived = true;
        },
      });

      // Then - Get request first
      httpMock.expectOne(API_ENDPOINTS_V1.AUTH.ME);

      // Unsubscribe before response
      subscription.unsubscribe();

      // Don't flush after unsubscribe to avoid error
      // Don't flush the cancelled request

      expect(responseReceived).toBe(false); // Should not receive response after unsubscribe
      expect(subscription.closed).toBe(true);
    });
  });

  describe('Enhanced Network and Server Error Handling', () => {
    it('should handle network connectivity errors', () => {
      // Given - Network connectivity lost scenario
      client.login({ identifier: { username: 'test' }, password: 'test' }).subscribe({
        next: () => fail('Should have failed with network error'),
        error: (error) => {
          expect(error.status).toBe(0);
          // Status text may vary by browser/environment, just check it exists
          expect(error.statusText).toBeDefined();
        },
      });

      const req = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.LOGIN);
      req.flush('', { status: 0, statusText: '' });
    });

    it('should handle server timeout errors', () => {
      // Given - Server timeout scenarios
      const timeoutScenarios = [
        { status: 408, statusText: 'Request Timeout' },
        { status: 502, statusText: 'Bad Gateway' },
        { status: 503, statusText: 'Service Unavailable' },
        { status: 504, statusText: 'Gateway Timeout' },
      ];

      timeoutScenarios.forEach((scenario) => {
        client.me().subscribe({
          next: () => fail(`Should have failed with ${scenario.statusText}`),
          error: (error) => {
            expect(error.status).toBe(scenario.status);
            expect(error.statusText).toBe(scenario.statusText);
          },
        });

        const req = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.ME);
        req.flush('', { status: scenario.status, statusText: scenario.statusText });
      });
    });

    it('should handle memory pressure and resource exhaustion errors', () => {
      // Given - Simulate resource exhaustion scenarios
      const resourceErrors = [
        { status: 507, statusText: 'Insufficient Storage', body: { error: 'Server storage full' } },
        {
          status: 413,
          statusText: 'Payload Too Large',
          body: { error: 'Request entity too large' },
        },
        { status: 414, statusText: 'URI Too Long', body: { error: 'Request-URI too large' } },
        {
          status: 431,
          statusText: 'Request Header Fields Too Large',
          body: { error: 'Headers too large' },
        },
      ];

      resourceErrors.forEach((errorCase) => {
        client
          .register({
            username: 'test',
            email: 'test@test.com',
            password: 'test',
            password_confirm: 'test',
            first_name: 'Test',
            last_name: 'User',
            role_id: 1,
          })
          .subscribe({
            next: () => fail(`Should have failed with ${errorCase.statusText}`),
            error: (error) => {
              expect(error.status).toBe(errorCase.status);
              expect(error.error).toEqual(errorCase.body);
            },
          });

        const req = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.REGISTER);
        req.flush(errorCase.body, { status: errorCase.status, statusText: errorCase.statusText });
      });
    });

    it('should handle CORS and security-related errors', () => {
      // Given - CORS and security error scenarios
      const securityErrors = [
        { status: 0, statusText: '', description: 'CORS preflight failed' },
        { status: 403, statusText: 'Forbidden', body: { error: 'CORS origin not allowed' } },
        {
          status: 418,
          statusText: "I'm a teapot",
          body: { error: 'Server refuses to brew coffee' },
        },
        {
          status: 451,
          statusText: 'Unavailable For Legal Reasons',
          body: { error: 'Blocked by government' },
        },
      ];

      securityErrors.forEach((errorCase) => {
        client.me().subscribe({
          next: () => fail(`Should have failed with ${errorCase.description}`),
          error: (error) => {
            expect(error.status).toBe(errorCase.status);
            if (errorCase.body) {
              expect(error.error).toEqual(errorCase.body);
            }
          },
        });

        const req = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.ME);
        req.flush(errorCase.body || '', {
          status: errorCase.status,
          statusText: errorCase.statusText,
        });
      });
    });

    it('should handle malformed server responses and parsing errors', () => {
      // Given - Various malformed response scenarios
      const malformedScenarios = [
        { response: 'not json at all', contentType: 'application/json' },
        { response: '{"incomplete": json', contentType: 'application/json' },
        { response: 'null', contentType: 'application/json' },
        { response: '[]', contentType: 'application/json' }, // Array instead of object
        { response: '{"circular":"reference"}', contentType: 'application/json' },
      ];

      malformedScenarios.forEach((scenario) => {
        client.refresh({ refresh_token: 'test' }).subscribe({
          next: (response) => {
            // In test environment, HttpClient doesn't actually parse JSON
            expect(response).toBe(scenario.response as any);
          },
          error: () => fail('Should not have errored in test environment'),
        });

        const req = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.REFRESH);
        req.flush(scenario.response, { headers: { 'Content-Type': scenario.contentType } });
      });
    });
  });

  describe('Observable Memory Management and Lifecycle', () => {
    it('should properly handle single subscription lifecycle', () => {
      // Given
      let responseReceived = false;
      let errorReceived = false;
      let completeCalled = false;

      // When - Create subscription
      const subscription = client.me().subscribe({
        next: () => {
          responseReceived = true;
        },
        error: () => {
          errorReceived = true;
        },
        complete: () => {
          completeCalled = true;
        },
      });

      // Then - Subscription should be active
      expect(subscription.closed).toBe(false);

      // When - Fulfill request
      const req = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.ME);
      req.flush({
        id: 1,
        username: 'test',
        email: 'test@test.com',
        first_name: 'Test',
        last_name: 'User',
        role: { id: 1, name: 'user', access_level: 1, is_active: true },
        notification_preferences: {
          email_notifications: true,
          system_notifications: true,
          task_notifications: false,
        },
      });

      // Then - Verify response handling
      expect(responseReceived).toBe(true);
      expect(errorReceived).toBe(false);
      expect(completeCalled).toBe(true);
      expect(subscription.closed).toBe(true); // Auto-closed after completion
    });

    it('should handle subscription unsubscription before response', () => {
      // Given
      let responseReceived = false;

      // When - Create subscription and immediately unsubscribe
      const subscription = client
        .login({
          identifier: { username: 'test' },
          password: 'test',
        })
        .subscribe({
          next: () => {
            responseReceived = true;
          },
        });

      // Get request but don't flush yet
      const req = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.LOGIN);

      // Then - Subscription should be active initially
      expect(subscription.closed).toBe(false);

      // When - Unsubscribe before response
      subscription.unsubscribe();
      expect(subscription.closed).toBe(true);

      // Then - No response should be processed (can't flush cancelled request)
      expect(responseReceived).toBe(false);
    });

    it('should handle Observable stream error scenarios', () => {
      // Given
      let errorReceived = false;
      let completeCalled = false;

      // When - Create subscription that will error
      client.refresh({ refresh_token: 'invalid' }).subscribe({
        next: () => fail('Should not succeed'),
        error: () => {
          errorReceived = true;
        },
        complete: () => {
          completeCalled = true;
        },
      });

      // Then - Trigger error
      const req = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.REFRESH);
      req.flush('', { status: 401, statusText: 'Unauthorized' });

      // Verify error handling
      expect(errorReceived).toBe(true);
      expect(completeCalled).toBe(false); // Complete not called on error
    });
  });

  describe('Integration and Edge Cases', () => {
    it('should handle empty responses gracefully', () => {
      // When
      client.logout({ refresh_token: 'token' }).subscribe((response) => {
        expect(response).toEqual({} as LogoutResponseDTO);
      });

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.LOGOUT);
      req.flush({}); // Empty response
    });

    it('should handle large payloads', () => {
      // Given
      const largeRegisterRequest: RegisterRequestDTO = {
        username: 'a'.repeat(100),
        email: 'test@' + 'a'.repeat(200) + '.com',
        password: 'a'.repeat(50),
        password_confirm: 'a'.repeat(50),
        first_name: 'FirstName'.repeat(10),
        last_name: 'LastName'.repeat(10),
        role_id: 1,
      };

      // When
      client.register(largeRegisterRequest).subscribe();

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.REGISTER);
      expect(req.request.body).toEqual(largeRegisterRequest);
      expect(req.request.body.username.length).toBe(100);
      req.flush({});
    });

    it('should handle special characters in request data', () => {
      // Given
      const specialCharRequest: LoginRequestDTO = {
        identifier: { username: 'test@user+special.chars_123' },
        password: 'páss🔐wörd!@#$%^&*()',
      };

      // When
      client.login(specialCharRequest).subscribe();

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.LOGIN);
      expect(req.request.body).toEqual(specialCharRequest);
      expect(req.request.body.password).toContain('🔐');
      req.flush({});
    });

    it('should handle null and undefined values appropriately', () => {
      // Given
      const resetRequest: ResetPasswordRequestDTO = {
        email: 'test@example.com',
      };

      // When
      client.requestPasswordReset(resetRequest).subscribe();

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.RESET_PASSWORD);
      expect(req.request.body).toEqual(resetRequest);
      expect(req.request.body.email).toBeTruthy();
      req.flush({ message: 'Reset email sent' });
    });

    it('should handle malformed JSON responses gracefully', () => {
      // When
      client.me().subscribe({
        next: (response) => {
          // HttpClient testing doesn't actually parse JSON, it just returns what we flush
          expect(response).toBe('invalid-json{' as any);
        },
        error: () => fail('Should not have errored in test environment'),
      });

      // Then
      const req = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.ME);
      req.flush('invalid-json{', { headers: { 'Content-Type': 'application/json' } });
    });

    it('should maintain type safety for all method responses', () => {
      // When - Test that TypeScript types are maintained
      client
        .login({ identifier: { username: 'test' }, password: 'test' })
        .subscribe((response: LoginResponseDTO) => {
          expect(response.access_token).toBeDefined();
          expect(response.user).toBeDefined();
          expect(response.user.id).toBeGreaterThan(0);
        });

      client.me().subscribe((response: MeResponseDTO) => {
        expect(response.username).toBeDefined();
        expect(response.role).toBeDefined();
        expect(response.notification_preferences).toBeDefined();
      });

      // Then
      const loginReq = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.LOGIN);
      loginReq.flush({
        access_token: 'token',
        refresh_token: 'refresh',
        token_type: 'Bearer',
        expires_in: 3600,
        user: {
          id: 1,
          username: 'test',
          email: 'test@test.com',
          first_name: 'Test',
          last_name: 'User',
          full_name: 'Test User',
          status: 'active',
          is_email_confirmed: true,
          profile_completed: true,
          email_notifications_enabled: true,
          system_notifications_enabled: true,
          task_notifications_enabled: true,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          role_id: 1,
          role_name: 'user',
          last_activity_at: '2024-01-01T00:00:00Z',
        },
      });

      const meReq = httpMock.expectOne(API_ENDPOINTS_V1.AUTH.ME);
      meReq.flush({
        id: 1,
        username: 'test',
        email: 'test@test.com',
        first_name: 'Test',
        last_name: 'User',
        role: { id: 1, name: 'user', access_level: 1, is_active: true },
        notification_preferences: {
          email_notifications: true,
          system_notifications: true,
          task_notifications: false,
        },
      });
    });

    it('should handle concurrent authentication flows', () => {
      // Given - Multiple concurrent auth operations
      const responses: any[] = [];
      const errors: any[] = [];

      // When - Execute all operations concurrently
      client.login({ identifier: { username: 'user1' }, password: 'pass1' }).subscribe({
        next: (response: any) => responses.push({ index: 0, response }),
        error: (error: any) => errors.push({ index: 0, error }),
      });

      client.me().subscribe({
        next: (response: any) => responses.push({ index: 1, response }),
        error: (error: any) => errors.push({ index: 1, error }),
      });

      client.refresh({ refresh_token: 'token1' }).subscribe({
        next: (response: any) => responses.push({ index: 2, response }),
        error: (error: any) => errors.push({ index: 2, error }),
      });

      client.logout({ refresh_token: 'token2' }).subscribe({
        next: (response: any) => responses.push({ index: 3, response }),
        error: (error: any) => errors.push({ index: 3, error }),
      });

      client
        .register({
          username: 'newuser',
          email: 'new@test.com',
          password: 'pass',
          password_confirm: 'pass',
          first_name: 'New',
          last_name: 'User',
          role_id: 1,
        })
        .subscribe({
          next: (response: any) => responses.push({ index: 4, response }),
          error: (error: any) => errors.push({ index: 4, error }),
        });

      // Then - All requests should be made
      const allRequests = httpMock.match(() => true);
      expect(allRequests.length).toBe(5);

      // Flush all responses
      allRequests.forEach((req) => req.flush({}));

      // Verify all responses received
      expect(responses.length).toBe(5);
      expect(errors.length).toBe(0);
    });
  });
});
