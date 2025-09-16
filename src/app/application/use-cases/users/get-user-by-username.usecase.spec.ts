import { TestBed } from '@angular/core/testing';
import { GetUserByUsernameUseCase } from './get-user-by-username.usecase';
import { USER_REPOSITORY, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { GetUserByUsernameRequest, GetUserResult } from '@application/types/users.types';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import { User } from '@domain/entities/user.entity';
import { Role } from '@domain/entities/role.entity';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';

describe('GetUserByUsernameUseCase', () => {
  let useCase: GetUserByUsernameUseCase;
  let mockUserRepository: jasmine.SpyObj<UserRepository>;
  let mockLogger: jasmine.SpyObj<Logger>;
  let mockErrorTransformer: jasmine.SpyObj<ApplicationErrorTransformer>;

  let mockUser: User;

  beforeEach(() => {
    mockUserRepository = jasmine.createSpyObj('UserRepository', ['getByUsername']);
    mockLogger = jasmine.createSpyObj('Logger', ['info', 'error']);
    mockErrorTransformer = jasmine.createSpyObj('ApplicationErrorTransformer', ['transform']);

    const testRole = Role.create({
      id: 1,
      name: 'User',
      accessLevel: 2,
      isActive: true,
    });

    mockUser = User.create({
      id: 1,
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
        GetUserByUsernameUseCase,
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
        { provide: LOGGER_PORT, useValue: mockLogger },
        { provide: ApplicationErrorTransformer, useValue: mockErrorTransformer },
      ],
    });

    useCase = TestBed.inject(GetUserByUsernameUseCase);

    // Default success behavior
    mockUserRepository.getByUsername.and.returnValue(Promise.resolve(mockUser));
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
    it('should call userRepository.getByUsername with the correct username', async () => {
      const request: GetUserByUsernameRequest = { username: 'testuser', requesterId: 1 };
      await useCase.execute(request);
      expect(mockUserRepository.getByUsername).toHaveBeenCalledWith('testuser');
    });

    it('should return the user found by the repository', async () => {
      const request: GetUserByUsernameRequest = { username: 'testuser', requesterId: 1 };
      const result = await useCase.execute(request);
      expect(result).toEqual(mockUser);
    });

    it('should log a success message', async () => {
      const request: GetUserByUsernameRequest = { username: 'testuser', requesterId: 1 };
      await useCase.execute(request);
      expect(mockLogger.info).toHaveBeenCalledWith('User retrieved by username successfully', {
        operation: 'get_user_by_username',
      });
    });
  });

  describe('User Not Found', () => {
    it('should throw a transformed error if user is not found', async () => {
      const request: GetUserByUsernameRequest = { username: 'nonexistent', requesterId: 1 };
      const notFoundError = new Error('User not found with provided username');
      const transformedError = new ApplicationError(
        ApplicationErrorCode.USER_NOT_FOUND,
        'User not found',
        'The specified user does not exist'
      );

      mockUserRepository.getByUsername.and.returnValue(Promise.resolve(null));
      mockErrorTransformer.transform.and.returnValue(transformedError);

      await expectAsync(useCase.execute(request)).toBeRejectedWith(transformedError);

      // Check that the transformer was called with the specific internal error
      const errorArg = mockErrorTransformer.transform.calls.mostRecent().args[0] as Error;
      expect(errorArg).toBeInstanceOf(Error);
      expect(errorArg.message).toBe('User not found with provided username');
    });
  });

  describe('Error Handling', () => {
    it('should transform and throw an error if the repository rejects', async () => {
      const request: GetUserByUsernameRequest = { username: 'testuser', requesterId: 1 };
      const repositoryError = new Error('Database connection failed');
      const transformedError = new ApplicationError(
        ApplicationErrorCode.SERVICE_UNAVAILABLE,
        'Service is down',
        'The user service is currently unavailable'
      );

      mockUserRepository.getByUsername.and.returnValue(Promise.reject(repositoryError));
      mockErrorTransformer.transform.and.returnValue(transformedError);

      await expectAsync(useCase.execute(request)).toBeRejectedWith(transformedError);

      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(repositoryError, {
        operation: 'get_user_by_username',
      });
    });

    it('should not log a success message if the repository fails', async () => {
      const request: GetUserByUsernameRequest = { username: 'testuser', requesterId: 1 };
      const repositoryError = new Error('Database connection failed');
      mockUserRepository.getByUsername.and.returnValue(Promise.reject(repositoryError));

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
        'Invalid request',
        'The request is invalid'
      );
      mockErrorTransformer.transform.and.returnValue(transformedError);

      await expectAsync(useCase.execute(null as any)).toBeRejectedWith(transformedError);
    });
  });
});
