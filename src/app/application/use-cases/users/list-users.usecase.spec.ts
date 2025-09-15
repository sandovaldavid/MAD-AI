import { TestBed } from '@angular/core/testing';
import { ListUsersUseCase } from './list-users.usecase';
import { USER_REPOSITORY, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { ListUsersRequest, ListUsersResult } from '@application/types/users.types';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import { User } from '@domain/entities/user.entity';
import { Role } from '@domain/entities/role.entity';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';

describe('ListUsersUseCase', () => {
  let useCase: ListUsersUseCase;
  let mockUserRepository: jasmine.SpyObj<UserRepository>;
  let mockLogger: jasmine.SpyObj<Logger>;
  let mockErrorTransformer: jasmine.SpyObj<ApplicationErrorTransformer>;

  let mockUsers: User[];

  beforeEach(() => {
    mockUserRepository = jasmine.createSpyObj('UserRepository', ['list']);
    mockLogger = jasmine.createSpyObj('Logger', ['info', 'error']);
    mockErrorTransformer = jasmine.createSpyObj('ApplicationErrorTransformer', ['transform']);

    const testRole = Role.create({
      id: 1,
      name: 'Admin',
      accessLevel: 5,
      isActive: true,
    });

    mockUsers = [
      User.create({
        id: 1,
        username: 'user1',
        email: 'user1@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        role: testRole,
        notificationPreferences: { email: true, system: true, task: true },
      }),
      User.create({
        id: 2,
        username: 'user2',
        email: 'user2@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        isActive: true,
        role: testRole,
        notificationPreferences: { email: true, system: true, task: true },
      }),
    ];

    TestBed.configureTestingModule({
      providers: [
        ListUsersUseCase,
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
        { provide: LOGGER_PORT, useValue: mockLogger },
        { provide: ApplicationErrorTransformer, useValue: mockErrorTransformer },
      ],
    });

    useCase = TestBed.inject(ListUsersUseCase);

    // Default success behavior
    mockUserRepository.list.and.returnValue(Promise.resolve(mockUsers));
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
    it('should call userRepository.list with the provided filter', async () => {
      const request: ListUsersRequest = {
        filter: { limit: 10, offset: 5 },
        requesterId: 123,
      };

      await useCase.execute(request);

      expect(mockUserRepository.list).toHaveBeenCalledWith(request.filter);
    });

    it('should call userRepository.list with undefined if no filter is provided', async () => {
      await useCase.execute();

      expect(mockUserRepository.list).toHaveBeenCalledWith(undefined);
    });

    it('should call userRepository.list with undefined when request is provided but filter is not', async () => {
      const request: ListUsersRequest = { requesterId: 456 };
      await useCase.execute(request);

      expect(mockUserRepository.list).toHaveBeenCalledWith(undefined);
    });

    it('should return the list of users and the total count', async () => {
      const result = await useCase.execute();

      expect(result.users).toEqual(mockUsers);
      expect(result.totalCount).toBe(mockUsers.length);
    });

    it('should return an empty list and zero count when repository returns an empty array', async () => {
      mockUserRepository.list.and.returnValue(Promise.resolve([]));

      const result = await useCase.execute();

      expect(result.users).toEqual([]);
      expect(result.totalCount).toBe(0);
    });

    it('should log a success message', async () => {
      await useCase.execute();

      expect(mockLogger.info).toHaveBeenCalledWith('Users listed successfully', {
        operation: 'list_users',
      });
    });
  });

  describe('Error Handling', () => {
    it('should transform and throw an error if the repository fails', async () => {
      const repositoryError = new Error('Database connection failed');
      const transformedError = new ApplicationError(
        ApplicationErrorCode.SERVICE_UNAVAILABLE,
        'Service is down',
        'The user service is currently unavailable'
      );

      mockUserRepository.list.and.returnValue(Promise.reject(repositoryError));
      mockErrorTransformer.transform.and.returnValue(transformedError);

      await expectAsync(useCase.execute()).toBeRejectedWith(transformedError);

      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(repositoryError, {
        operation: 'list_users',
      });
    });

    it('should not log a success message if the repository fails', async () => {
      const repositoryError = new Error('Database connection failed');
      mockUserRepository.list.and.returnValue(Promise.reject(repositoryError));

      try {
        await useCase.execute();
      } catch (error) {
        // Expected error
      }

      expect(mockLogger.info).not.toHaveBeenCalled();
    });
  });
});
