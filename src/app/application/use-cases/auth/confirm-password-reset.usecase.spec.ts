import { TestBed } from '@angular/core/testing';
import { ConfirmPasswordResetUseCase } from './confirm-password-reset.usecase';
import { AUTH_REPOSITORY, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { LoggerService } from '@core/services/logger.service';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '../../errors/error-codes.enum';
import type { AuthRepository } from '@domain/repositories/business/auth.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { PasswordResetConfirmRequest } from '@application/types/auth.types';
import type {
  MessageResultContract,
  ResetPasswordContract,
} from '@domain/repositories/business/auth.contract';

describe('ConfirmPasswordResetUseCase', () => {
  let useCase: ConfirmPasswordResetUseCase;
  let mockAuthRepository: jasmine.SpyObj<AuthRepository>;
  let mockLogger: jasmine.SpyObj<Logger>;
  let mockErrorTransformer: jasmine.SpyObj<ApplicationErrorTransformer>;

  beforeEach(() => {
    mockAuthRepository = jasmine.createSpyObj('AuthRepository', ['confirmPasswordReset']);
    mockLogger = jasmine.createSpyObj('Logger', ['info', 'error']);
    mockErrorTransformer = jasmine.createSpyObj('ApplicationErrorTransformer', ['transform']);

    TestBed.configureTestingModule({
      providers: [
        ConfirmPasswordResetUseCase,
        { provide: ApplicationErrorTransformer, useValue: mockErrorTransformer },
        { provide: AUTH_REPOSITORY, useValue: mockAuthRepository },
        { provide: LOGGER_PORT, useValue: mockLogger },
        { provide: LoggerService, useValue: mockLogger },
      ],
    });

    useCase = TestBed.inject(ConfirmPasswordResetUseCase);
  });

  it('should be created', () => {
    expect(useCase).toBeTruthy();
  });

  describe('execute', () => {
    const request: PasswordResetConfirmRequest = {
      token: 'valid-reset-token-123',
      newPassword: 'NewSecurePassword123!',
      confirmPassword: 'NewSecurePassword123!',
    };

    const mockResult: MessageResultContract = {
      message: 'Password reset completed successfully',
    };

    describe('successful password reset confirmation', () => {
      it('should call the auth repository with correct contract and return success message', async () => {
        // Arrange
        mockAuthRepository.confirmPasswordReset.and.resolveTo(mockResult);

        // Act
        const result = await useCase.execute(request);

        // Assert
        const expectedContract: ResetPasswordContract = {
          token: request.token,
          newPassword: request.newPassword,
          newPasswordConfirm: request.confirmPassword,
        };

        expect(mockAuthRepository.confirmPasswordReset).toHaveBeenCalledWith(expectedContract);
        expect(result).toBe(mockResult.message);
        expect(mockLogger.info).toHaveBeenCalledWith(
          'Starting password reset confirmation process'
        );
        expect(mockLogger.info).toHaveBeenCalledWith(
          'Password reset confirmation completed successfully'
        );
        expect(mockLogger.error).not.toHaveBeenCalled();
        expect(mockErrorTransformer.transform).not.toHaveBeenCalled();
      });

      it('should handle request with device info correctly', async () => {
        // Arrange
        const requestWithDeviceInfo: PasswordResetConfirmRequest = {
          ...request,
          deviceInfo: {
            userAgent: 'Mozilla/5.0',
            deviceId: 'device-123',
            platform: 'web',
          },
        };
        mockAuthRepository.confirmPasswordReset.and.resolveTo(mockResult);

        // Act
        const result = await useCase.execute(requestWithDeviceInfo);

        // Assert
        const expectedContract: ResetPasswordContract = {
          token: requestWithDeviceInfo.token,
          newPassword: requestWithDeviceInfo.newPassword,
          newPasswordConfirm: requestWithDeviceInfo.confirmPassword,
        };

        expect(mockAuthRepository.confirmPasswordReset).toHaveBeenCalledWith(expectedContract);
        expect(result).toBe(mockResult.message);
        expect(mockLogger.info).toHaveBeenCalledTimes(2);
      });
    });

    describe('error handling', () => {
      it('should transform and throw error when auth repository fails', async () => {
        // Arrange
        const repositoryError = new Error('Invalid or expired reset token');
        const transformedError = new ApplicationError(
          ApplicationErrorCode.AUTH_FAILED,
          'Password reset failed',
          'The reset token is invalid or has expired',
          { token: request.token },
          'Please request a new password reset link'
        );

        mockAuthRepository.confirmPasswordReset.and.rejectWith(repositoryError);
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejectedWith(transformedError);

        expect(mockAuthRepository.confirmPasswordReset).toHaveBeenCalledWith({
          token: request.token,
          newPassword: request.newPassword,
          newPasswordConfirm: request.confirmPassword,
        });
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(repositoryError);
        expect(mockLogger.info).toHaveBeenCalledWith(
          'Starting password reset confirmation process'
        );
        expect(mockLogger.error).toHaveBeenCalledWith('Password reset confirmation failed', {
          operation: 'confirmPasswordReset',
        });
        expect(mockLogger.info).not.toHaveBeenCalledWith(
          'Password reset confirmation completed successfully'
        );
      });

      it('should handle invalid token error from repository', async () => {
        // Arrange
        const repositoryError = new Error('Token has expired');
        const transformedError = new ApplicationError(
          ApplicationErrorCode.AUTH_FAILED,
          'Token expired',
          'Your password reset token has expired',
          { token: request.token },
          'Please request a new password reset'
        );

        mockAuthRepository.confirmPasswordReset.and.rejectWith(repositoryError);
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejectedWith(transformedError);

        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(repositoryError);
        expect(mockLogger.error).toHaveBeenCalledWith('Password reset confirmation failed', {
          operation: 'confirmPasswordReset',
        });
      });

      it('should handle password validation error from repository', async () => {
        // Arrange
        const repositoryError = new Error('Password does not meet security requirements');
        const transformedError = new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Password validation failed',
          'The new password does not meet security requirements',
          { requirements: 'minimum 8 characters, uppercase, lowercase, number, special character' },
          'Please choose a stronger password'
        );

        mockAuthRepository.confirmPasswordReset.and.rejectWith(repositoryError);
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejectedWith(transformedError);

        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(repositoryError);
        expect(mockLogger.error).toHaveBeenCalledWith('Password reset confirmation failed', {
          operation: 'confirmPasswordReset',
        });
      });

      it('should handle password mismatch error from repository', async () => {
        // Arrange
        const mismatchRequest: PasswordResetConfirmRequest = {
          token: 'valid-token',
          newPassword: 'NewPassword123!',
          confirmPassword: 'DifferentPassword123!',
        };
        const repositoryError = new Error('Password confirmation does not match');
        const transformedError = new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Password confirmation mismatch',
          'The password and confirmation do not match',
          {},
          'Please ensure both password fields are identical'
        );

        mockAuthRepository.confirmPasswordReset.and.rejectWith(repositoryError);
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute(mismatchRequest)).toBeRejectedWith(transformedError);

        expect(mockAuthRepository.confirmPasswordReset).toHaveBeenCalledWith({
          token: mismatchRequest.token,
          newPassword: mismatchRequest.newPassword,
          newPasswordConfirm: mismatchRequest.confirmPassword,
        });
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(repositoryError);
      });
    });

    describe('logging verification', () => {
      it('should log the start and completion of password reset confirmation', async () => {
        // Arrange
        mockAuthRepository.confirmPasswordReset.and.resolveTo(mockResult);

        // Act
        await useCase.execute(request);

        // Assert
        expect(mockLogger.info).toHaveBeenCalledWith(
          'Starting password reset confirmation process'
        );
        expect(mockLogger.info).toHaveBeenCalledWith(
          'Password reset confirmation completed successfully'
        );
        expect(mockLogger.info).toHaveBeenCalledTimes(2);
      });

      it('should log error with operation context when repository fails', async () => {
        // Arrange
        const repositoryError = new Error('Network timeout');
        const transformedError = new ApplicationError(
          ApplicationErrorCode.SERVICE_UNAVAILABLE,
          'Network error',
          'Unable to complete password reset due to network issues',
          {},
          'Please check your connection and try again'
        );

        mockAuthRepository.confirmPasswordReset.and.rejectWith(repositoryError);
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejectedWith(transformedError);

        expect(mockLogger.error).toHaveBeenCalledWith('Password reset confirmation failed', {
          operation: 'confirmPasswordReset',
        });
        expect(mockLogger.error).toHaveBeenCalledTimes(1);
      });
    });

    describe('request mapping', () => {
      it('should correctly map application request to domain contract', async () => {
        // Arrange
        const requestWithAllFields: PasswordResetConfirmRequest = {
          token: 'complex-token-456',
          newPassword: 'ComplexPassword123!@#',
          confirmPassword: 'ComplexPassword123!@#',
          deviceInfo: {
            userAgent: 'Chrome/91.0',
            platform: 'desktop',
          },
        };
        mockAuthRepository.confirmPasswordReset.and.resolveTo(mockResult);

        // Act
        await useCase.execute(requestWithAllFields);

        // Assert
        const expectedContract: ResetPasswordContract = {
          token: requestWithAllFields.token,
          newPassword: requestWithAllFields.newPassword,
          newPasswordConfirm: requestWithAllFields.confirmPassword,
        };

        expect(mockAuthRepository.confirmPasswordReset).toHaveBeenCalledWith(expectedContract);
        expect(mockAuthRepository.confirmPasswordReset).toHaveBeenCalledTimes(1);
      });

      it('should handle minimal request data correctly', async () => {
        // Arrange
        const minimalRequest: PasswordResetConfirmRequest = {
          token: 'token',
          newPassword: 'Password123!',
          confirmPassword: 'Password123!',
        };
        mockAuthRepository.confirmPasswordReset.and.resolveTo(mockResult);

        // Act
        await useCase.execute(minimalRequest);

        // Assert
        expect(mockAuthRepository.confirmPasswordReset).toHaveBeenCalledWith({
          token: 'token',
          newPassword: 'Password123!',
          newPasswordConfirm: 'Password123!',
        });
      });
    });
  });
});
