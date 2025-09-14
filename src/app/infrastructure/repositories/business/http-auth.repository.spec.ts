import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { HttpAuthRepository } from './http-auth.repository';
import { User } from '@domain/entities/user.entity';
import { Session } from '@domain/entities/session.entity';
import { Email, AccessToken, RefreshToken } from '@domain/value-objects';
import { Role } from '@domain/entities/role.entity';
import { InfrastructureError } from '@infrastructure/errors/infrastructure-error';
import {
  LoginResponseDTO,
  RefreshRequestDTO,
  RefreshResponseDTO,
  RegisterRequestDTO,
  ResetPasswordRequestDTO,
} from '@infrastructure/dtos/auth';
import { MeResponseDTO } from '@infrastructure/dtos/auth/Me.dto';
import {
  CredentialsContract,
  ResetPasswordContract,
} from '@domain/repositories/business/auth.contract';
import { AuthApiClient } from '@infrastructure/http/clients/auth-api.client';
import { AuthMapper } from '@infrastructure/mappers/auth.mapper';
import { HttpErrorTransformer } from '@infrastructure/errors/http-error-transformer';
import { ClockPort } from '@domain/repositories/system/clock.repository';
import { CLOCK_PORT } from '@di/tokens';

describe('HttpAuthRepository - Infrastructure Tests', () => {
  let repository: HttpAuthRepository;
  let mockAuthApiClient: jasmine.SpyObj<AuthApiClient>;
  let mockAuthMapper: jasmine.SpyObj<AuthMapper>;
  let mockErrorTransformer: jasmine.SpyObj<HttpErrorTransformer>;
  let mockClock: jasmine.SpyObj<ClockPort>;
  let mockUser: User;
  let mockSession: Session;
  let mockRole: Role;
  let mockLoginResponse: LoginResponseDTO;
  let mockMeResponse: MeResponseDTO;
  let mockRefreshResponse: RefreshResponseDTO;

  beforeEach(() => {
    // Create spy objects for all dependencies
    mockAuthApiClient = jasmine.createSpyObj('AuthApiClient', [
      'login',
      'me',
      'refresh',
      'logout',
      'register',
      'confirmEmail',
      'requestPasswordReset',
      'confirmPasswordReset',
    ]);

    mockAuthMapper = jasmine.createSpyObj('AuthMapper', [
      'loginUserToEntity',
      'registerUserToEntity',
      'meToEntity',
      'toSession',
      'tokensFromLogin',
      'tokensFromRefresh',
      'tokensFromRegister',
    ]);

    mockErrorTransformer = jasmine.createSpyObj('HttpErrorTransformer', ['transformWithDefaults']);

    mockClock = jasmine.createSpyObj('ClockPort', ['nowEpochSeconds']);

    // Configure TestBed with all dependencies
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        HttpAuthRepository,
        { provide: AuthApiClient, useValue: mockAuthApiClient },
        { provide: AuthMapper, useValue: mockAuthMapper },
        { provide: HttpErrorTransformer, useValue: mockErrorTransformer },
        { provide: CLOCK_PORT, useValue: mockClock },
      ],
    });

    // Get repository instance from TestBed
    repository = TestBed.inject(HttpAuthRepository);

    // Create mock entities
    mockRole = Role.create({
      id: 1,
      name: 'USER',
    });
    mockUser = User.create({
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: mockRole,
      isActive: true,
      createdAt: '2023-01-01T00:00:00Z',
      notificationPreferences: {
        email: true,
        system: false,
        task: true,
      },
    });
    mockSession = Session.create({
      id: 'mock-session-id',
      user: mockUser,
      accessToken: AccessToken.create('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-access-token'),
      refreshToken: RefreshToken.create('abcdef1234567890abcdef1234567890abcdef12'), // 32+ chars
    });

    // Create mock DTOs
    mockLoginResponse = {
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-access-token',
      refresh_token: 'abcdef1234567890abcdef1234567890abcdef12',
      expires_in: 3600,
      token_type: 'Bearer',
      user: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role_id: 1,
        role_name: 'USER',
        full_name: 'Test User',
        status: 'active',
        is_email_confirmed: true,
        profile_completed: true,
        email_notifications_enabled: true,
        system_notifications_enabled: false,
        task_notifications_enabled: true,
        is_active: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        last_activity_at: '2023-01-01T00:00:00Z',
      },
    };

    mockMeResponse = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      role: {
        id: 1,
        name: 'USER',
        access_level: 1,
        is_active: true,
      },
      notification_preferences: {
        email_notifications: true,
        system_notifications: false,
        task_notifications: true,
      },
    };

    mockRefreshResponse = {
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new-access-token',
      refresh_token: 'fedcba0987654321fedcba0987654321fedcba09',
      expires_in: 3600,
      token_type: 'Bearer',
    };
  });

  describe('login', () => {
    it('should successfully login and return session', async () => {
      // Given
      const credentials: CredentialsContract = {
        identifier: { type: 'username', value: 'testuser' },
        password: 'password123',
      };

      mockAuthApiClient.login.and.returnValue(of(mockLoginResponse));
      mockClock.nowEpochSeconds.and.returnValue(1234567890);
      mockAuthMapper.loginUserToEntity.and.returnValue(Promise.resolve(mockUser));
      mockAuthMapper.tokensFromLogin.and.returnValue({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        accessExp: 1234567890 + 3600,
      });
      mockAuthMapper.toSession.and.returnValue(mockSession);

      // When
      const result = await repository.login(credentials);

      // Then
      expect(mockAuthApiClient.login).toHaveBeenCalledWith(
        jasmine.objectContaining({
          identifier: 'testuser',
          password: 'password123',
        })
      );
      expect(result).toBeInstanceOf(Session);
    });

    it('should handle login errors', async () => {
      // Given
      const credentials: CredentialsContract = {
        identifier: { type: 'username', value: 'testuser' },
        password: 'wrongpassword',
      };
      const expectedError = InfrastructureError.unauthorized('/api/auth/login');

      mockAuthApiClient.login.and.returnValue(throwError(() => expectedError));
      mockErrorTransformer.transformWithDefaults.and.returnValue(expectedError);

      // When & Then
      await expectAsync(repository.login(credentials)).toBeRejectedWith(expectedError);
    });
  });

  describe('me', () => {
    it('should successfully get current user', async () => {
      // Given
      mockAuthApiClient.me.and.returnValue(of(mockMeResponse));
      mockAuthMapper.meToEntity.and.returnValue(mockUser);

      // When
      const result = await repository.me();

      // Then
      expect(mockAuthApiClient.me).toHaveBeenCalled();
      expect(mockAuthMapper.meToEntity).toHaveBeenCalledWith(mockMeResponse);
      expect(result).toBeInstanceOf(User);
    });

    it('should handle me errors', async () => {
      // Given
      const expectedError = InfrastructureError.unauthorized('/api/auth/me');
      mockAuthApiClient.me.and.returnValue(throwError(() => expectedError));
      mockErrorTransformer.transformWithDefaults.and.returnValue(expectedError);

      // When & Then
      await expectAsync(repository.me()).toBeRejectedWith(expectedError);
    });
  });

  describe('refresh', () => {
    it('should successfully refresh tokens', async () => {
      // Given
      const refreshToken = RefreshToken.create('abcdef1234567890abcdef1234567890refresh');
      const refreshRequest: RefreshRequestDTO = {
        refresh_token: refreshToken.getValue(),
      };

      mockAuthApiClient.refresh.and.returnValue(of(mockRefreshResponse));
      mockClock.nowEpochSeconds.and.returnValue(1234567890);
      mockAuthMapper.tokensFromRefresh.and.returnValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        accessExp: 1234567890 + 3600,
      });
      mockAuthMapper.toSession.and.returnValue(mockSession);

      // Mock the internal me() call by setting up the API client response
      mockAuthApiClient.me.and.returnValue(of(mockMeResponse));
      mockAuthMapper.meToEntity.and.returnValue(mockUser);

      // When
      const result = await repository.refresh(refreshToken.getValue());

      // Then
      expect(mockAuthApiClient.refresh).toHaveBeenCalledWith(refreshRequest);
      expect(result).toBeInstanceOf(Session);
    });

    it('should handle refresh errors', async () => {
      // Given
      const refreshToken = RefreshToken.create('invalid-token-but-long-enough-123456');
      const expectedError = InfrastructureError.unauthorized('/api/auth/refresh');

      mockAuthApiClient.refresh.and.returnValue(throwError(() => expectedError));
      mockErrorTransformer.transformWithDefaults.and.returnValue(expectedError);

      // When & Then
      await expectAsync(repository.refresh(refreshToken.getValue())).toBeRejectedWith(
        expectedError
      );
    });
  });

  describe('logout', () => {
    it('should successfully logout', async () => {
      // Given
      mockAuthApiClient.logout.and.returnValue(of({} as any));

      // When
      const refreshToken = 'refresh-token-long-enough-for-validation';
      await repository.logout(refreshToken);

      // Then
      expect(mockAuthApiClient.logout).toHaveBeenCalledWith({ refresh_token: refreshToken });
    });
  });

  describe('register', () => {
    it('should successfully register user', async () => {
      // Given
      const registerRequest: RegisterRequestDTO = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        password_confirm: 'password123',
        first_name: 'New',
        last_name: 'User',
      };

      mockAuthApiClient.register.and.returnValue(of({} as any));

      // When
      const registerContract = {
        username: registerRequest.username,
        email: registerRequest.email,
        password: registerRequest.password,
        passwordConfirm: registerRequest.password_confirm,
        firstName: registerRequest.first_name,
        lastName: registerRequest.last_name,
      };
      await repository.register(registerContract);

      // Then
      expect(mockAuthApiClient.register).toHaveBeenCalledWith({
        username: registerRequest.username,
        email: registerRequest.email,
        password: registerRequest.password,
        password_confirm: registerRequest.password_confirm,
        first_name: registerRequest.first_name,
        last_name: registerRequest.last_name,
        role_id: null,
      });
    });

    it('should handle registration errors', async () => {
      // Given
      const expectedError = InfrastructureError.badRequest('/api/auth/register', {
        user: 'already exists',
      });
      mockAuthApiClient.register.and.returnValue(throwError(() => expectedError));
      mockErrorTransformer.transformWithDefaults.and.returnValue(expectedError);

      // When & Then
      const existingUserContract = {
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password123',
        passwordConfirm: 'password123',
        firstName: 'Existing',
        lastName: 'User',
      };
      await expectAsync(repository.register(existingUserContract)).toBeRejectedWith(expectedError);
    });
  });

  describe('confirmEmail', () => {
    it('should successfully confirm email', async () => {
      // Given
      const token = 'confirmation-token';

      mockAuthApiClient.confirmEmail.and.returnValue(of({} as any));

      // When
      await repository.confirmEmail(token);

      // Then
      expect(mockAuthApiClient.confirmEmail).toHaveBeenCalledWith(token);
    });

    it('should handle email confirmation errors', async () => {
      // Given
      const expectedError = InfrastructureError.unauthorized('/api/auth/confirm-email');
      mockAuthApiClient.confirmEmail.and.returnValue(throwError(() => expectedError));
      mockErrorTransformer.transformWithDefaults.and.returnValue(expectedError);

      // When & Then
      await expectAsync(repository.confirmEmail('invalid-token')).toBeRejectedWith(expectedError);
    });
  });

  describe('requestPasswordReset', () => {
    it('should successfully request password reset', async () => {
      // Given
      const email = Email.create('test@example.com');
      const resetRequest: ResetPasswordRequestDTO = { email: email.value };

      mockAuthApiClient.requestPasswordReset.and.returnValue(of({} as any));

      // When
      await repository.requestPasswordReset(email.value);

      // Then
      expect(mockAuthApiClient.requestPasswordReset).toHaveBeenCalledWith(resetRequest);
    });
  });

  describe('confirmPasswordReset', () => {
    it('should successfully confirm password reset', async () => {
      // Given
      const token = 'reset-token';
      const newPassword = 'newpassword123';
      const confirmRequest: ResetPasswordContract = {
        token,
        newPassword: newPassword,
        newPasswordConfirm: newPassword,
      };

      mockAuthApiClient.confirmPasswordReset.and.returnValue(of({} as any));

      // When
      await repository.confirmPasswordReset(confirmRequest);

      // Then
      const expectedDTO = {
        token: confirmRequest.token,
        new_password: confirmRequest.newPassword,
        new_password_confirm: confirmRequest.newPasswordConfirm,
      };
      expect(mockAuthApiClient.confirmPasswordReset).toHaveBeenCalledWith(expectedDTO);
    });
  });
});
