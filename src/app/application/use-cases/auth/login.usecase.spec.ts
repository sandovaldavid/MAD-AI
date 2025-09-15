import { TestBed } from '@angular/core/testing';
import { LoginUseCase } from './login.usecase';
import { AUTH_REPOSITORY, SESSION_STORE_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { LoggerService } from '@core/services/logger.service';
import { ApplicationError } from '@application/errors/application-error';
import { AuthMapper } from '@application/mappers';
import type { AuthRepository } from '@domain/repositories/business/auth.repository';
import type { SessionStoreRepository } from '@domain/repositories/session/session-store.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { LoginRequest } from '@application/types/auth.types';
import type { Session } from '@domain/entities/session.entity';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let mockAuthRepository: jasmine.SpyObj<AuthRepository>;
  let mockSessionStore: jasmine.SpyObj<SessionStoreRepository>;
  let mockLogger: jasmine.SpyObj<Logger>;

  // Create a simplified mock session object with only the properties the use case needs
  const mockSession = {
    user: {
      id: 1,
      username: { value: 'testuser' },
      email: { value: 'test@example.com' },
      role: {
        id: 1,
        name: 'Admin',
        accessLevel: 1,
      },
      isEmailConfirmed: true,
      status: { value: 'active' },
      updatedAt: { value: new Date().toISOString() },
    },
    accessToken: {
      getValue: () => 'fake-access-token',
      expSeconds: 3600,
    },
    refreshToken: {
      getValue: () => 'fake-refresh-token',
    },
  } as unknown as Session;

  beforeEach(() => {
    mockAuthRepository = jasmine.createSpyObj('AuthRepository', ['login']);
    mockSessionStore = jasmine.createSpyObj('SessionStoreRepository', ['writeAll']);
    mockLogger = jasmine.createSpyObj('Logger', ['info', 'error']);

    TestBed.configureTestingModule({
      providers: [
        LoginUseCase,
        ApplicationErrorTransformer,
        { provide: AUTH_REPOSITORY, useValue: mockAuthRepository },
        { provide: SESSION_STORE_PORT, useValue: mockSessionStore },
        { provide: LOGGER_PORT, useValue: mockLogger },
        { provide: LoggerService, useValue: mockLogger },
      ],
    });

    useCase = TestBed.inject(LoginUseCase);
  });

  it('should be created', () => {
    expect(useCase).toBeTruthy();
  });

  describe('execute', () => {
    const loginRequest: LoginRequest = {
      identifier: {
        type: 'email',
        value: 'test@example.com',
      },
      password: 'password123',
    };

    it('should authenticate, store session, and return session entity', async () => {
      // Arrange
      mockAuthRepository.login.and.resolveTo(mockSession);
      mockSessionStore.writeAll.and.resolveTo();
      spyOn(Date, 'now').and.returnValue(1234567890);

      // Act
      const result = await useCase.execute(loginRequest);

      // Assert
      const expectedCredentials = AuthMapper.toCredentialsContract(loginRequest);
      expect(mockAuthRepository.login).toHaveBeenCalledWith(expectedCredentials);

      const expectedSnapshot = {
        user: {
          id: mockSession.user.id,
          username: mockSession.user.username.value,
          email: mockSession.user.email.value,
          roleId: mockSession.user.role.id,
          roleName: mockSession.user.role.name,
          accessLevel: mockSession.user.role.accessLevel,
          isEmailConfirmed: mockSession.user.isEmailConfirmed,
          status: mockSession.user.status?.value,
          updatedAt: mockSession.user.updatedAt?.value,
        },
        tokens: {
          accessToken: mockSession.accessToken.getValue(),
          accessExp: mockSession.accessToken.expSeconds,
          refreshToken: mockSession.refreshToken.getValue(),
        },
        version: 1,
        updatedAt: 1234567890,
      };
      expect(mockSessionStore.writeAll).toHaveBeenCalledWith(expectedSnapshot);

      expect(mockLogger.info).toHaveBeenCalledWith('Attempting login', { operation: 'login' });
      expect(mockLogger.info).toHaveBeenCalledWith('Login successful', {
        userId: mockSession.user.id.toString(),
        operation: 'login',
      });
      expect(result).toBe(mockSession);
    });

    it('should throw a transformed error if authentication fails', async () => {
      // Arrange
      const authError = new Error('Invalid credentials');
      mockAuthRepository.login.and.rejectWith(authError);
      let caughtError: any;

      // Act
      try {
        await useCase.execute(loginRequest);
      } catch (error) {
        caughtError = error;
      }

      // Assert
      expect(caughtError).toBeInstanceOf(ApplicationError);
      expect(mockLogger.error).toHaveBeenCalledWith('Login failed', { operation: 'login' });
      expect(mockSessionStore.writeAll).not.toHaveBeenCalled();
    });

    it('should throw a transformed error if session storing fails', async () => {
      // Arrange
      const storeError = new Error('Failed to write to session');
      mockAuthRepository.login.and.resolveTo(mockSession);
      mockSessionStore.writeAll.and.rejectWith(storeError);
      let caughtError: any;

      // Act
      try {
        await useCase.execute(loginRequest);
      } catch (error) {
        caughtError = error;
      }

      // Assert
      expect(caughtError).toBeInstanceOf(ApplicationError);
      expect(mockLogger.error).toHaveBeenCalledWith('Login failed', { operation: 'login' });
    });
  });
});
