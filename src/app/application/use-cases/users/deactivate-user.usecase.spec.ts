import { TestBed } from '@angular/core/testing';
import { DeactivateUser } from './deactivate-user.usecase';
import { USER_REPOSITORY, CLOCK_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { DeactivateUserRequest, GetUserResult } from '@application/types/users.types';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import { User } from '@domain/entities/user.entity';
import { Role } from '@domain/entities/role.entity';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';

describe('DeactivateUser', () => {
  let useCase: DeactivateUser;
  let mockUserRepository: jasmine.SpyObj<UserRepository>;
  let mockClock: jasmine.SpyObj<ClockPort>;
  let mockLogger: jasmine.SpyObj<Logger>;
  let mockErrorTransformer: jasmine.SpyObj<ApplicationErrorTransformer>;

  let mockUser: User;
  let mockDeactivatedUser: User;

  beforeEach(() => {
    mockUserRepository = jasmine.createSpyObj('UserRepository', ['deactivate', 'getById']);
    mockClock = jasmine.createSpyObj('ClockPort', ['nowEpochSeconds']);
    mockLogger = jasmine.createSpyObj('Logger', ['info', 'error']);
    mockErrorTransformer = jasmine.createSpyObj('ApplicationErrorTransformer', ['transform']);

    const testRole = Role.create({
      id: 1,
      name: 'User',
      accessLevel: 2,
      isActive: true,
    });

    mockUser = User.create({
      id: 123,
      username: 'testuser',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      isActive: true,
      role: testRole,
      notificationPreferences: { email: true, system: true, task: true },
    });

    mockDeactivatedUser = User.create({
      id: 123,
      username: 'testuser',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      isActive: false,
      role: testRole,
      notificationPreferences: { email: true, system: true, task: true },
    });

    TestBed.configureTestingModule({
      providers: [
        DeactivateUser,
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
        { provide: CLOCK_PORT, useValue: mockClock },
        { provide: LOGGER_PORT, useValue: mockLogger },
        { provide: ApplicationErrorTransformer, useValue: mockErrorTransformer },
      ],
    });

    useCase = TestBed.inject(DeactivateUser);

    // Default success behavior
    mockUserRepository.deactivate.and.returnValue(Promise.resolve());
    mockUserRepository.getById.and.returnValue(Promise.resolve(mockDeactivatedUser));
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
    it('should call userRepo.deactivate with the correct userId', async () => {
      const request: DeactivateUserRequest = { userId: 123 };
      await useCase.execute(request);
      expect(mockUserRepository.deactivate).toHaveBeenCalledWith(123);
    });

    it('should call userRepo.getById with the correct userId after deactivation', async () => {
      const request: DeactivateUserRequest = { userId: 123 };
      await useCase.execute(request);
      expect(mockUserRepository.getById).toHaveBeenCalledWith(123);
    });

    it('should call handleUserDeactivationSideEffects with the deactivated user', async () => {
      const request: DeactivateUserRequest = { userId: 123 };
      spyOn(useCase as any, 'handleUserDeactivationSideEffects').and.callThrough();
      await useCase.execute(request);
      expect((useCase as any).handleUserDeactivationSideEffects).toHaveBeenCalledWith(
        mockDeactivatedUser
      );
    });

    it('should return the deactivated User object', async () => {
      const request: DeactivateUserRequest = { userId: 123 };
      const result = await useCase.execute(request);
      expect(result).toEqual(mockDeactivatedUser);
    });

    it('should not transform errors on successful execution', async () => {
      const request: DeactivateUserRequest = { userId: 123 };
      await useCase.execute(request);
      expect(mockErrorTransformer.transform).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should log an error message with correct context if userRepo.deactivate rejects', async () => {
      const request: DeactivateUserRequest = { userId: 404 };
      const repositoryError = new Error('User not found for deactivation');
      mockUserRepository.deactivate.and.returnValue(Promise.reject(repositoryError));

      try {
        await useCase.execute(request);
      } catch (error) {
        // Expected error
      }

      expect(mockLogger.error).toHaveBeenCalledWith('User deactivation failed', {
        correlationId: `deactivate-user-404-1640995200`,
        userId: '404',
        operation: 'deactivate_user',
      });
    });

    it('should transform and throw an error if userRepo.deactivate rejects', async () => {
      const request: DeactivateUserRequest = { userId: 404 };
      const repositoryError = new Error('User not found for deactivation');
      const transformedError = new ApplicationError(
        ApplicationErrorCode.USER_NOT_FOUND,
        'User not found',
        'The specified user does not exist'
      );

      mockUserRepository.deactivate.and.returnValue(Promise.reject(repositoryError));
      mockErrorTransformer.transform.and.returnValue(transformedError);

      await expectAsync(useCase.execute(request)).toBeRejectedWith(transformedError);

      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(repositoryError);
    });

    it('should not call handleUserDeactivationSideEffects if userRepo.deactivate rejects', async () => {
      const request: DeactivateUserRequest = { userId: 123 };
      const repositoryError = new Error('Database connection failed');
      mockUserRepository.deactivate.and.returnValue(Promise.reject(repositoryError));
      spyOn(useCase as any, 'handleUserDeactivationSideEffects').and.callThrough();

      await expectAsync(useCase.execute(request)).toBeRejected();
      expect((useCase as any).handleUserDeactivationSideEffects).not.toHaveBeenCalled();
    });

    it('should log an error message with correct context if userRepo.getById rejects', async () => {
      const request: DeactivateUserRequest = { userId: 123 };
      const repositoryError = new Error('User not found after deactivation');
      mockUserRepository.deactivate.and.returnValue(Promise.resolve()); // Deactivate succeeds
      mockUserRepository.getById.and.returnValue(Promise.reject(repositoryError)); // getById fails

      try {
        await useCase.execute(request);
      } catch (error) {
        // Expected error
      }

      expect(mockLogger.error).toHaveBeenCalledWith('User deactivation failed', {
        correlationId: `deactivate-user-123-1640995200`,
        userId: '123',
        operation: 'deactivate_user',
      });
    });

    it('should transform and throw an error if userRepo.getById rejects', async () => {
      const request: DeactivateUserRequest = { userId: 123 };
      const repositoryError = new Error('User not found after deactivation');
      const transformedError = new ApplicationError(
        ApplicationErrorCode.USER_NOT_FOUND,
        'User not found',
        'The specified user does not exist'
      );

      mockUserRepository.deactivate.and.returnValue(Promise.resolve());
      mockUserRepository.getById.and.returnValue(Promise.reject(repositoryError));
      mockErrorTransformer.transform.and.returnValue(transformedError);

      await expectAsync(useCase.execute(request)).toBeRejectedWith(transformedError);

      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(repositoryError);
    });

    it('should not call handleUserDeactivationSideEffects if userRepo.getById rejects', async () => {
      const request: DeactivateUserRequest = { userId: 123 };
      const repositoryError = new Error('Database connection failed');
      mockUserRepository.deactivate.and.returnValue(Promise.resolve());
      mockUserRepository.getById.and.returnValue(Promise.reject(repositoryError));
      spyOn(useCase as any, 'handleUserDeactivationSideEffects').and.callThrough();

      await expectAsync(useCase.execute(request)).toBeRejected();
      expect((useCase as any).handleUserDeactivationSideEffects).not.toHaveBeenCalled();
    });
  });

  describe('Input Validation (Implicit)', () => {
    it('should log error and transform if request is null', async () => {
      const transformedError = new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Invalid request: request must be an object',
        'The request is invalid'
      );
      mockErrorTransformer.transform.and.returnValue(transformedError);

      await expectAsync(useCase.execute(null as any)).toBeRejectedWith(transformedError);

      expect(mockLogger.error).toHaveBeenCalledWith('User deactivation failed', {
        correlationId: `deactivate-user-unknown-1640995200`,
        userId: 'unknown',
        operation: 'deactivate_user',
      });
      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(jasmine.any(Error));
    });

    it('should log error and transform if request is undefined', async () => {
      const transformedError = new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Invalid request: request must be an object',
        'The request is invalid'
      );
      mockErrorTransformer.transform.and.returnValue(transformedError);

      await expectAsync(useCase.execute(undefined as any)).toBeRejectedWith(transformedError);

      expect(mockLogger.error).toHaveBeenCalledWith('User deactivation failed', {
        correlationId: `deactivate-user-unknown-1640995200`,
        userId: 'unknown',
        operation: 'deactivate_user',
      });
      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(jasmine.any(Error));
    });

    it('should log error and transform if userId is missing from request', async () => {
      const request: DeactivateUserRequest = {} as DeactivateUserRequest; // Missing userId
      const transformedError = new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'User ID is required for deactivation',
        'The request is invalid'
      );
      mockErrorTransformer.transform.and.returnValue(transformedError);

      await expectAsync(useCase.execute(request)).toBeRejectedWith(transformedError);

      expect(mockLogger.error).toHaveBeenCalledWith('User deactivation failed', {
        correlationId: `deactivate-user-unknown-1640995200`,
        userId: 'unknown',
        operation: 'deactivate_user',
      });
      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(jasmine.any(Error));
    });
  });
});
