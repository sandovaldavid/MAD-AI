/**
 * @fileoverview Tests for UserCrudFacade
 *
 * Comprehensive test suite for UserCrudFacade covering CRUD operations,
 * state management, erro    // Configure error transformer mock
    const mockApplicationError = new Error('Test error');
    (mockApplicationError as any).userMessage = 'Test error message';
    mockErrorTransformer.transform.and.returnValue(mockApplicationError);oss-facade coordination.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { TestBed } from '@angular/core/testing';

// Facade under test
import { UserCrudFacade } from './user-crud.facade';

// Use Cases (to be mocked)
import { CreateUser } from '@application/use-cases/users/create-user.usecase';
import { UpdateUserUseCase } from '@application/use-cases/users/update-user.usecase';
import { DeleteUser } from '@application/use-cases/users/delete-user.usecase';

// Domain entities and interfaces
import type { User } from '@domain/entities/user.entity';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { ClockPort } from '@domain/repositories/system/clock.repository';

// Application types
import type {
  CreateUserRequest,
  UpdateUserRequest,
  DeleteUserResult,
} from '@application/types/users.types';

// DI Tokens
import { USER_REPOSITORY, LOGGER_PORT, CLOCK_PORT } from '@di/tokens';

// Mocks
import { NotificationsFacade } from '../notifications.facade';
import { AuthFacade } from '../auth.facade';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';

describe('UserCrudFacade', () => {
  let facade: UserCrudFacade;

  // Mock use cases
  let mockCreateUserUC: jasmine.SpyObj<CreateUser>;
  let mockUpdateUserUC: jasmine.SpyObj<UpdateUserUseCase>;
  let mockDeleteUserUC: jasmine.SpyObj<DeleteUser>;

  // Mock dependencies
  let mockNotifications: jasmine.SpyObj<NotificationsFacade>;
  let mockAuth: jasmine.SpyObj<AuthFacade>;
  let mockErrorTransformer: jasmine.SpyObj<ApplicationErrorTransformer>;

  // Mock infrastructure dependencies
  let mockUserRepository: jasmine.SpyObj<UserRepository>;
  let mockLogger: jasmine.SpyObj<Logger>;
  let mockClockPort: jasmine.SpyObj<ClockPort>;

  // Test data - using proper User entity structure
  let mockUser: jasmine.SpyObj<User>;
  let mockUpdatedUser: jasmine.SpyObj<User>;

  // Test data - using proper request structures
  const mockCreateRequest: CreateUserRequest = {
    userData: {
      username: 'janesmith',
      email: 'jane.smith@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      roleId: 2,
      isActive: true,
    },
    createdBy: 1,
    sendWelcomeNotification: true,
  };

  const mockUpdateRequest: UpdateUserRequest = {
    userId: 1,
    updateData: {
      firstName: 'Jane',
      lastName: 'Updated',
    },
    requesterId: 2,
    notifyUser: true,
  };

  beforeEach(() => {
    // Create mock User entities
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

    mockUpdatedUser = jasmine.createSpyObj('User', ['canDeleteUsers', 'getPermissions'], {
      id: 1,
      username: 'johndoe',
      email: 'john.doe@example.com',
      firstName: 'Jane',
      lastName: 'Updated',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Setup mock methods
    mockUser.canDeleteUsers.and.returnValue(false);
    mockUser.getPermissions.and.returnValue(['read']);

    mockUpdatedUser.canDeleteUsers.and.returnValue(false);
    mockUpdatedUser.getPermissions.and.returnValue(['read']);

    // Create mocks using Jasmine
    mockCreateUserUC = jasmine.createSpyObj('CreateUser', ['execute']);
    mockUpdateUserUC = jasmine.createSpyObj('UpdateUserUseCase', ['execute']);
    mockDeleteUserUC = jasmine.createSpyObj('DeleteUser', ['execute']);

    mockNotifications = jasmine.createSpyObj('NotificationsFacade', [
      'success',
      'info',
      'error',
      'warning',
    ]);
    mockAuth = jasmine.createSpyObj('AuthFacade', ['user']);
    mockErrorTransformer = jasmine.createSpyObj('ApplicationErrorTransformer', ['transform']);

    // Create infrastructure mocks
    mockUserRepository = jasmine.createSpyObj('UserRepository', [
      'create',
      'update',
      'delete',
      'findById',
      'findByEmail',
      'findByUsername',
      'findAll',
    ]);
    mockLogger = jasmine.createSpyObj('Logger', [
      'debug',
      'info',
      'warn',
      'error',
      'setGlobalContext',
    ]);
    mockClockPort = jasmine.createSpyObj('ClockPort', ['now']);

    // Create mock current user for AuthFacade
    const mockCurrentUser = jasmine.createSpyObj('User', ['canDeleteUsers', 'getPermissions'], {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockCurrentUser.canDeleteUsers.and.returnValue(true);
    mockCurrentUser.getPermissions.and.returnValue(['read', 'write', 'delete']);

    // Configure AuthFacade mock
    mockAuth.user.and.returnValue(mockCurrentUser);

    // Configure TestBed
    TestBed.configureTestingModule({
      providers: [
        UserCrudFacade,
        { provide: CreateUser, useValue: mockCreateUserUC },
        { provide: UpdateUserUseCase, useValue: mockUpdateUserUC },
        { provide: DeleteUser, useValue: mockDeleteUserUC },
        { provide: NotificationsFacade, useValue: mockNotifications },
        { provide: AuthFacade, useValue: mockAuth },
        { provide: ApplicationErrorTransformer, useValue: mockErrorTransformer },
        // Infrastructure providers
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
        { provide: LOGGER_PORT, useValue: mockLogger },
        { provide: CLOCK_PORT, useValue: mockClockPort },
      ],
    });

    facade = TestBed.inject(UserCrudFacade);
  });

  afterEach(() => {
    // Jasmine doesn't need explicit cleanup
  });

  describe('createUser', () => {
    it('should create user successfully with notification', async () => {
      // Arrange
      const mockNotification = jasmine.createSpyObj('Notification', [], { id: '1' });
      mockCreateUserUC.execute.and.returnValue(Promise.resolve(mockUser));
      mockNotifications.success.and.returnValue(Promise.resolve(mockNotification));

      // Act
      const result = await facade.createUser(mockCreateRequest);

      // Assert
      expect(mockCreateUserUC.execute).toHaveBeenCalledWith(mockCreateRequest);
      expect(mockNotifications.success).toHaveBeenCalledWith(
        'Welcome to MAD-AI, John!',
        'Your account has been created successfully'
      );
      expect(result).toEqual(mockUser);
      expect(facade.loading()).toBe(false);
      expect(facade.error()).toBeNull();
    });

    it('should create user successfully without notification', async () => {
      // Arrange
      const requestWithoutNotification = { ...mockCreateRequest, sendWelcomeNotification: false };
      const mockNotification = jasmine.createSpyObj('Notification', [], { id: '1' });
      mockCreateUserUC.execute.and.returnValue(Promise.resolve(mockUser));
      mockNotifications.success.and.returnValue(Promise.resolve(mockNotification));

      // Act
      const result = await facade.createUser(requestWithoutNotification);

      // Assert
      expect(mockCreateUserUC.execute).toHaveBeenCalledWith(requestWithoutNotification);
      expect(mockNotifications.success).not.toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should handle notification failure gracefully', async () => {
      // Arrange
      mockCreateUserUC.execute.and.returnValue(Promise.resolve(mockUser));
      mockNotifications.success.and.returnValue(Promise.reject(new Error('Notification failed')));

      // Act
      const result = await facade.createUser(mockCreateRequest);

      // Assert
      expect(mockCreateUserUC.execute).toHaveBeenCalledWith(mockCreateRequest);
      expect(mockNotifications.success).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
      expect(facade.loading()).toBe(false);
    });

    it('should handle create user failure', async () => {
      // Arrange
      const error = new Error('Create failed');
      mockCreateUserUC.execute.and.returnValue(Promise.reject(error));
      mockErrorTransformer.transform.and.returnValue({
        code: 'USER_CREATE_FAILED',
        message: 'Create failed',
        userMessage: 'Failed to create user',
      } as any);

      // Act & Assert
      await expectAsync(facade.createUser(mockCreateRequest)).toBeRejectedWith(error);
      expect(mockCreateUserUC.execute).toHaveBeenCalledWith(mockCreateRequest);
      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(error);
      expect(facade.loading()).toBe(false);
      expect(facade.error()).toBeTruthy();
    });

    it('should skip loading state when requested', async () => {
      // Arrange
      const mockNotification = jasmine.createSpyObj('Notification', [], { id: '1' });
      mockCreateUserUC.execute.and.returnValue(Promise.resolve(mockUser));
      mockNotifications.success.and.returnValue(Promise.resolve(mockNotification));

      // Act
      await facade.createUser(mockCreateRequest, { skipLoading: true });

      // Assert
      expect(facade.loading()).toBe(false);
    });
  });

  describe('updateUser', () => {
    it('should update user successfully with notification', async () => {
      // Arrange
      const mockNotification = jasmine.createSpyObj('Notification', [], { id: '1' });
      mockUpdateUserUC.execute.and.returnValue(Promise.resolve(mockUpdatedUser));
      mockNotifications.info.and.returnValue(Promise.resolve(mockNotification));

      // Act
      const result = await facade.updateUser(mockUpdateRequest);

      // Assert
      expect(mockUpdateUserUC.execute).toHaveBeenCalledWith(mockUpdateRequest);
      expect(mockNotifications.info).toHaveBeenCalledWith(
        'Your profile has been updated',
        'Updated: firstName, lastName'
      );
      expect(result).toEqual(mockUpdatedUser);
      expect(facade.loading()).toBe(false);
      expect(facade.error()).toBeNull();
    });

    it('should update user successfully without notification', async () => {
      // Arrange
      const requestWithoutNotification = { ...mockUpdateRequest, notifyUser: false };
      const mockNotification = jasmine.createSpyObj('Notification', [], { id: '1' });
      mockUpdateUserUC.execute.and.returnValue(Promise.resolve(mockUpdatedUser));
      mockNotifications.info.and.returnValue(Promise.resolve(mockNotification));

      // Act
      const result = await facade.updateUser(requestWithoutNotification);

      // Assert
      expect(mockUpdateUserUC.execute).toHaveBeenCalledWith(requestWithoutNotification);
      expect(mockNotifications.info).not.toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should handle update user failure', async () => {
      // Arrange
      const error = new Error('Update failed');
      mockUpdateUserUC.execute.and.returnValue(Promise.reject(error));
      mockErrorTransformer.transform.and.returnValue({
        code: 'USER_UPDATE_FAILED',
        message: 'Update failed',
        userMessage: 'Failed to update user',
      } as any);

      // Act & Assert
      await expectAsync(facade.updateUser(mockUpdateRequest)).toBeRejectedWith(error);
      expect(mockUpdateUserUC.execute).toHaveBeenCalledWith(mockUpdateRequest);
      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(error);
      expect(facade.loading()).toBe(false);
      expect(facade.error()).toBeTruthy();
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      // Arrange
      const mockResult: DeleteUserResult = {
        success: true,
        userId: 1,
      };
      mockDeleteUserUC.execute.and.returnValue(Promise.resolve(mockResult));

      // Act
      await facade.deleteUser(1);

      // Assert
      expect(mockDeleteUserUC.execute).toHaveBeenCalledWith({ userId: 1 });
      expect(facade.loading()).toBe(false);
      expect(facade.error()).toBeNull();
    });

    it('should handle delete user failure', async () => {
      // Arrange
      const error = new Error('Delete failed');
      mockDeleteUserUC.execute.and.returnValue(Promise.reject(error));
      mockErrorTransformer.transform.and.returnValue({
        code: 'USER_DELETE_FAILED',
        message: 'Delete failed',
        userMessage: 'Failed to delete user',
      } as any);

      // Act & Assert
      await expectAsync(facade.deleteUser(1)).toBeRejectedWith(error);
      expect(mockDeleteUserUC.execute).toHaveBeenCalledWith({ userId: 1 });
      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(error);
      expect(facade.loading()).toBe(false);
      expect(facade.error()).toBeTruthy();
    });
  });

  describe('State Management', () => {
    it('should manage loading state correctly', async () => {
      // Arrange
      const mockNotification = jasmine.createSpyObj('Notification', [], { id: '1' });
      mockCreateUserUC.execute.and.returnValue(
        new Promise((resolve) => setTimeout(() => resolve(mockUser), 100))
      );
      mockNotifications.success.and.returnValue(Promise.resolve(mockNotification));

      // Act
      const promise = facade.createUser(mockCreateRequest);

      // Assert loading state
      expect(facade.loading()).toBe(true);

      await promise;
      expect(facade.loading()).toBe(false);
    });

    it('should clear error state on successful operation', async () => {
      // Arrange
      const mockNotification = jasmine.createSpyObj('Notification', [], { id: '1' });
      mockCreateUserUC.execute.and.returnValue(Promise.resolve(mockUser));
      mockNotifications.success.and.returnValue(Promise.resolve(mockNotification));

      // First set an error state by making a failing call
      const error = new Error('Previous error');
      mockCreateUserUC.execute.and.returnValue(Promise.reject(error));
      mockErrorTransformer.transform.and.returnValue({
        code: 'PREVIOUS_ERROR',
        message: 'Previous error',
      } as any);

      try {
        await facade.createUser(mockCreateRequest);
      } catch {
        // Expected to fail
      }

      // Now reset the mock for success
      mockCreateUserUC.execute.and.returnValue(Promise.resolve(mockUser));

      // Act
      await facade.createUser(mockCreateRequest);

      // Assert
      expect(facade.error()).toBeNull();
    });
  });
});
