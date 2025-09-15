import { TestBed } from '@angular/core/testing';
import { RegisterUseCase } from './register.usecase';
import { AUTH_REPOSITORY, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { LoggerService } from '@core/services/logger.service';
import { ApplicationError } from '@application/errors/application-error';
import { AuthMapper } from '@application/mappers';
import type { AuthRepository } from '@domain/repositories/business/auth.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { RegisterRequest } from '@application/types/auth.types';

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;
  let mockAuthRepository: jasmine.SpyObj<AuthRepository>;
  let mockLogger: jasmine.SpyObj<Logger>;

  beforeEach(() => {
    mockAuthRepository = jasmine.createSpyObj('AuthRepository', ['register']);
    mockLogger = jasmine.createSpyObj('Logger', ['info', 'error']);

    TestBed.configureTestingModule({
      providers: [
        RegisterUseCase,
        ApplicationErrorTransformer,
        { provide: AUTH_REPOSITORY, useValue: mockAuthRepository },
        { provide: LOGGER_PORT, useValue: mockLogger },
        { provide: LoggerService, useValue: mockLogger },
      ],
    });

    useCase = TestBed.inject(RegisterUseCase);
  });

  it('should be created', () => {
    expect(useCase).toBeTruthy();
  });

  describe('execute', () => {
    const registerRequest: RegisterRequest = {
      username: 'newuser',
      email: 'new@example.com',
      firstName: 'New',
      lastName: 'User',
      password: 'password123',
      passwordConfirm: 'password123',
      acceptTerms: true,
    };

    it('should call the auth repository with mapped data and log success', async () => {
      // Arrange
      mockAuthRepository.register.and.resolveTo();

      // Act
      await useCase.execute(registerRequest);

      // Assert
      const expectedDomainData = AuthMapper.toRegisterUserContract(registerRequest);
      expect(mockAuthRepository.register).toHaveBeenCalledWith(expectedDomainData);
      expect(mockLogger.info).toHaveBeenCalledWith('Starting user registration', {
        operation: 'register',
      });
      expect(mockLogger.info).toHaveBeenCalledWith('User registration completed successfully', {
        operation: 'register',
      });
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should throw a transformed error if registration fails', async () => {
      // Arrange
      const repoError = new Error('User already exists');
      mockAuthRepository.register.and.rejectWith(repoError);
      let caughtError: any;

      // Act
      try {
        await useCase.execute(registerRequest);
      } catch (error) {
        caughtError = error;
      }

      // Assert
      expect(caughtError).toBeInstanceOf(ApplicationError);
      expect(mockLogger.error).toHaveBeenCalledWith('User registration failed', {
        operation: 'register',
      });
      // Check that success log was not called
      expect(mockLogger.info).not.toHaveBeenCalledWith(
        'User registration completed successfully',
        jasmine.any(Object)
      );
    });
  });
});
