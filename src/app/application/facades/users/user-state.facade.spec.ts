/**
 * @fileoverview Tests for UserStateFacade
 *
 * Comprehensive test suite for UserStateFacade covering user state management
 * operations including activation, deactivation, toggling, and batch operations.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { TestBed } from '@angular/core/testing';

// Facade under test
import { UserStateFacade } from './user-state.facade';

// Use Cases (to be mocked)
import { ActivateUser } from '@application/use-cases/users/activate-user.usecase';
import { DeactivateUser } from '@application/use-cases/users/deactivate-user.usecase';
import { GetUserById } from '@application/use-cases/users/get-user-by-id.usecase';

// Domain entities and interfaces
import type { User } from '@domain/entities/user.entity';

// Application types
import type { FacadeOpts } from '@application/types/facade-opts';

// DI Tokens
import { USER_REPOSITORY, LOGGER_PORT, CLOCK_PORT } from '@di/tokens';

// Mocks
import { NotificationsFacade } from '../notifications.facade';
import { AuthFacade } from '../auth.facade';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';

describe('UserStateFacade', () => {
  let facade: UserStateFacade;

  // Mock use cases
  let mockActivateUserUC: jasmine.SpyObj<ActivateUser>;
  let mockDeactivateUserUC: jasmine.SpyObj<DeactivateUser>;
  let mockGetUserByIdUC: jasmine.SpyObj<GetUserById>;

  // Mock dependencies
  let mockNotifications: jasmine.SpyObj<NotificationsFacade>;
  let mockAuth: jasmine.SpyObj<AuthFacade>;
  let mockErrorTransformer: jasmine.SpyObj<ApplicationErrorTransformer>;

  // Mock infrastructure dependencies
  let mockUserRepository: jasmine.SpyObj<any>;
  let mockLogger: jasmine.SpyObj<any>;
  let mockClockPort: jasmine.SpyObj<any>;

  // Test data - using proper User entity structure
  let mockActiveUser: jasmine.SpyObj<User>;
  let mockInactiveUser: jasmine.SpyObj<User>;

  beforeEach(() => {
    // Create mock User entities
    mockActiveUser = jasmine.createSpyObj('User', ['canDeleteUsers', 'getPermissions'], {
      id: 1,
      username: 'johndoe',
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockInactiveUser = jasmine.createSpyObj('User', ['canDeleteUsers', 'getPermissions'], {
      id: 2,
      username: 'janesmith',
      email: 'jane.smith@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      active: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Setup mock methods
    mockActiveUser.canDeleteUsers.and.returnValue(false);
    mockActiveUser.getPermissions.and.returnValue(['read']);

    mockInactiveUser.canDeleteUsers.and.returnValue(false);
    mockInactiveUser.getPermissions.and.returnValue(['read']);

    // Create mocks using Jasmine
    mockActivateUserUC = jasmine.createSpyObj('ActivateUser', ['execute']);
    mockDeactivateUserUC = jasmine.createSpyObj('DeactivateUser', ['execute']);
    mockGetUserByIdUC = jasmine.createSpyObj('GetUserById', ['execute']);

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

    // Configure error transformer mock
    const mockApplicationError = {
      code: 'TEST_ERROR',
      message: 'Test error',
      userMessage: 'Test error message',
      timestamp: new Date(),
      errorId: 'test-error-id',
      retryable: false,
    } as any;
    mockErrorTransformer.transform.and.returnValue(mockApplicationError);

    // Configure TestBed
    TestBed.configureTestingModule({
      providers: [
        UserStateFacade,
        { provide: ActivateUser, useValue: mockActivateUserUC },
        { provide: DeactivateUser, useValue: mockDeactivateUserUC },
        { provide: GetUserById, useValue: mockGetUserByIdUC },
        { provide: NotificationsFacade, useValue: mockNotifications },
        { provide: AuthFacade, useValue: mockAuth },
        { provide: ApplicationErrorTransformer, useValue: mockErrorTransformer },
        // Infrastructure providers
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
        { provide: LOGGER_PORT, useValue: mockLogger },
        { provide: CLOCK_PORT, useValue: mockClockPort },
      ],
    });

    facade = TestBed.inject(UserStateFacade);
  });

  afterEach(() => {
    // Jasmine doesn't need explicit cleanup
  });

  describe('activateUser', () => {
    it('should activate user successfully', async () => {
      // Arrange
      mockActivateUserUC.execute.and.returnValue(Promise.resolve(mockActiveUser));
      mockGetUserByIdUC.execute.and.returnValue(Promise.resolve(mockActiveUser));

      // Act
      await facade.activateUser(1);

      // Assert
      expect(mockActivateUserUC.execute).toHaveBeenCalledWith({ userId: 1 });
      expect(mockGetUserByIdUC.execute).toHaveBeenCalledWith({ userId: 1 });
      expect(facade.loading()).toBe(false);
      expect(facade.error()).toBeNull();
    });

    it('should handle activation failure', async () => {
      // Arrange
      const error = new Error('Activation failed');
      mockActivateUserUC.execute.and.returnValue(Promise.reject(error));
      mockErrorTransformer.transform.and.returnValue({
        code: 'USER_ACTIVATION_FAILED',
        message: 'Activation failed',
        userMessage: 'Failed to activate user',
      } as any);

      // Act & Assert
      await expectAsync(facade.activateUser(1)).toBeRejectedWith(error);
      expect(mockActivateUserUC.execute).toHaveBeenCalledWith({ userId: 1 });
      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(error);
      expect(facade.loading()).toBe(false);
      expect(facade.error()).toBeTruthy();
    });

    it('should skip loading state when requested', async () => {
      // Arrange
      mockActivateUserUC.execute.and.returnValue(Promise.resolve(mockActiveUser));
      mockGetUserByIdUC.execute.and.returnValue(Promise.resolve(mockActiveUser));

      // Act
      await facade.activateUser(1, { skipLoading: true });

      // Assert
      expect(facade.loading()).toBe(false);
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user successfully', async () => {
      // Arrange
      mockDeactivateUserUC.execute.and.returnValue(Promise.resolve(mockInactiveUser));
      mockGetUserByIdUC.execute.and.returnValue(Promise.resolve(mockInactiveUser));

      // Act
      await facade.deactivateUser(2);

      // Assert
      expect(mockDeactivateUserUC.execute).toHaveBeenCalledWith({ userId: 2 });
      expect(mockGetUserByIdUC.execute).toHaveBeenCalledWith({ userId: 2 });
      expect(facade.loading()).toBe(false);
      expect(facade.error()).toBeNull();
    });

    it('should handle deactivation failure', async () => {
      // Arrange
      const error = new Error('Deactivation failed');
      mockDeactivateUserUC.execute.and.returnValue(Promise.reject(error));
      mockErrorTransformer.transform.and.returnValue({
        code: 'USER_DEACTIVATION_FAILED',
        message: 'Deactivation failed',
        userMessage: 'Failed to deactivate user',
      } as any);

      // Act & Assert
      await expectAsync(facade.deactivateUser(2)).toBeRejectedWith(error);
      expect(mockDeactivateUserUC.execute).toHaveBeenCalledWith({ userId: 2 });
      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(error);
      expect(facade.loading()).toBe(false);
      expect(facade.error()).toBeTruthy();
    });
  });

  describe('toggleUserStatus', () => {
    it('should activate inactive user', async () => {
      // Arrange
      facade['_users'].set([mockInactiveUser]);
      mockActivateUserUC.execute.and.returnValue(Promise.resolve(mockActiveUser));
      mockGetUserByIdUC.execute.and.returnValue(Promise.resolve(mockActiveUser));

      // Act
      await facade.toggleUserStatus(2);

      // Assert
      expect(mockActivateUserUC.execute).toHaveBeenCalledWith({ userId: 2 });
      expect(mockDeactivateUserUC.execute).not.toHaveBeenCalled();
    });

    it('should deactivate active user', async () => {
      // Arrange
      facade['_users'].set([mockActiveUser]);
      mockDeactivateUserUC.execute.and.returnValue(Promise.resolve(mockInactiveUser));
      mockGetUserByIdUC.execute.and.returnValue(Promise.resolve(mockInactiveUser));

      // Act
      await facade.toggleUserStatus(1);

      // Assert
      expect(mockDeactivateUserUC.execute).toHaveBeenCalledWith({ userId: 1 });
      expect(mockActivateUserUC.execute).not.toHaveBeenCalled();
    });

    it('should fetch user from server if not in local state', async () => {
      // Arrange
      facade['_users'].set([]);
      mockGetUserByIdUC.execute.and.returnValues(
        Promise.resolve(mockActiveUser), // First call: fetch user to check status
        Promise.resolve(mockInactiveUser) // Second call: fetch updated user after deactivation
      );
      mockDeactivateUserUC.execute.and.returnValue(Promise.resolve(mockInactiveUser));

      // Act
      await facade.toggleUserStatus(1);

      // Assert
      expect(mockGetUserByIdUC.execute).toHaveBeenCalledWith({ userId: 1 });
      expect(mockGetUserByIdUC.execute).toHaveBeenCalledTimes(2);
      expect(mockDeactivateUserUC.execute).toHaveBeenCalledWith({ userId: 1 });
      expect(mockDeactivateUserUC.execute).toHaveBeenCalledTimes(1);
    });

    it('should handle user not found error', async () => {
      // Arrange
      facade['_users'].set([]);
      mockGetUserByIdUC.execute.and.returnValue(Promise.resolve(null));

      // Act & Assert
      await expectAsync(facade.toggleUserStatus(999)).toBeRejectedWith(
        new Error('User with ID 999 not found')
      );
    });
  });

  describe('batchActivateUsers', () => {
    it('should activate multiple users successfully', async () => {
      // Arrange
      const userIds = [1, 2, 3];
      mockActivateUserUC.execute.and.returnValue(Promise.resolve(mockActiveUser));
      mockGetUserByIdUC.execute.and.returnValue(Promise.resolve(mockActiveUser));

      // Act
      await facade.batchActivateUsers(userIds);

      // Assert
      expect(mockActivateUserUC.execute).toHaveBeenCalledTimes(3);
      userIds.forEach((userId) => {
        expect(mockActivateUserUC.execute).toHaveBeenCalledWith({ userId });
      });
    });

    it('should handle batch activation failure', async () => {
      // Arrange
      const userIds = [1, 2, 3];
      const error = new Error('Batch activation failed');
      mockActivateUserUC.execute.and.returnValue(Promise.reject(error));
      mockErrorTransformer.transform.and.returnValue({
        code: 'USER_ACTIVATION_FAILED',
        message: 'Batch activation failed',
        userMessage: 'Failed to activate users',
      } as any);

      // Act & Assert
      await expectAsync(facade.batchActivateUsers(userIds)).toBeRejectedWith(error);
      expect(mockActivateUserUC.execute).toHaveBeenCalledWith({ userId: 1 });
      expect(mockActivateUserUC.execute).toHaveBeenCalledTimes(1); // Should stop on first failure
    });
  });

  describe('batchDeactivateUsers', () => {
    it('should deactivate multiple users successfully', async () => {
      // Arrange
      const userIds = [1, 2, 3];
      mockDeactivateUserUC.execute.and.returnValue(Promise.resolve(mockInactiveUser));
      mockGetUserByIdUC.execute.and.returnValue(Promise.resolve(mockInactiveUser));

      // Act
      await facade.batchDeactivateUsers(userIds);

      // Assert
      expect(mockDeactivateUserUC.execute).toHaveBeenCalledTimes(3);
      userIds.forEach((userId) => {
        expect(mockDeactivateUserUC.execute).toHaveBeenCalledWith({ userId });
      });
    });

    it('should handle batch deactivation failure', async () => {
      // Arrange
      const userIds = [1, 2, 3];
      const error = new Error('Batch deactivation failed');
      mockDeactivateUserUC.execute.and.returnValue(Promise.reject(error));
      mockErrorTransformer.transform.and.returnValue({
        code: 'USER_DEACTIVATION_FAILED',
        message: 'Batch deactivation failed',
        userMessage: 'Failed to deactivate users',
      } as any);

      // Act & Assert
      await expectAsync(facade.batchDeactivateUsers(userIds)).toBeRejectedWith(error);
      expect(mockDeactivateUserUC.execute).toHaveBeenCalledWith({ userId: 1 });
      expect(mockDeactivateUserUC.execute).toHaveBeenCalledTimes(1); // Should stop on first failure
    });
  });

  describe('State Management', () => {
    it('should manage loading state correctly', async () => {
      // Arrange
      mockActivateUserUC.execute.and.returnValue(
        new Promise<void>((resolve) => setTimeout(() => resolve(), 100)).then(() => mockActiveUser)
      );
      mockGetUserByIdUC.execute.and.returnValue(Promise.resolve(mockActiveUser));

      // Act
      const promise = facade.activateUser(1);

      // Assert loading state during operation
      expect(facade.loading()).toBe(true);

      // Wait for completion
      await promise;
      expect(facade.loading()).toBe(false);
    });

    it('should clear error state on successful operation', async () => {
      // Arrange
      facade['_userError'].set('Previous error');
      mockActivateUserUC.execute.and.returnValue(Promise.resolve(mockActiveUser));
      mockGetUserByIdUC.execute.and.returnValue(Promise.resolve(mockActiveUser));

      // Act
      await facade.activateUser(1);

      // Assert
      expect(facade.error()).toBeNull();
    });
  });
});
