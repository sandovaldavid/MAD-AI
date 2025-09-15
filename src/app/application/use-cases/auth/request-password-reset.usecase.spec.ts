import { TestBed } from '@angular/core/testing';
import { RequestPasswordResetUseCase } from './request-password-reset.usecase';
import { AUTH_REPOSITORY, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { LoggerService } from '@core/services/logger.service';
import { ApplicationError } from '@application/errors/application-error';
import type { AuthRepository } from '@domain/repositories/business/auth.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { PasswordResetRequest } from '@application/types/auth.types';

describe('RequestPasswordResetUseCase', () => {
  let useCase: RequestPasswordResetUseCase;
  let mockAuthRepository: jasmine.SpyObj<AuthRepository>;
  let mockLogger: jasmine.SpyObj<Logger>;

  beforeEach(() => {
    mockAuthRepository = jasmine.createSpyObj('AuthRepository', ['requestPasswordReset']);
    mockLogger = jasmine.createSpyObj('Logger', ['info', 'error']);

    TestBed.configureTestingModule({
      providers: [
        RequestPasswordResetUseCase,
        ApplicationErrorTransformer,
        { provide: AUTH_REPOSITORY, useValue: mockAuthRepository },
        { provide: LOGGER_PORT, useValue: mockLogger },
        { provide: LoggerService, useValue: mockLogger },
      ],
    });

    useCase = TestBed.inject(RequestPasswordResetUseCase);
  });

  it('should be created', () => {
    expect(useCase).toBeTruthy();
  });

  describe('execute', () => {
    const request: PasswordResetRequest = {
      email: 'test@example.com',
    };

    it('should call the auth repository and return the success message', async () => {
      // Arrange
      const successMessage = 'Password reset email sent.';
      mockAuthRepository.requestPasswordReset.and.resolveTo({ message: successMessage });

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(mockAuthRepository.requestPasswordReset).toHaveBeenCalledWith(request.email);
      expect(result).toBe(successMessage);
      expect(mockLogger.info).toHaveBeenCalledWith('Starting password reset request', {
        operation: 'password_reset_request',
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Password reset request completed successfully',
        {
          operation: 'password_reset_request',
        }
      );
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should throw a transformed error if the request fails', async () => {
      // Arrange
      const repoError = new Error('User not found');
      mockAuthRepository.requestPasswordReset.and.rejectWith(repoError);
      let caughtError: any;

      // Act
      try {
        await useCase.execute(request);
      } catch (error) {
        caughtError = error;
      }

      // Assert
      expect(caughtError).toBeInstanceOf(ApplicationError);
      expect(mockLogger.error).toHaveBeenCalledWith('Password reset request failed', {
        operation: 'password_reset_request',
      });
      expect(mockLogger.info).not.toHaveBeenCalledWith(
        'Password reset request completed successfully',
        jasmine.any(Object)
      );
    });
  });
});
