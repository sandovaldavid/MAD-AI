import { TestBed } from '@angular/core/testing';
import { DeleteUser } from './delete-user.usecase';
import { USER_REPOSITORY, CLOCK_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { DeleteUserRequest, DeleteUserResult } from '@application/types/users.types';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';

describe('DeleteUser', () => {
  let useCase: DeleteUser;
  let mockUserRepository: jasmine.SpyObj<UserRepository>;
  let mockClock: jasmine.SpyObj<ClockPort>;
  let mockLogger: jasmine.SpyObj<Logger>;
  let mockErrorTransformer: jasmine.SpyObj<ApplicationErrorTransformer>;

  beforeEach(() => {
    mockUserRepository = jasmine.createSpyObj('UserRepository', ['delete']);
    mockClock = jasmine.createSpyObj('ClockPort', ['nowEpochSeconds']);
    mockLogger = jasmine.createSpyObj('Logger', ['info', 'error']);
    mockErrorTransformer = jasmine.createSpyObj('ApplicationErrorTransformer', ['transform']);

    TestBed.configureTestingModule({
      providers: [
        DeleteUser,
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
        { provide: CLOCK_PORT, useValue: mockClock },
        { provide: LOGGER_PORT, useValue: mockLogger },
        { provide: ApplicationErrorTransformer, useValue: mockErrorTransformer },
      ],
    });

    useCase = TestBed.inject(DeleteUser);

    // Default success behavior
    mockUserRepository.delete.and.returnValue(Promise.resolve());
    mockClock.nowEpochSeconds.and.returnValue(1640995200); // Fixed timestamp
    mockErrorTransformer.transform.and.callFake(
      (error: any) =>
        new ApplicationError(
          ApplicationErrorCode.UNEXPECTED_ERROR,
          error?.message || 'Unhandled error',
          'An unexpected error occurred'
        )
    );
  });

  describe('Successful Execution', () => {
    it('should call userRepo.delete with the correct userId', async () => {
      const request: DeleteUserRequest = { userId: 123 };
      await useCase.execute(request);
      expect(mockUserRepository.delete).toHaveBeenCalledWith(123);
    });

    it('should call handleUserDeletionSideEffects with the correct userId', async () => {
      const request: DeleteUserRequest = { userId: 123 };
      spyOn(useCase as any, 'handleUserDeletionSideEffects').and.callThrough();
      await useCase.execute(request);
      expect((useCase as any).handleUserDeletionSideEffects).toHaveBeenCalledWith(123);
    });

    it('should return the expected DeleteUserResult object', async () => {
      const request: DeleteUserRequest = { userId: 123 };
      const result = await useCase.execute(request);
      expect(result).toEqual({ success: true, userId: 123 });
    });

    it('should not transform errors on successful execution', async () => {
      const request: DeleteUserRequest = { userId: 123 };
      await useCase.execute(request);
      expect(mockErrorTransformer.transform).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling (from userRepo.delete)', () => {
    it('should log an error message with correct context', async () => {
      const request: DeleteUserRequest = { userId: 404 };
      const repositoryError = new Error('User not found');
      mockUserRepository.delete.and.returnValue(Promise.reject(repositoryError));

      try {
        await useCase.execute(request);
      } catch (error) {
        // Expected error
      }

      expect(mockLogger.error).toHaveBeenCalledWith('User deletion failed', {
        correlationId: `delete-user-404-1640995200`,
        userId: '404',
        operation: 'delete_user',
      });
    });

    it('should transform and throw an error if the repository rejects', async () => {
      const request: DeleteUserRequest = { userId: 404 };
      const repositoryError = new Error('User not found');
      const transformedError = new ApplicationError(
        ApplicationErrorCode.USER_NOT_FOUND,
        'User not found',
        'The specified user does not exist'
      );

      mockUserRepository.delete.and.returnValue(Promise.reject(repositoryError));
      mockErrorTransformer.transform.and.returnValue(transformedError);

      await expectAsync(useCase.execute(request)).toBeRejectedWith(transformedError);

      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(repositoryError);
    });

    it('should not call handleUserDeletionSideEffects if repository rejects', async () => {
      const request: DeleteUserRequest = { userId: 123 };
      const repositoryError = new Error('Database connection failed');
      mockUserRepository.delete.and.returnValue(Promise.reject(repositoryError));
      spyOn(useCase as any, 'handleUserDeletionSideEffects').and.callThrough();

      await expectAsync(useCase.execute(request)).toBeRejected();
      expect((useCase as any).handleUserDeletionSideEffects).not.toHaveBeenCalled();
    });
  });

  describe('Input Validation (Implicit)', () => {
    it('should log error and transform if request is null', async () => {
      const transformedError = new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Invalid request',
        'The request is invalid'
      );
      mockErrorTransformer.transform.and.returnValue(transformedError);

      // The use case will fail trying to access 'userId' of null, which is caught
      await expectAsync(useCase.execute(null as any)).toBeRejectedWith(transformedError);

      expect(mockLogger.error).toHaveBeenCalledWith('User deletion failed', {
        correlationId: `delete-user-unknown-1640995200`,
        userId: 'unknown',
        operation: 'delete_user',
      });
    });

    it('should log error and transform if request is undefined', async () => {
      const transformedError = new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Invalid request',
        'The request is invalid'
      );
      mockErrorTransformer.transform.and.returnValue(transformedError);

      await expectAsync(useCase.execute(undefined as any)).toBeRejectedWith(transformedError);

      expect(mockLogger.error).toHaveBeenCalledWith('User deletion failed', {
        correlationId: `delete-user-unknown-1640995200`,
        userId: 'unknown',
        operation: 'delete_user',
      });
    });

    it('should log error and transform if userId is missing from request', async () => {
      const request: DeleteUserRequest = { } as DeleteUserRequest; // Missing userId
      const transformedError = new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Invalid request',
        'The request is invalid'
      );
      mockErrorTransformer.transform.and.returnValue(transformedError);

      await expectAsync(useCase.execute(request)).toBeRejectedWith(transformedError);

      expect(mockLogger.error).toHaveBeenCalledWith('User deletion failed', {
        correlationId: `delete-user-unknown-1640995200`,
        userId: 'unknown',
        operation: 'delete_user',
      });
    });
  });
});
