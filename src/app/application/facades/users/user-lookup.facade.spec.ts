/**
 * @fileoverview Tests for UserLookupFacade
 *
 * Comprehensive test suite for UserLookupFacade covering user lookup operations,
 * state management, error handling, and cross-facade coordination.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { TestBed } from '@angular/core/testing';

// Facade under test
import { UserLookupFacade } from './user-lookup.facade';

// Use Cases (to be mocked)
import { GetUserById } from '@application/use-cases/users/get-user-by-id.usecase';
import { GetUserByEmail } from '@application/use-cases/users/get-user-by-email.usecase';
import { GetUserByUsernameUseCase } from '@application/use-cases/users/get-user-by-username.usecase';
import { CreateUser } from '@application/use-cases/users/create-user.usecase';
import { UpdateUserUseCase } from '@application/use-cases/users/update-user.usecase';
import { DeleteUser } from '@application/use-cases/users/delete-user.usecase';
import { ListUsersUseCase } from '@application/use-cases/users/list-users.usecase';
import { ActivateUser } from '@application/use-cases/users/activate-user.usecase';
import { DeactivateUser } from '@application/use-cases/users/deactivate-user.usecase';

// Domain entities
import type { User } from '@domain/entities/user.entity';

// Application types
import type { UserLookupCriteria } from '@application/types/users.types';

// Mocks
import { NotificationsFacade } from '../notifications.facade';
import { AuthFacade } from '../auth.facade';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';

describe('UserLookupFacade', () => {
  let facade: UserLookupFacade;

  // Mock use cases
  let mockGetUserByIdUC: jasmine.SpyObj<GetUserById>;
  let mockGetUserByEmailUC: jasmine.SpyObj<GetUserByEmail>;
  let mockGetUserByUsernameUC: jasmine.SpyObj<GetUserByUsernameUseCase>;
  let mockCreateUserUC: jasmine.SpyObj<CreateUser>;
  let mockUpdateUserUC: jasmine.SpyObj<UpdateUserUseCase>;
  let mockDeleteUserUC: jasmine.SpyObj<DeleteUser>;
  let mockListUsersUC: jasmine.SpyObj<ListUsersUseCase>;
  let mockActivateUserUC: jasmine.SpyObj<ActivateUser>;
  let mockDeactivateUserUC: jasmine.SpyObj<DeactivateUser>;

  // Mock dependencies
  let mockNotifications: jasmine.SpyObj<NotificationsFacade>;
  let mockAuth: jasmine.SpyObj<AuthFacade>;
  let mockErrorTransformer: jasmine.SpyObj<ApplicationErrorTransformer>;

  // Test data - using proper User entity structure
  let mockUser: jasmine.SpyObj<User>;

  // Test data - using proper criteria structure
  const mockCriteria: UserLookupCriteria = {
    id: 1,
    email: 'john.doe@example.com',
    username: 'johndoe',
  };

  beforeEach(() => {
    // Create mock User entity
    mockUser = jasmine.createSpyObj('User', ['canDeleteUsers', 'getPermissions'], {
      id: 1,
      username: 'johndoe',
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Setup mock methods
    mockUser.canDeleteUsers.and.returnValue(false);
    mockUser.getPermissions.and.returnValue(['read']);

    // Create mocks using Jasmine
    mockGetUserByIdUC = jasmine.createSpyObj('GetUserById', ['execute']);
    mockGetUserByEmailUC = jasmine.createSpyObj('GetUserByEmail', ['execute']);
    mockGetUserByUsernameUC = jasmine.createSpyObj('GetUserByUsernameUseCase', ['execute']);
    mockCreateUserUC = jasmine.createSpyObj('CreateUser', ['execute']);
    mockUpdateUserUC = jasmine.createSpyObj('UpdateUserUseCase', ['execute']);
    mockDeleteUserUC = jasmine.createSpyObj('DeleteUser', ['execute']);
    mockListUsersUC = jasmine.createSpyObj('ListUsersUseCase', ['execute']);
    mockActivateUserUC = jasmine.createSpyObj('ActivateUser', ['execute']);
    mockDeactivateUserUC = jasmine.createSpyObj('DeactivateUser', ['execute']);

    mockNotifications = jasmine.createSpyObj('NotificationsFacade', [
      'success',
      'info',
      'error',
      'warning',
    ]);
    mockAuth = jasmine.createSpyObj('AuthFacade', [], {
      user: jasmine.createSpy('user').and.returnValue({ id: 1 }),
    });
    mockErrorTransformer = jasmine.createSpyObj('ApplicationErrorTransformer', ['transform']);

    // Configure TestBed
    TestBed.configureTestingModule({
      providers: [
        UserLookupFacade,
        { provide: GetUserById, useValue: mockGetUserByIdUC },
        { provide: GetUserByEmail, useValue: mockGetUserByEmailUC },
        { provide: GetUserByUsernameUseCase, useValue: mockGetUserByUsernameUC },
        { provide: CreateUser, useValue: mockCreateUserUC },
        { provide: UpdateUserUseCase, useValue: mockUpdateUserUC },
        { provide: DeleteUser, useValue: mockDeleteUserUC },
        { provide: ListUsersUseCase, useValue: mockListUsersUC },
        { provide: ActivateUser, useValue: mockActivateUserUC },
        { provide: DeactivateUser, useValue: mockDeactivateUserUC },
        { provide: NotificationsFacade, useValue: mockNotifications },
        { provide: AuthFacade, useValue: mockAuth },
        { provide: ApplicationErrorTransformer, useValue: mockErrorTransformer },
      ],
    });

    facade = TestBed.inject(UserLookupFacade);
  });

  afterEach(() => {
    // Jasmine doesn't need explicit cleanup
  });

  describe('getUserById', () => {
    it('should get user by ID successfully', async () => {
      // Arrange
  mockGetUserByIdUC.execute.and.returnValue(Promise.resolve(mockUser));

      // Act
      const result = await facade.getUserById(1);

      // Assert
      expect(mockGetUserByIdUC.execute).toHaveBeenCalledWith({ userId: 1 });
  expect(result).toEqual({ success: true, message: 'User found', error: undefined, data: mockUser });
      expect(facade.loading()).toBe(false);
      expect(facade.error()).toBeNull();
    });

    it('should get user by ID with skip loading option', async () => {
      // Arrange
  mockGetUserByIdUC.execute.and.returnValue(Promise.resolve(mockUser));

      // Act
      const result = await facade.getUserById(1, { skipLoading: true });

      // Assert
      expect(mockGetUserByIdUC.execute).toHaveBeenCalledWith({ userId: 1 });
  expect(result).toEqual({ success: true, message: 'User found', error: undefined, data: mockUser });
      expect(facade.loading()).toBe(false);
    });

    it('should handle user not found', async () => {
      // Arrange
      const error = new ApplicationError(
        ApplicationErrorCode.USER_NOT_FOUND,
        'User not found',
        'User with ID 999 does not exist'
      );
      mockGetUserByIdUC.execute.and.returnValue(Promise.reject(error));
      mockErrorTransformer.transform.and.returnValue(error);

      // Act & Assert
      await expectAsync(facade.getUserById(999)).toBeRejectedWith(error);
      expect(mockGetUserByIdUC.execute).toHaveBeenCalledWith({ userId: 999 });
      expect(facade.loading()).toBe(false);
      expect(facade.error()).toBeTruthy();
    });

    it('should handle network errors', async () => {
      // Arrange
      const networkError = new Error('Network connection failed');
      mockGetUserByIdUC.execute.and.returnValue(Promise.reject(networkError));
      mockErrorTransformer.transform.and.returnValue(
        new ApplicationError(
          ApplicationErrorCode.UNEXPECTED_ERROR,
          'Unable to connect to server',
          'Network connection failed'
        )
      );

      // Act & Assert
      await expectAsync(facade.getUserById(1)).toBeRejectedWith(networkError);
      expect(facade.loading()).toBe(false);
      expect(facade.error()).toBe('Network connection failed');
    });
  });

  describe('getUserByEmail', () => {
    it('should get user by email successfully', async () => {
      // Arrange
  mockGetUserByEmailUC.execute.and.returnValue(Promise.resolve(mockUser));

      // Act
      const result = await facade.getUserByEmail('john.doe@example.com');

      // Assert
      expect(mockGetUserByEmailUC.execute).toHaveBeenCalledWith({ email: 'john.doe@example.com' });
  expect(result).toEqual({ success: true, message: 'User found', error: undefined, data: mockUser });
      expect(facade.loading()).toBe(false);
      expect(facade.error()).toBeNull();
    });

    it('should get user by email with skip loading option', async () => {
      // Arrange
  mockGetUserByEmailUC.execute.and.returnValue(Promise.resolve(mockUser));

      // Act
      const result = await facade.getUserByEmail('john.doe@example.com', { skipLoading: true });

      // Assert
      expect(mockGetUserByEmailUC.execute).toHaveBeenCalledWith({ email: 'john.doe@example.com' });
  expect(result).toEqual({ success: true, message: 'User found', error: undefined, data: mockUser });
      expect(facade.loading()).toBe(false);
    });

    it('should handle invalid email format', async () => {
      // Arrange
      const validationError = new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Invalid email format',
        'The provided email address is not valid'
      );
      mockGetUserByEmailUC.execute.and.returnValue(Promise.reject(validationError));
      mockErrorTransformer.transform.and.returnValue(validationError);

      // Act & Assert
      await expectAsync(facade.getUserByEmail('invalid-email')).toBeRejectedWith(validationError);
      expect(facade.loading()).toBe(false);
      expect(facade.error()).toBeTruthy();
    });
  });

  describe('getUserByUsername', () => {
    it('should get user by username successfully', async () => {
      // Arrange
      mockGetUserByUsernameUC.execute.and.returnValue(Promise.resolve(mockUser));

      // Act
      const result = await facade.getUserByUsername('johndoe');

      // Assert
      expect(mockGetUserByUsernameUC.execute).toHaveBeenCalledWith({
        username: 'johndoe',
        requesterId: 1, // Assuming current user ID from auth
      });
      expect(result).toEqual({ success: true, message: 'User found', error: undefined, data: mockUser });
      expect(facade.loading()).toBe(false);
      expect(facade.error()).toBeNull();
    });

    it('should get user by username with skip loading option', async () => {
      // Arrange
      mockGetUserByUsernameUC.execute.and.returnValue(Promise.resolve(mockUser));

      // Act
      const result = await facade.getUserByUsername('johndoe', { skipLoading: true });

      // Assert
      expect(mockGetUserByUsernameUC.execute).toHaveBeenCalledWith({
        username: 'johndoe',
        requesterId: 1,
      });
  expect(result).toEqual({ success: true, message: 'User found', error: undefined, data: mockUser });
      expect(facade.loading()).toBe(false);
    });

    it('should handle username not found', async () => {
      // Arrange
      const error = new ApplicationError(
        ApplicationErrorCode.USER_NOT_FOUND,
        'Username not found',
        'User with username nonexistent does not exist'
      );
      mockGetUserByUsernameUC.execute.and.returnValue(Promise.reject(error));
      mockErrorTransformer.transform.and.returnValue(error);

      // Act & Assert
      await expectAsync(facade.getUserByUsername('nonexistent')).toBeRejectedWith(error);
      expect(facade.loading()).toBe(false);
      expect(facade.error()).toBeTruthy();
    });
  });

  describe('State Management', () => {
    it('should manage loading state correctly', async () => {
      // Arrange
      mockGetUserByIdUC.execute.and.returnValue(
        new Promise((resolve) => setTimeout(() => resolve(mockUser), 100))
      );

      // Act
      const promise = facade.getUserById(1);

      // Assert loading state
      expect(facade.loading()).toBe(true);

      await promise;
      expect(facade.loading()).toBe(false);
    });

    it('should clear error state on successful operation', async () => {
      // Arrange
      mockGetUserByIdUC.execute.and.returnValue(Promise.resolve(mockUser));

      // First set an error state by making a failing call
      const error = new Error('Previous error');
      mockGetUserByIdUC.execute.and.returnValue(Promise.reject(error));
      mockErrorTransformer.transform.and.returnValue(
        new ApplicationError(
          ApplicationErrorCode.UNEXPECTED_ERROR,
          'Previous error',
          'Previous error occurred'
        )
      );

      try {
        await facade.getUserById(1);
      } catch {
        // Expected to fail
      }

      // Now reset the mock for success
      mockGetUserByIdUC.execute.and.returnValue(Promise.resolve(mockUser));

      // Act
      await facade.getUserById(1);

      // Assert
      expect(facade.error()).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle timeout errors gracefully', async () => {
      // Arrange
      const timeoutError = new Error('Request timeout');
      mockGetUserByIdUC.execute.and.returnValue(Promise.reject(timeoutError));
      mockErrorTransformer.transform.and.returnValue(
        new ApplicationError(
          ApplicationErrorCode.OPERATION_TIMEOUT,
          'Request timeout',
          'The request took too long to complete'
        )
      );

      // Act & Assert
      await expectAsync(facade.getUserById(1)).toBeRejectedWith(timeoutError);
      expect(facade.loading()).toBe(false);
      expect(facade.error()).toBe('The request took too long to complete');
    });

    it('should handle authentication errors', async () => {
      // Arrange
      const authError = new ApplicationError(
        ApplicationErrorCode.AUTH_FAILED,
        'Authentication required',
        'You must be logged in to perform this action'
      );
      mockGetUserByIdUC.execute.and.returnValue(Promise.reject(authError));
      mockErrorTransformer.transform.and.returnValue(authError);

      // Act & Assert
      await expectAsync(facade.getUserById(1)).toBeRejectedWith(authError);
      expect(facade.loading()).toBe(false);
      expect(facade.error()).toBe('You must be logged in to perform this action');
    });
  });
});
