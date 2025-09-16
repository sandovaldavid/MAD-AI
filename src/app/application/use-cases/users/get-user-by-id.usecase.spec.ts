import { TestBed } from '@angular/core/testing';
import { GetUserById } from './get-user-by-id.usecase';
import { USER_REPOSITORY, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { GetUserByIdRequest, GetUserResult } from '@application/types/users.types';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import { User } from '@domain/entities/user.entity';
import { Role } from '@domain/entities/role.entity';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';

describe('GetUserById', () => {
  let useCase: GetUserById;
  let mockUserRepository: jasmine.SpyObj<UserRepository>;
  let mockLogger: jasmine.SpyObj<Logger>;
  let mockErrorTransformer: jasmine.SpyObj<ApplicationErrorTransformer>;

  let mockUser: User;

  beforeEach(() => {
    mockUserRepository = jasmine.createSpyObj('UserRepository', ['getById']);
    mockLogger = jasmine.createSpyObj('Logger', ['info', 'error']);
    mockErrorTransformer = jasmine.createSpyObj('ApplicationErrorTransformer', ['transform']);

    const testRole = Role.create({
      id: 1,
      name: 'Admin',
      accessLevel: 5,
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

    TestBed.configureTestingModule({
      providers: [
        GetUserById,
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
        { provide: LOGGER_PORT, useValue: mockLogger },
        { provide: ApplicationErrorTransformer, useValue: mockErrorTransformer },
      ],
    });

    useCase = TestBed.inject(GetUserById);

    // Default success behavior
    mockUserRepository.getById.and.returnValue(Promise.resolve(mockUser));
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
    it('should call userRepository.getById with the correct userId', async () => {
      const request: GetUserByIdRequest = { userId: 123 };
      await useCase.execute(request);
      expect(mockUserRepository.getById).toHaveBeenCalledWith(123);
    });

    it('should return the user found by the repository', async () => {
      const request: GetUserByIdRequest = { userId: 123 };
      const result = await useCase.execute(request);
      expect(result).toEqual(mockUser);
    });

    it('should log a success message with the correct user ID', async () => {
      const request: GetUserByIdRequest = { userId: 123 };
      await useCase.execute(request);
      expect(mockLogger.info).toHaveBeenCalledWith('User retrieved successfully', {
        operation: 'get_user_by_id',
        userId: '123',
      });
    });
  });

  describe('Error Handling', () => {
    it('should transform and throw an error if the repository rejects', async () => {
      const request: GetUserByIdRequest = { userId: 404 };
      const repositoryError = new Error('User not found');
      const transformedError = new ApplicationError(
        ApplicationErrorCode.USER_NOT_FOUND,
        'User not found',
        'The specified user does not exist'
      );

      mockUserRepository.getById.and.returnValue(Promise.reject(repositoryError));
      mockErrorTransformer.transform.and.returnValue(transformedError);

      await expectAsync(useCase.execute(request)).toBeRejectedWith(transformedError);

      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(repositoryError, {
        operation: 'get_user_by_id',
        userId: '404',
      });
    });

    it('should not log a success message if the repository fails', async () => {
      const request: GetUserByIdRequest = { userId: 123 };
      const repositoryError = new Error('Database connection failed');
      mockUserRepository.getById.and.returnValue(Promise.reject(repositoryError));

      try {
        await useCase.execute(request);
      } catch (error) {
        // Expected error
      }

      expect(mockLogger.info).not.toHaveBeenCalled();
    });

    it('should handle invalid request object gracefully', async () => {
      const transformedError = new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Request is required for getting user by ID',
        'The request is invalid'
      );
      mockErrorTransformer.transform.and.returnValue(transformedError);

      await expectAsync(useCase.execute(null as any)).toBeRejectedWith(transformedError);

      expect(mockLogger.error).toHaveBeenCalledWith('User retrieval failed', {
        correlationId: jasmine.stringMatching(/^get-user-by-id-unknown-\d+$/),
        userId: 'unknown',
        operation: 'get_user_by_id',
      });
      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(
        jasmine.any(Error),
        jasmine.objectContaining({
          operation: 'get_user_by_id',
          userId: 'unknown',
        })
      );
    });

    it('should log error and transform if userId is missing from request', async () => {
      const request: GetUserByIdRequest = {} as GetUserByIdRequest; // Missing userId
      const transformedError = new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'User ID is required for getting user by ID',
        'The request is invalid'
      );
      mockErrorTransformer.transform.and.returnValue(transformedError);

      await expectAsync(useCase.execute(request)).toBeRejectedWith(transformedError);

      expect(mockLogger.error).toHaveBeenCalledWith('User retrieval failed', {
        correlationId: jasmine.stringMatching(/^get-user-by-id-unknown-\d+$/),
        userId: 'unknown',
        operation: 'get_user_by_id',
      });
      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(
        jasmine.any(Error),
        jasmine.objectContaining({
          operation: 'get_user_by_id',
          userId: 'unknown',
        })
      );
    });
  });
});
