import { TestBed } from '@angular/core/testing';
import { ConfirmEmailUseCase } from './confirm-email.usecase';
import { AUTH_REPOSITORY, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { LoggerService } from '@core/services/logger.service';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '../../errors/error-codes.enum';
import type { AuthRepository } from '@domain/repositories/business/auth.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { EmailConfirmationRequest } from '@application/types/auth.types';
import type { MessageResultContract } from '@domain/repositories/business/auth.contract';

describe('ConfirmEmailUseCase', () => {
  let useCase: ConfirmEmailUseCase;
  let mockAuthRepository: jasmine.SpyObj<AuthRepository>;
  let mockLogger: jasmine.SpyObj<Logger>;
  let mockErrorTransformer: jasmine.SpyObj<ApplicationErrorTransformer>;

  beforeEach(() => {
    mockAuthRepository = jasmine.createSpyObj('AuthRepository', ['confirmEmail']);
    mockLogger = jasmine.createSpyObj('Logger', ['info', 'warn']);
    mockErrorTransformer = jasmine.createSpyObj('ApplicationErrorTransformer', ['transform']);

    TestBed.configureTestingModule({
      providers: [
        ConfirmEmailUseCase,
        { provide: ApplicationErrorTransformer, useValue: mockErrorTransformer },
        { provide: AUTH_REPOSITORY, useValue: mockAuthRepository },
        { provide: LOGGER_PORT, useValue: mockLogger },
        { provide: LoggerService, useValue: mockLogger },
      ],
    });

    useCase = TestBed.inject(ConfirmEmailUseCase);
  });

  it('should be created', () => {
    expect(useCase).toBeTruthy();
  });

  describe('execute', () => {
    const request: EmailConfirmationRequest = {
      token: 'valid-confirmation-token-123',
    };

    const mockResult: MessageResultContract = {
      message: 'Email confirmed successfully',
    };

    describe('successful email confirmation', () => {
      it('should confirm email and return success message', async () => {
        // Arrange
        mockAuthRepository.confirmEmail.and.resolveTo(mockResult);

        // Act
        const result = await useCase.execute(request);

        // Assert
        expect(mockAuthRepository.confirmEmail).toHaveBeenCalledWith(request.token);
        expect(result).toBe(mockResult.message);
      });

      it('should handle requests with device info', async () => {
        // Arrange
        const requestWithDeviceInfo: EmailConfirmationRequest = {
          token: 'valid-token-456',
          deviceInfo: {
            userAgent: 'Chrome/91.0',
            platform: 'desktop',
          },
        };
        mockAuthRepository.confirmEmail.and.resolveTo(mockResult);

        // Act
        const result = await useCase.execute(requestWithDeviceInfo);

        // Assert
        expect(mockAuthRepository.confirmEmail).toHaveBeenCalledWith(requestWithDeviceInfo.token);
        expect(result).toBe(mockResult.message);
      });
    });

    describe('error handling', () => {
      it('should transform and throw error when auth repository fails', async () => {
        // Arrange
        const repositoryError = new Error('Invalid confirmation token');
        const transformedError = new ApplicationError(
          ApplicationErrorCode.AUTH_FAILED,
          'Email confirmation failed',
          'The confirmation token is invalid or has expired',
          { token: request.token },
          'Please request a new confirmation email'
        );

        mockAuthRepository.confirmEmail.and.rejectWith(repositoryError);
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejectedWith(transformedError);

        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(repositoryError, {
          operation: 'confirm_email',
        });
      });

      it('should handle expired token error from repository', async () => {
        // Arrange
        const repositoryError = new Error('Token has expired');
        const transformedError = new ApplicationError(
          ApplicationErrorCode.AUTH_FAILED,
          'Token expired',
          'Your email confirmation token has expired',
          { token: request.token },
          'Please request a new confirmation email'
        );

        mockAuthRepository.confirmEmail.and.rejectWith(repositoryError);
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejectedWith(transformedError);

        expect(mockAuthRepository.confirmEmail).toHaveBeenCalledWith(request.token);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(repositoryError, {
          operation: 'confirm_email',
        });
      });

      it('should handle already confirmed email error from repository', async () => {
        // Arrange
        const repositoryError = new Error('Email already confirmed');
        const transformedError = new ApplicationError(
          ApplicationErrorCode.INVALID_USER_STATE,
          'Email already confirmed',
          'This email address has already been confirmed',
          { token: request.token },
          'You can now log in to your account'
        );

        mockAuthRepository.confirmEmail.and.rejectWith(repositoryError);
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejectedWith(transformedError);

        expect(mockAuthRepository.confirmEmail).toHaveBeenCalledWith(request.token);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(repositoryError, {
          operation: 'confirm_email',
        });
      });
    });

    describe('logging verification', () => {
      it('should log the start and completion of email confirmation', async () => {
        // Arrange
        mockAuthRepository.confirmEmail.and.resolveTo(mockResult);

        // Act
        await useCase.execute(request);

        // Assert
        expect(mockLogger.info).toHaveBeenCalledWith('Email confirmation attempt initiated', {
          operation: 'confirm_email',
        });
        expect(mockLogger.info).toHaveBeenCalledWith('Email confirmation completed successfully', {
          operation: 'confirm_email',
        });
        expect(mockLogger.info).toHaveBeenCalledTimes(2);
      });

      it('should log warning with operation context when repository fails', async () => {
        // Arrange
        const repositoryError = new Error('Network timeout');
        const transformedError = new ApplicationError(
          ApplicationErrorCode.SERVICE_UNAVAILABLE,
          'Network error',
          'Unable to complete email confirmation due to network issues',
          { token: request.token },
          'Please check your connection and try again'
        );

        mockAuthRepository.confirmEmail.and.rejectWith(repositoryError);
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejectedWith(transformedError);

        expect(mockLogger.warn).toHaveBeenCalledWith('Email confirmation failed', {
          operation: 'confirm_email',
        });
        expect(mockLogger.warn).toHaveBeenCalledTimes(1);
      });
    });

    describe('request mapping', () => {
      it('should correctly map application request to domain repository call', async () => {
        // Arrange
        const complexRequest: EmailConfirmationRequest = {
          token: 'complex-confirmation-token-456',
          deviceInfo: {
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            platform: 'desktop',
            deviceId: 'device-123',
            ipAddress: '192.168.1.100',
          },
        };
        mockAuthRepository.confirmEmail.and.resolveTo(mockResult);

        // Act
        const result = await useCase.execute(complexRequest);

        // Assert
        expect(mockAuthRepository.confirmEmail).toHaveBeenCalledWith(complexRequest.token);
        expect(mockAuthRepository.confirmEmail).toHaveBeenCalledTimes(1);
        expect(result).toBe(mockResult.message);
      });

      it('should handle minimal request with only token', async () => {
        // Arrange
        const minimalRequest: EmailConfirmationRequest = {
          token: 'minimal-token-789',
        };
        mockAuthRepository.confirmEmail.and.resolveTo(mockResult);

        // Act
        const result = await useCase.execute(minimalRequest);

        // Assert
        expect(mockAuthRepository.confirmEmail).toHaveBeenCalledWith(minimalRequest.token);
        expect(result).toBe(mockResult.message);
      });
    });

    describe('orchestration verification', () => {
      it('should orchestrate complete email confirmation flow successfully', async () => {
        // Arrange
        const successMessage = 'Your email has been confirmed successfully!';
        const successResult: MessageResultContract = {
          message: successMessage,
        };
        mockAuthRepository.confirmEmail.and.resolveTo(successResult);

        // Act
        const result = await useCase.execute(request);

        // Assert
        expect(result).toBe(successMessage);

        // Verify orchestration order
        expect(mockLogger.info).toHaveBeenCalledWith('Email confirmation attempt initiated', {
          operation: 'confirm_email',
        });
        expect(mockAuthRepository.confirmEmail).toHaveBeenCalledWith(request.token);
        expect(mockLogger.info).toHaveBeenCalledWith('Email confirmation completed successfully', {
          operation: 'confirm_email',
        });

        // Verify no error paths were taken
        expect(mockLogger.warn).not.toHaveBeenCalled();
        expect(mockErrorTransformer.transform).not.toHaveBeenCalled();
      });
    });
  });
});
