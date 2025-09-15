import { TestBed } from '@angular/core/testing';
import { LogoutUseCase } from './logout.usecase';
import { AUTH_REPOSITORY, SESSION_STORE_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { LoggerService } from '@core/services/logger.service';
import { ApplicationError } from '@application/errors/application-error';
import type { AuthRepository } from '@domain/repositories/business/auth.repository';
import type { SessionStoreRepository } from '@domain/repositories/session/session-store.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { SessionSnapshotContract } from '@domain/repositories/session/session-store.contract';

describe('LogoutUseCase', () => {
  let useCase: LogoutUseCase;
  let mockAuthRepository: jasmine.SpyObj<AuthRepository>;
  let mockSessionStore: jasmine.SpyObj<SessionStoreRepository>;
  let mockLogger: jasmine.SpyObj<Logger>;

  const mockSessionData: SessionSnapshotContract = {
    user: {
      id: 1,
      username: 'test',
      email: 'test@test.com',
      roleId: 1,
      roleName: 'user',
      accessLevel: 1,
    },
    tokens: {
      accessToken: 'access',
      refreshToken: 'refresh',
      accessExp: 3600,
    },
    version: 1,
    updatedAt: Date.now(),
  };

  beforeEach(() => {
    mockAuthRepository = jasmine.createSpyObj('AuthRepository', ['logout']);
    mockSessionStore = jasmine.createSpyObj('SessionStoreRepository', ['readAll', 'writeAll']);
    mockLogger = jasmine.createSpyObj('Logger', ['info', 'error', 'warn']);

    TestBed.configureTestingModule({
      providers: [
        LogoutUseCase,
        ApplicationErrorTransformer,
        { provide: AUTH_REPOSITORY, useValue: mockAuthRepository },
        { provide: SESSION_STORE_PORT, useValue: mockSessionStore },
        { provide: LOGGER_PORT, useValue: mockLogger },
        { provide: LoggerService, useValue: mockLogger },
      ],
    });

    useCase = TestBed.inject(LogoutUseCase);

    // Default happy path mocks
    mockSessionStore.readAll.and.resolveTo(mockSessionData);
    mockAuthRepository.logout.and.resolveTo();
    mockSessionStore.writeAll.and.resolveTo();
  });

  it('should be created', () => {
    expect(useCase).toBeTruthy();
  });

  describe('execute', () => {
    it('should revoke token and clear session when session exists', async () => {
      // Act
      await useCase.execute();

      // Assert
      expect(mockSessionStore.readAll).toHaveBeenCalled();
      expect(mockAuthRepository.logout).toHaveBeenCalledWith('refresh');
      expect(mockSessionStore.writeAll).toHaveBeenCalledWith(null);
      expect(mockLogger.info).toHaveBeenCalledWith('Attempting logout', { operation: 'logout' });
      expect(mockLogger.info).toHaveBeenCalledWith('Logout successful', { operation: 'logout' });
    });

    it('should only clear session if no refresh token is present', async () => {
      // Arrange
      const sessionWithoutToken: SessionSnapshotContract = {
        ...mockSessionData,
        tokens: null as any,
      };
      mockSessionStore.readAll.and.resolveTo(sessionWithoutToken);

      // Act
      await useCase.execute();

      // Assert
      expect(mockAuthRepository.logout).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith('Logout without refresh token', {
        operation: 'logout',
      });
      expect(mockSessionStore.writeAll).toHaveBeenCalledWith(null);
    });

    it('should only clear session if no session data exists', async () => {
      // Arrange
      mockSessionStore.readAll.and.resolveTo(null);

      // Act
      await useCase.execute();

      // Assert
      expect(mockAuthRepository.logout).not.toHaveBeenCalled();
      expect(mockSessionStore.writeAll).toHaveBeenCalledWith(null);
    });

    it('should throw a transformed error if reading the session fails', async () => {
      // Arrange
      const readError = new Error('Cannot read session');
      mockSessionStore.readAll.and.rejectWith(readError);
      let caughtError: any;

      // Act
      try {
        await useCase.execute();
      } catch (error) {
        caughtError = error;
      }

      // Assert
      expect(caughtError).toBeInstanceOf(ApplicationError);
      expect(mockLogger.error).toHaveBeenCalledWith('Logout failed', { operation: 'logout' });
      expect(mockAuthRepository.logout).not.toHaveBeenCalled();
      expect(mockSessionStore.writeAll).not.toHaveBeenCalled();
    });

    it('should throw a transformed error and NOT clear session if revoking fails', async () => {
      // Arrange
      const logoutError = new Error('Token revocation failed');
      mockAuthRepository.logout.and.rejectWith(logoutError);
      let caughtError: any;

      // Act
      try {
        await useCase.execute();
      } catch (error) {
        caughtError = error;
      }

      // Assert
      expect(caughtError).toBeInstanceOf(ApplicationError);
      expect(mockLogger.error).toHaveBeenCalledWith('Logout failed', { operation: 'logout' });
      // Important: session should not be cleared if the remote logout fails
      expect(mockSessionStore.writeAll).not.toHaveBeenCalled();
    });
  });
});
