/**
 * @fileoverview UserUtilsFacade Test Suite
 *
 * Comprehensive test suite for UserUtilsFacade covering all utility operations
 * including user selection management, error state management, facade state
 * management, and convenience methods. Tests follow MAD-AI testing guidelines
 * with 95% coverage requirement.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { TestBed } from '@angular/core/testing';

// Application Layer Imports
import { UserUtilsFacade } from './user-utils.facade';
import type { FacadeOpts } from '@application/types/facade-opts';
import type { ListUsersRequest, ListUsersResult } from '@application/types/users.types';

// Domain Imports
import type { User } from '@domain/entities/user.entity';

// Use Case Imports
import { ListUsersUseCase } from '@application/use-cases/users/list-users.usecase';
import { CreateUser } from '@application/use-cases/users/create-user.usecase';
import { UpdateUserUseCase } from '@application/use-cases/users/update-user.usecase';
import { DeleteUser } from '@application/use-cases/users/delete-user.usecase';
import { GetUserById } from '@application/use-cases/users/get-user-by-id.usecase';
import { GetUserByEmail } from '@application/use-cases/users/get-user-by-email.usecase';
import { GetUserByUsernameUseCase } from '@application/use-cases/users/get-user-by-username.usecase';
import { ActivateUser } from '@application/use-cases/users/activate-user.usecase';
import { DeactivateUser } from '@application/use-cases/users/deactivate-user.usecase';

// Service Imports
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import { NotificationsFacade } from '../notifications.facade';
import { AuthFacade } from '../auth.facade';

// Infrastructure Imports
import { USER_REPOSITORY, LOGGER_PORT, CLOCK_PORT } from '@di/tokens';

// Mock Data - Simplified mocks for testing
const mockUser1: User = {
  id: 1,
  active: true,
  canDeleteUsers: () => false,
  getPermissions: () => [],
} as unknown as User;

const mockUser2: User = {
  id: 2,
  active: false,
  canDeleteUsers: () => true,
  getPermissions: () => ['admin'],
} as unknown as User;

const mockUser3: User = {
  id: 3,
  active: true,
  canDeleteUsers: () => false,
  getPermissions: () => ['user'],
} as unknown as User;

const mockUsers = [mockUser1, mockUser2, mockUser3];

const mockListUsersResult: ListUsersResult = {
  users: mockUsers,
  totalCount: 3,
};

describe('UserUtilsFacade', () => {
  let facade: UserUtilsFacade;
  let mockListUsersUC: jasmine.SpyObj<ListUsersUseCase>;
  let mockCreateUserUC: jasmine.SpyObj<CreateUser>;
  let mockUpdateUserUC: jasmine.SpyObj<UpdateUserUseCase>;
  let mockDeleteUserUC: jasmine.SpyObj<DeleteUser>;
  let mockGetUserByIdUC: jasmine.SpyObj<GetUserById>;
  let mockGetUserByEmailUC: jasmine.SpyObj<GetUserByEmail>;
  let mockGetUserByUsernameUC: jasmine.SpyObj<GetUserByUsernameUseCase>;
  let mockActivateUserUC: jasmine.SpyObj<ActivateUser>;
  let mockDeactivateUserUC: jasmine.SpyObj<DeactivateUser>;
  let mockErrorTransformer: jasmine.SpyObj<ApplicationErrorTransformer>;
  let mockNotifications: jasmine.SpyObj<NotificationsFacade>;
  let mockAuth: jasmine.SpyObj<AuthFacade>;

  beforeEach(() => {
    // Create spy objects for all dependencies
    mockListUsersUC = jasmine.createSpyObj('ListUsersUseCase', ['execute']);
    mockCreateUserUC = jasmine.createSpyObj('CreateUser', ['execute']);
    mockUpdateUserUC = jasmine.createSpyObj('UpdateUserUseCase', ['execute']);
    mockDeleteUserUC = jasmine.createSpyObj('DeleteUser', ['execute']);
    mockGetUserByIdUC = jasmine.createSpyObj('GetUserById', ['execute']);
    mockGetUserByEmailUC = jasmine.createSpyObj('GetUserByEmail', ['execute']);
    mockGetUserByUsernameUC = jasmine.createSpyObj('GetUserByUsernameUseCase', ['execute']);
    mockActivateUserUC = jasmine.createSpyObj('ActivateUser', ['execute']);
    mockDeactivateUserUC = jasmine.createSpyObj('DeactivateUser', ['execute']);
    mockErrorTransformer = jasmine.createSpyObj('ApplicationErrorTransformer', ['transform']);
    mockNotifications = jasmine.createSpyObj('NotificationsFacade', ['showSuccess', 'showError']);
    mockAuth = jasmine.createSpyObj('AuthFacade', ['getCurrentUser', 'isAuthenticated'], {
      user: jasmine.createSpy('user').and.returnValue({ id: 1, username: 'testuser' }),
    });

    TestBed.configureTestingModule({
      providers: [
        UserUtilsFacade,
        { provide: ListUsersUseCase, useValue: mockListUsersUC },
        { provide: CreateUser, useValue: mockCreateUserUC },
        { provide: UpdateUserUseCase, useValue: mockUpdateUserUC },
        { provide: DeleteUser, useValue: mockDeleteUserUC },
        { provide: GetUserById, useValue: mockGetUserByIdUC },
        { provide: GetUserByEmail, useValue: mockGetUserByEmailUC },
        { provide: GetUserByUsernameUseCase, useValue: mockGetUserByUsernameUC },
        { provide: ActivateUser, useValue: mockActivateUserUC },
        { provide: DeactivateUser, useValue: mockDeactivateUserUC },
        { provide: ApplicationErrorTransformer, useValue: mockErrorTransformer },
        { provide: NotificationsFacade, useValue: mockNotifications },
        { provide: AuthFacade, useValue: mockAuth },
        { provide: USER_REPOSITORY, useValue: {} },
        {
          provide: LOGGER_PORT,
          useValue: { info: () => {}, error: () => {}, warn: () => {}, debug: () => {} },
        },
        { provide: CLOCK_PORT, useValue: { now: () => new Date() } },
      ],
    });

    facade = TestBed.inject(UserUtilsFacade);
  });

  afterEach(() => {
    // Reset facade state between tests
    facade['reset']();
  });

  describe('User Selection Management', () => {
    describe('selectUser', () => {
      it('should select a user and emit event', () => {
        // Arrange
        spyOn(facade as any, 'emitEvent');

        // Act
        facade.selectUser(mockUser1);

        // Assert
        expect(facade['_selectedUser']()).toBe(mockUser1);
        expect((facade as any).emitEvent).toHaveBeenCalledWith({
          type: 'bulk-operation-completed',
          operation: 'user-selection',
          results: { selectedUser: mockUser1 },
        });
      });

      it('should clear selection when passed null', () => {
        // Arrange
        facade.selectUser(mockUser1);
        spyOn(facade as any, 'emitEvent');

        // Act
        facade.selectUser(null);

        // Assert
        expect(facade['_selectedUser']()).toBeNull();
        expect((facade as any).emitEvent).toHaveBeenCalledWith({
          type: 'bulk-operation-completed',
          operation: 'user-selection',
          results: { selectedUser: null },
        });
      });
    });

    describe('clearSelection', () => {
      it('should clear user selection', () => {
        // Arrange
        facade.selectUser(mockUser1);
        spyOn(facade as any, 'emitEvent');

        // Act
        facade.clearSelection();

        // Assert
        expect(facade['_selectedUser']()).toBeNull();
        expect((facade as any).emitEvent).toHaveBeenCalledWith({
          type: 'bulk-operation-completed',
          operation: 'user-selection',
          results: { selectedUser: null },
        });
      });
    });

    describe('selectUserById', () => {
      beforeEach(() => {
        facade['_users'].set(mockUsers);
      });

      it('should select user by ID when found', () => {
        // Arrange
        spyOn(facade as any, 'emitEvent');

        // Act
        const result = facade.selectUserById(1);

        // Assert
        expect(result).toEqual({
          success: true,
          message: 'User selected',
          error: undefined,
          data: mockUser1,
        });
        expect(facade['_selectedUser']()).toBe(mockUser1);
        expect((facade as any).emitEvent).toHaveBeenCalledWith({
          type: 'bulk-operation-completed',
          operation: 'user-selection',
          results: { selectedUser: mockUser1 },
        });
      });

      it('should return false and clear selection when user not found', () => {
        // Arrange
        spyOn(facade as any, 'emitEvent');

        // Act
        const result = facade.selectUserById(999);

        // Assert
        expect(result).toEqual({
          success: false,
          message: 'User not found',
          error: undefined,
          data: null,
        });
        expect(facade['_selectedUser']()).toBeNull();
        expect((facade as any).emitEvent).toHaveBeenCalledWith({
          type: 'bulk-operation-completed',
          operation: 'user-selection',
          results: { selectedUser: null },
        });
      });
    });
  });

  describe('Error State Management', () => {
    describe('clearError', () => {
      it('should clear error state', () => {
        // Arrange
        facade['_userError'].set('Test error message');

        // Act
        facade.clearError();

        // Assert
        expect(facade['_userError']()).toBeNull();
      });
    });

    describe('hasError', () => {
      it('should return true when there is an error', () => {
        // Arrange
        facade['_userError'].set('Test error message');

        // Act & Assert
        expect(facade.hasError()).toEqual({
          success: true,
          message: 'Error exists',
          error: 'Test error message',
        });
      });

      it('should return false when there is no error', () => {
        // Arrange
        facade['_userError'].set(null);

        // Act & Assert
        expect(facade.hasError()).toEqual({
          success: false,
          message: 'No error',
          error: undefined,
        });
      });
    });
  });

  describe('Facade State Management', () => {
    describe('reset', () => {
      it('should reset all facade state to initial values', () => {
        // Arrange
        facade['_users'].set(mockUsers);
        facade['_selectedUser'].set(mockUser1);
        facade['_loading'].set(true);
        facade['_userError'].set('Test error');
        facade['_currentFilter'].set(null);
        facade['_totalCount'].set(10);
        facade['_lastBulkOperation'].set({ type: null, result: null });

        // Act
        facade.reset();

        // Assert
        expect(facade['_users']()).toEqual([]);
        expect(facade['_selectedUser']()).toBeNull();
        expect(facade['_loading']()).toBe(false);
        expect(facade['_userError']()).toBeNull();
        expect(facade['_currentFilter']()).toBeNull();
        expect(facade['_totalCount']()).toBe(0);
        expect(facade['_lastBulkOperation']()).toEqual({ type: null, result: null });
      });
    });

    describe('refresh', () => {
      it('should refresh user list with current filter', async () => {
        // Arrange
        facade['_currentFilter'].set(null);
        mockListUsersUC.execute.and.returnValue(Promise.resolve(mockListUsersResult));
        spyOn(facade as any, 'emitEvent');
        spyOn(facade as any, 'getCurrentUserId').and.returnValue(1);

        // Act
        await facade.refresh();

        // Assert
        expect(mockListUsersUC.execute).toHaveBeenCalledWith({
          requesterId: 1,
        });
        expect(facade['_users']()).toEqual(mockUsers);
        expect(facade['_totalCount']()).toBe(3);
        expect((facade as any).emitEvent).toHaveBeenCalledWith({
          type: 'bulk-operation-completed',
          operation: 'refresh-users',
          results: mockListUsersResult,
        });
      });

      it('should refresh user list without filter when none set', async () => {
        // Arrange
        facade['_currentFilter'].set(null);
        mockListUsersUC.execute.and.returnValue(Promise.resolve(mockListUsersResult));
        spyOn(facade as any, 'emitEvent');
        spyOn(facade as any, 'getCurrentUserId').and.returnValue(1);

        // Act
        await facade.refresh();

        // Assert
        expect(mockListUsersUC.execute).toHaveBeenCalledWith({
          requesterId: 1,
        });
        expect(facade['_users']()).toEqual(mockUsers);
        expect(facade['_totalCount']()).toBe(3);
      });

      it('should handle refresh errors', async () => {
        // Arrange
        const error = new Error('Refresh failed');
        const transformedError = new ApplicationError(
          ApplicationErrorCode.UNEXPECTED_ERROR,
          'Technical error message',
          'User-friendly error message'
        );
        mockListUsersUC.execute.and.returnValue(Promise.reject(error));
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(facade.refresh()).toBeRejectedWith(error);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(error);
        expect(facade['_userError']()).toBe(transformedError.userMessage);
      });

      it('should respect skipLoading option', async () => {
        // Arrange
        mockListUsersUC.execute.and.returnValue(Promise.resolve(mockListUsersResult));
        spyOn(facade as any, 'getCurrentUserId').and.returnValue(1);

        // Act
        await facade.refresh({ skipLoading: true });

        // Assert
        expect(mockListUsersUC.execute).toHaveBeenCalledWith({
          requesterId: 1,
        });
      });
    });

    describe('initialize', () => {
      it('should reset state and refresh data', async () => {
        // Arrange
        facade['_users'].set([mockUser1]); // Set some initial state
        mockListUsersUC.execute.and.returnValue(Promise.resolve(mockListUsersResult));

        // Act
        await facade.initialize();

        // Assert
        expect(mockListUsersUC.execute).toHaveBeenCalledWith({
          requesterId: 1,
        });
        expect(facade['_users']()).toEqual(mockUsers); // Should be populated after refresh
      });

      it('should handle initialization errors', async () => {
        // Arrange
        const error = new Error('Initialization failed');
        const transformedError = new ApplicationError(
          ApplicationErrorCode.UNEXPECTED_ERROR,
          'Technical error message',
          'User-friendly error message'
        );
        mockListUsersUC.execute.and.returnValue(Promise.reject(error));
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(facade.initialize()).toBeRejectedWith(error);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(error);
        expect(facade['_userError']()).toBe(transformedError.userMessage);
      });
    });
  });

  describe('Convenience Methods', () => {
    describe('getUserCountStats', () => {
      it('should return correct statistics for mixed active/inactive users', () => {
        // Arrange
        facade['_users'].set(mockUsers); // 2 active, 1 inactive

        // Act
        const stats = facade.getUserCountStats();

        // Assert
        expect(stats.total).toBe(3);
        expect(stats.active).toBe(2);
        expect(stats.inactive).toBe(1);
      });

      it('should return zero statistics for empty user list', () => {
        // Arrange
        facade['_users'].set([]);

        // Act
        const stats = facade.getUserCountStats();

        // Assert
        expect(stats.total).toBe(0);
        expect(stats.active).toBe(0);
        expect(stats.inactive).toBe(0);
      });

      it('should return all inactive when no active users', () => {
        // Arrange
        const inactiveUsers = [mockUser2]; // mockUser2 is inactive
        facade['_users'].set(inactiveUsers);

        // Act
        const stats = facade.getUserCountStats();

        // Assert
        expect(stats.total).toBe(1);
        expect(stats.active).toBe(0);
        expect(stats.inactive).toBe(1);
      });

      it('should return all active when no inactive users', () => {
        // Arrange
        const activeUsers = [mockUser1, mockUser3]; // mockUser1 and mockUser3 are active
        facade['_users'].set(activeUsers);

        // Act
        const stats = facade.getUserCountStats();

        // Assert
        expect(stats.total).toBe(2);
        expect(stats.active).toBe(2);
        expect(stats.inactive).toBe(0);
      });
    });

    describe('isLoading', () => {
      it('should return true when loading is active', () => {
        // Arrange
        facade['_loading'].set(true);

        // Act & Assert
        expect(facade.isLoading()).toBe(true);
      });

      it('should return false when loading is inactive', () => {
        // Arrange
        facade['_loading'].set(false);

        // Act & Assert
        expect(facade.isLoading()).toBe(false);
      });
    });
  });
});
