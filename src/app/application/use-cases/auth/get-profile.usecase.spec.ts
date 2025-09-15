import { TestBed } from '@angular/core/testing';
import { GetProfileUseCase } from './get-profile.usecase';
import { AUTH_REPOSITORY, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { LoggerService } from '@core/services/logger.service';
import { ApplicationError } from '@application/errors/application-error';
import type { AuthRepository } from '@domain/repositories/business/auth.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { User } from '@domain/entities/user.entity';

describe('GetProfileUseCase', () => {
  let useCase: GetProfileUseCase;
  let mockAuthRepository: jasmine.SpyObj<AuthRepository>;
  let mockLogger: jasmine.SpyObj<Logger>;

  const mockUser = { id: 1, username: { value: 'test' } } as User;

  beforeEach(() => {
    mockAuthRepository = jasmine.createSpyObj('AuthRepository', ['me']);
    mockLogger = jasmine.createSpyObj('Logger', ['info', 'error']);

    TestBed.configureTestingModule({
      providers: [
        GetProfileUseCase,
        ApplicationErrorTransformer,
        { provide: AUTH_REPOSITORY, useValue: mockAuthRepository },
        { provide: LOGGER_PORT, useValue: mockLogger },
        { provide: LoggerService, useValue: mockLogger },
      ],
    });

    useCase = TestBed.inject(GetProfileUseCase);
  });

  it('should be created', () => {
    expect(useCase).toBeTruthy();
  });

  describe('execute', () => {
    it('should call the auth repository and return the user profile', async () => {
      // Arrange
      mockAuthRepository.me.and.resolveTo(mockUser);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(mockAuthRepository.me).toHaveBeenCalled();
      expect(result).toBe(mockUser);
      expect(mockLogger.info).toHaveBeenCalledWith('Starting user profile retrieval', {
        operation: 'get_profile',
      });
      expect(mockLogger.info).toHaveBeenCalledWith('User profile retrieved successfully', {
        operation: 'get_profile',
      });
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should throw a transformed error if retrieving the profile fails', async () => {
      // Arrange
      const repoError = new Error('Not authenticated');
      mockAuthRepository.me.and.rejectWith(repoError);
      let caughtError: any;

      // Act
      try {
        await useCase.execute();
      } catch (error) {
        caughtError = error;
      }

      // Assert
      expect(caughtError).toBeInstanceOf(ApplicationError);
      expect(mockAuthRepository.me).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith('User profile retrieval failed', {
        operation: 'get_profile',
      });
      expect(mockLogger.info).not.toHaveBeenCalledWith(
        'User profile retrieved successfully',
        jasmine.any(Object)
      );
    });
  });
});
