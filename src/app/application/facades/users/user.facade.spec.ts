/**
 * @fileoverview UsersFacade Test Suite
 *
 * Comprehensive test suite for UsersFacade covering all coordination operations,
 * delegation to specialized facades, and enhanced combination methods. Tests
 * follow MAD-AI testing guidelines with 95% coverage requirement.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { TestBed } from '@angular/core/testing';

// Application Layer Imports
import { UsersFacade } from './user.facade';
import type { FacadeOpts } from '@application/types/facade-opts';
import type {
  CreateUserRequest,
  CreateUserResult,
  UpdateUserRequest,
  UpdateUserResult,
  ListUsersRequest,
  ListUsersResult,
  UserSearchCriteria,
  UserLookupCriteria,
} from '@application/types/users.types';

// Domain Imports
import type { User } from '@domain/entities/user.entity';

// Domain Contracts Imports
import type {
  CreateUserContract,
  UpdateUserPatchContract,
} from '@domain/repositories/business/user.contract';

// Specialized Facade Imports
import { UserCrudFacade } from './user-crud.facade';
import { UserLookupFacade } from './user-lookup.facade';
import { UserListFacade } from './user-list.facade';
import { UserStateFacade } from './user-state.facade';
import { UserUtilsFacade } from './user-utils.facade';

// Use Cases Imports (for BaseUserFacade dependencies)
import { CreateUser } from '@application/use-cases/users/create-user.usecase';
import { UpdateUserUseCase } from '@application/use-cases/users/update-user.usecase';
import { DeleteUser } from '@application/use-cases/users/delete-user.usecase';
import { GetUserById } from '@application/use-cases/users/get-user-by-id.usecase';
import { GetUserByEmail } from '@application/use-cases/users/get-user-by-email.usecase';
import { GetUserByUsernameUseCase } from '@application/use-cases/users/get-user-by-username.usecase';
import { ListUsersUseCase } from '@application/use-cases/users/list-users.usecase';
import { ActivateUser } from '@application/use-cases/users/activate-user.usecase';
import { DeactivateUser } from '@application/use-cases/users/deactivate-user.usecase';

// Other Service Imports
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { NotificationsFacade } from '../notifications.facade';
import { AuthFacade } from '../auth.facade';

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

const mockCreateUserResult: CreateUserResult = mockUser1;
const mockUpdateUserResult: UpdateUserResult = mockUser1;
const mockListUsersResult: ListUsersResult = {
  users: [mockUser1, mockUser2],
  totalCount: 2,
};

describe('UsersFacade', () => {
  let facade: UsersFacade;
  let mockCrudFacade: jasmine.SpyObj<UserCrudFacade>;
  let mockLookupFacade: jasmine.SpyObj<UserLookupFacade>;
  let mockListFacade: jasmine.SpyObj<UserListFacade>;
  let mockStateFacade: jasmine.SpyObj<UserStateFacade>;
  let mockUtilsFacade: jasmine.SpyObj<UserUtilsFacade>;

  // Mock use cases for BaseUserFacade
  let mockCreateUser: jasmine.SpyObj<CreateUser>;
  let mockUpdateUser: jasmine.SpyObj<UpdateUserUseCase>;
  let mockDeleteUser: jasmine.SpyObj<DeleteUser>;
  let mockGetUserById: jasmine.SpyObj<GetUserById>;
  let mockGetUserByEmail: jasmine.SpyObj<GetUserByEmail>;
  let mockGetUserByUsername: jasmine.SpyObj<GetUserByUsernameUseCase>;
  let mockListUsers: jasmine.SpyObj<ListUsersUseCase>;
  let mockActivateUser: jasmine.SpyObj<ActivateUser>;
  let mockDeactivateUser: jasmine.SpyObj<DeactivateUser>;

  // Mock services for BaseUserFacade
  let mockErrorTransformer: jasmine.SpyObj<ApplicationErrorTransformer>;
  let mockNotifications: jasmine.SpyObj<NotificationsFacade>;
  let mockAuth: jasmine.SpyObj<AuthFacade>;

  beforeEach(() => {
    // Create spy objects for all specialized facades
    mockCrudFacade = jasmine.createSpyObj('UserCrudFacade', [
      'createUser',
      'updateUser',
      'deleteUser',
    ]);
    mockLookupFacade = jasmine.createSpyObj('UserLookupFacade', [
      'getUserById',
      'getUserByEmail',
      'getUserByUsername',
      'findUser',
    ]);
    mockListFacade = jasmine.createSpyObj('UserListFacade', ['listUsers', 'searchUsers']);
    mockStateFacade = jasmine.createSpyObj('UserStateFacade', [
      'activateUser',
      'deactivateUser',
      'toggleUserStatus',
      'batchActivateUsers',
      'batchDeactivateUsers',
    ]);
    mockUtilsFacade = jasmine.createSpyObj('UserUtilsFacade', [
      'selectUser',
      'clearSelection',
      'selectUserById',
      'clearError',
      'hasError',
      'reset',
      'refresh',
      'initialize',
      'getUserCountStats',
      'isLoading',
    ]);

    // Create spy objects for use cases
    mockCreateUser = jasmine.createSpyObj('CreateUser', ['execute']);
    mockUpdateUser = jasmine.createSpyObj('UpdateUserUseCase', ['execute']);
    mockDeleteUser = jasmine.createSpyObj('DeleteUser', ['execute']);
    mockGetUserById = jasmine.createSpyObj('GetUserById', ['execute']);
    mockGetUserByEmail = jasmine.createSpyObj('GetUserByEmail', ['execute']);
    mockGetUserByUsername = jasmine.createSpyObj('GetUserByUsernameUseCase', ['execute']);
    mockListUsers = jasmine.createSpyObj('ListUsersUseCase', ['execute']);
    mockActivateUser = jasmine.createSpyObj('ActivateUser', ['execute']);
    mockDeactivateUser = jasmine.createSpyObj('DeactivateUser', ['execute']);

    // Create spy objects for services
    mockErrorTransformer = jasmine.createSpyObj('ApplicationErrorTransformer', ['transform']);
    mockNotifications = jasmine.createSpyObj('NotificationsFacade', ['showSuccess', 'showError']);
    mockAuth = jasmine.createSpyObj('AuthFacade', ['getCurrentUser', 'getCurrentUserId']);

    TestBed.configureTestingModule({
      providers: [
        UsersFacade,
        { provide: UserCrudFacade, useValue: mockCrudFacade },
        { provide: UserLookupFacade, useValue: mockLookupFacade },
        { provide: UserListFacade, useValue: mockListFacade },
        { provide: UserStateFacade, useValue: mockStateFacade },
        { provide: UserUtilsFacade, useValue: mockUtilsFacade },
        // Provide use case mocks
        { provide: CreateUser, useValue: mockCreateUser },
        { provide: UpdateUserUseCase, useValue: mockUpdateUser },
        { provide: DeleteUser, useValue: mockDeleteUser },
        { provide: GetUserById, useValue: mockGetUserById },
        { provide: GetUserByEmail, useValue: mockGetUserByEmail },
        { provide: GetUserByUsernameUseCase, useValue: mockGetUserByUsername },
        { provide: ListUsersUseCase, useValue: mockListUsers },
        { provide: ActivateUser, useValue: mockActivateUser },
        { provide: DeactivateUser, useValue: mockDeactivateUser },
        // Provide service mocks
        { provide: ApplicationErrorTransformer, useValue: mockErrorTransformer },
        { provide: NotificationsFacade, useValue: mockNotifications },
        { provide: AuthFacade, useValue: mockAuth },
      ],
    });

    facade = TestBed.inject(UsersFacade);
  });

  describe('CRUD Operations Delegation', () => {
    describe('createUser', () => {
      it('should delegate to UserCrudFacade.createUser', async () => {
        const userData: CreateUserContract = {
          username: 'testuser',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          roleId: 1,
          isActive: true,
        };
        const request: CreateUserRequest = {
          userData,
          createdBy: 1,
          sendWelcomeNotification: true,
        };
        const opts: FacadeOpts = { skipLoading: true };

        mockCrudFacade.createUser.and.returnValue(
          Promise.resolve({
            success: true,
            data: mockCreateUserResult,
            message: 'Usuario creado exitosamente.',
          })
        );

        const result = await facade.createUser(request, opts);

        expect(mockCrudFacade.createUser).toHaveBeenCalledWith(request, opts);
        expect(result).toEqual({
          success: true,
          message: jasmine.any(String),
          data: mockCreateUserResult,
        });
      });
    });

    describe('updateUser', () => {
      it('should delegate to UserCrudFacade.updateUser', async () => {
        const updateData: UpdateUserPatchContract = {
          username: 'updateduser',
          email: 'updated@example.com',
        };
        const request: UpdateUserRequest = {
          userId: 1,
          updateData,
          requesterId: 1,
          notifyUser: true,
        };
        const opts: FacadeOpts = { skipLoading: true };

        mockCrudFacade.updateUser.and.returnValue(
          Promise.resolve({
            success: true,
            data: mockUpdateUserResult,
            message: 'Usuario actualizado exitosamente.',
          })
        );

        const result = await facade.updateUser(request, opts);

        expect(mockCrudFacade.updateUser).toHaveBeenCalledWith(request, opts);
        expect(result).toEqual({
          success: true,
          message: jasmine.any(String),
          data: mockUpdateUserResult,
        });
      });
    });

    describe('deleteUser', () => {
      it('should delegate to UserCrudFacade.deleteUser', async () => {
        const userId = 1;
        const opts: FacadeOpts = { skipLoading: true };

        mockCrudFacade.deleteUser.and.returnValue(
          Promise.resolve({ success: true, message: 'Usuario eliminado exitosamente.' })
        );

        await facade.deleteUser(userId, opts);

        expect(mockCrudFacade.deleteUser).toHaveBeenCalledWith(userId, opts);
      });
    });
  });

  describe('Lookup Operations Delegation', () => {
    describe('getUserById', () => {
      it('should delegate to UserLookupFacade.getUserById', async () => {
        const userId = 1;
        const opts: FacadeOpts = { skipLoading: true };

        mockLookupFacade.getUserById.and.returnValue(
          Promise.resolve({ success: true, message: 'Usuario encontrado.', data: mockUser1 })
        );

        const result = await facade.getUserById(userId, opts);

        expect(mockLookupFacade.getUserById).toHaveBeenCalledWith(userId, opts);
        expect(result).toEqual({ success: true, message: jasmine.any(String), data: mockUser1 });
      });

      it('should return null when user not found', async () => {
        const userId = 999;

        mockLookupFacade.getUserById.and.returnValue(
          Promise.resolve({ success: false, message: 'Usuario no encontrado.' })
        );

        const result = await facade.getUserById(userId);

        expect(result).toEqual({ success: false, message: jasmine.any(String) });
      });
    });

    describe('getUserByEmail', () => {
      it('should delegate to UserLookupFacade.getUserByEmail', async () => {
        const email = 'test@example.com';
        const opts: FacadeOpts = { skipLoading: true };

        mockLookupFacade.getUserByEmail.and.returnValue(
          Promise.resolve({ success: true, message: 'Usuario encontrado.', data: mockUser1 })
        );

        const result = await facade.getUserByEmail(email, opts);

        expect(mockLookupFacade.getUserByEmail).toHaveBeenCalledWith(email, opts);
        expect(result).toEqual({ success: true, message: jasmine.any(String), data: mockUser1 });
      });
    });

    describe('getUserByUsername', () => {
      it('should delegate to UserLookupFacade.getUserByUsername', async () => {
        const username = 'testuser';
        const opts: FacadeOpts = { skipLoading: true };

        mockLookupFacade.getUserByUsername.and.returnValue(
          Promise.resolve({ success: true, message: 'Usuario encontrado.', data: mockUser1 })
        );

        const result = await facade.getUserByUsername(username, opts);

        expect(mockLookupFacade.getUserByUsername).toHaveBeenCalledWith(username, opts);
        expect(result).toEqual({ success: true, message: jasmine.any(String), data: mockUser1 });
      });
    });

    describe('findUser', () => {
      it('should delegate to UserLookupFacade.findUser', async () => {
        const criteria: UserLookupCriteria = { id: 1 };
        const opts: FacadeOpts = { skipLoading: true };

        mockLookupFacade.findUser.and.returnValue(
          Promise.resolve({ success: true, message: 'Usuario encontrado.', data: mockUser1 })
        );

        const result = await facade.findUser(criteria, opts);

        expect(mockLookupFacade.findUser).toHaveBeenCalledWith(criteria, opts);
        expect(result).toEqual({ success: true, message: jasmine.any(String), data: mockUser1 });
      });
    });
  });

  describe('List Operations Delegation', () => {
    describe('listUsers', () => {
      it('should delegate to UserListFacade.listUsers', async () => {
        const request: ListUsersRequest = {
          filter: { isActive: true },
          requesterId: 1,
        };
        const opts: FacadeOpts = { skipLoading: true };

        mockListFacade.listUsers.and.returnValue(
          Promise.resolve({
            success: true,
            message: 'Usuarios listados.',
            data: mockListUsersResult,
          })
        );

        const result = await facade.listUsers(request, opts);

        expect(mockListFacade.listUsers).toHaveBeenCalledWith(request, opts);
        expect(result).toEqual({
          success: true,
          message: jasmine.any(String),
          data: mockListUsersResult,
        });
      });

      it('should call without request parameter', async () => {
        mockListFacade.listUsers.and.returnValue(
          Promise.resolve({
            success: true,
            message: 'Usuarios listados.',
            data: mockListUsersResult,
          })
        );

        const result = await facade.listUsers();

        expect(mockListFacade.listUsers).toHaveBeenCalledWith(undefined, undefined);
        expect(result).toEqual({
          success: true,
          message: jasmine.any(String),
          data: mockListUsersResult,
        });
      });
    });

    describe('searchUsers', () => {
      it('should delegate to UserListFacade.searchUsers', async () => {
        const criteria: UserSearchCriteria = { query: 'test' };
        const opts: FacadeOpts = { skipLoading: true };

        mockListFacade.searchUsers.and.returnValue(
          Promise.resolve({
            success: true,
            message: 'Usuarios encontrados.',
            data: mockListUsersResult,
          })
        );

        const result = await facade.searchUsers(criteria, opts);

        expect(mockListFacade.searchUsers).toHaveBeenCalledWith(criteria, opts);
        expect(result).toEqual({
          success: true,
          message: jasmine.any(String),
          data: mockListUsersResult,
        });
      });
    });
  });

  describe('State Operations Delegation', () => {
    describe('activateUser', () => {
      it('should delegate to UserStateFacade.activateUser', async () => {
        const userId = 1;
        const opts: FacadeOpts = { skipLoading: true };

        mockStateFacade.activateUser.and.returnValue(
          Promise.resolve({ success: true, message: 'Usuario activado.' })
        );

        await facade.activateUser(userId, opts);

        expect(mockStateFacade.activateUser).toHaveBeenCalledWith(userId, opts);
      });
    });

    describe('deactivateUser', () => {
      it('should delegate to UserStateFacade.deactivateUser', async () => {
        const userId = 1;
        const opts: FacadeOpts = { skipLoading: true };

        mockStateFacade.deactivateUser.and.returnValue(
          Promise.resolve({ success: true, message: 'Usuario desactivado.' })
        );

        await facade.deactivateUser(userId, opts);

        expect(mockStateFacade.deactivateUser).toHaveBeenCalledWith(userId, opts);
      });
    });

    describe('toggleUserStatus', () => {
      it('should delegate to UserStateFacade.toggleUserStatus', async () => {
        const userId = 1;
        const opts: FacadeOpts = { skipLoading: true };

        mockStateFacade.toggleUserStatus.and.returnValue(
          Promise.resolve({ success: true, message: 'Estado de usuario cambiado.' })
        );

        await facade.toggleUserStatus(userId, opts);

        expect(mockStateFacade.toggleUserStatus).toHaveBeenCalledWith(userId, opts);
      });
    });

    describe('activateUsers', () => {
      it('should delegate to UserStateFacade.batchActivateUsers', async () => {
        const userIds = [1, 2, 3];
        const opts: FacadeOpts = { skipLoading: true };

        mockStateFacade.batchActivateUsers.and.returnValue(
          Promise.resolve({ success: true, message: 'Usuarios activados.' })
        );

        await facade.activateUsers(userIds, opts);

        expect(mockStateFacade.batchActivateUsers).toHaveBeenCalledWith(userIds, opts);
      });
    });

    describe('deactivateUsers', () => {
      it('should delegate to UserStateFacade.batchDeactivateUsers', async () => {
        const userIds = [1, 2, 3];
        const opts: FacadeOpts = { skipLoading: true };

        mockStateFacade.batchDeactivateUsers.and.returnValue(
          Promise.resolve({ success: true, message: 'Usuarios desactivados.' })
        );

        await facade.deactivateUsers(userIds, opts);

        expect(mockStateFacade.batchDeactivateUsers).toHaveBeenCalledWith(userIds, opts);
      });
    });
  });

  describe('Utility Operations Delegation', () => {
    describe('selectUser', () => {
      it('should delegate to UserUtilsFacade.selectUser', () => {
        facade.selectUser(mockUser1);

        expect(mockUtilsFacade.selectUser).toHaveBeenCalledWith(mockUser1);
      });
    });

    describe('clearSelection', () => {
      it('should delegate to UserUtilsFacade.clearSelection', () => {
        facade.clearSelection();

        expect(mockUtilsFacade.clearSelection).toHaveBeenCalled();
      });
    });

    describe('selectUserById', () => {
      it('should delegate to UserUtilsFacade.selectUserById', () => {
        const userId = 1;
        mockUtilsFacade.selectUserById.and.returnValue({
          success: true,
          message: 'Usuario seleccionado.',
        });

        const result = facade.selectUserById(userId);

        expect(mockUtilsFacade.selectUserById).toHaveBeenCalledWith(userId);
        expect(result).toEqual({ success: true, message: jasmine.any(String) });
      });
    });

    describe('clearError', () => {
      it('should delegate to UserUtilsFacade.clearError', () => {
        facade.clearError();

        expect(mockUtilsFacade.clearError).toHaveBeenCalled();
      });
    });

    describe('hasError', () => {
      it('should delegate to UserUtilsFacade.hasError', () => {
        mockUtilsFacade.hasError.and.returnValue({ success: false, message: 'No error.' });

        const result = facade.hasError();

        expect(mockUtilsFacade.hasError).toHaveBeenCalled();
        expect(result).toEqual({ success: false, message: jasmine.any(String) });
      });
    });

    describe('reset', () => {
      it('should delegate to UserUtilsFacade.reset', () => {
        facade.reset();

        expect(mockUtilsFacade.reset).toHaveBeenCalled();
      });
    });

    describe('refresh', () => {
      it('should delegate to UserUtilsFacade.refresh', async () => {
        const opts: FacadeOpts = { skipLoading: true };

        mockUtilsFacade.refresh.and.returnValue(
          Promise.resolve({ success: true, message: 'Refrescado.' })
        );

        await facade.refresh(opts);

        expect(mockUtilsFacade.refresh).toHaveBeenCalledWith(opts);
      });
    });

    describe('initialize', () => {
      it('should delegate to UserUtilsFacade.initialize', async () => {
        const opts: FacadeOpts = { skipLoading: true };

        mockUtilsFacade.initialize.and.returnValue(
          Promise.resolve({ success: true, message: 'Inicializado.' })
        );

        await facade.initialize(opts);

        expect(mockUtilsFacade.initialize).toHaveBeenCalledWith(opts);
      });
    });

    describe('getUserCountStats', () => {
      it('should delegate to UserUtilsFacade.getUserCountStats', () => {
        const expectedStats = { total: 2, active: 1, inactive: 1 };
        mockUtilsFacade.getUserCountStats.and.returnValue(expectedStats);

        const result = facade.getUserCountStats();

        expect(mockUtilsFacade.getUserCountStats).toHaveBeenCalled();
        expect(result).toBe(expectedStats);
      });
    });

    describe('isLoading', () => {
      it('should delegate to UserUtilsFacade.isLoading', () => {
        mockUtilsFacade.isLoading.and.returnValue(true);

        const result = facade.isLoading();

        expect(mockUtilsFacade.isLoading).toHaveBeenCalled();
        expect(result).toBe(true);
      });
    });
  });

  describe('Enhanced Operations', () => {
    describe('createAndSelectUser', () => {
      it('should create user and select the result', async () => {
        const userData: CreateUserContract = {
          username: 'testuser',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          roleId: 1,
          isActive: true,
        };
        const request: CreateUserRequest = {
          userData,
          createdBy: 1,
          sendWelcomeNotification: true,
        };
        const opts: FacadeOpts = { skipLoading: true };

        mockCrudFacade.createUser.and.returnValue(
          Promise.resolve({
            success: true,
            data: mockCreateUserResult,
            message: 'Usuario creado exitosamente.',
          })
        );

        const result = await facade.createAndSelectUser(request, opts);

        expect(mockCrudFacade.createUser).toHaveBeenCalledWith(request, opts);
        expect(mockUtilsFacade.selectUser).toHaveBeenCalledWith(mockCreateUserResult);
        expect(result).toEqual({
          success: true,
          message: jasmine.any(String),
          data: mockCreateUserResult,
        });
      });
    });

    describe('updateAndSelectUser', () => {
      it('should update user and select the result', async () => {
        const updateData: UpdateUserPatchContract = {
          username: 'updateduser',
          email: 'updated@example.com',
        };
        const request: UpdateUserRequest = {
          userId: 1,
          updateData,
          requesterId: 1,
          notifyUser: true,
        };
        const opts: FacadeOpts = { skipLoading: true };

        mockCrudFacade.updateUser.and.returnValue(
          Promise.resolve({
            success: true,
            data: mockUpdateUserResult,
            message: 'Usuario actualizado exitosamente.',
          })
        );

        const result = await facade.updateAndSelectUser(request, opts);

        expect(mockCrudFacade.updateUser).toHaveBeenCalledWith(request, opts);
        expect(mockUtilsFacade.selectUser).toHaveBeenCalledWith(mockUpdateUserResult);
        expect(result).toEqual({
          success: true,
          message: jasmine.any(String),
          data: mockUpdateUserResult,
        });
      });
    });

    describe('deleteSelectedUser', () => {
      it('should delete selected user and clear selection', async () => {
        // Set up selected user
        facade['_selectedUser'].set(mockUser1);
        const opts: FacadeOpts = { skipLoading: true };

        mockCrudFacade.deleteUser.and.returnValue(
          Promise.resolve({ success: true, message: 'Usuario eliminado exitosamente.' })
        );

        await facade.deleteSelectedUser(opts);

        expect(mockCrudFacade.deleteUser).toHaveBeenCalledWith(mockUser1.id, opts);
        expect(mockUtilsFacade.clearSelection).toHaveBeenCalled();
      });

      it('should throw error when no user is selected', async () => {
        // Clear selection
        facade['_selectedUser'].set(null);

        await expectAsync(facade.deleteSelectedUser()).toBeRejectedWith(
          new Error('No user selected for deletion')
        );

        expect(mockCrudFacade.deleteUser).not.toHaveBeenCalled();
        expect(mockUtilsFacade.clearSelection).not.toHaveBeenCalled();
      });
    });
  });

  describe('State Inheritance from BaseUserFacade', () => {
    it('should inherit users signal from BaseUserFacade', () => {
      facade['_users'].set([mockUser1]);

      expect(facade.users()).toEqual([mockUser1]);
    });

    it('should inherit selectedUser signal from BaseUserFacade', () => {
      facade['_selectedUser'].set(mockUser1);

      expect(facade.selectedUser()).toBe(mockUser1);
    });

    it('should inherit loading signal from BaseUserFacade', () => {
      facade['_loading'].set(true);

      expect(facade.loading()).toBe(true);
    });

    it('should inherit error signal from BaseUserFacade', () => {
      const errorMessage = 'Test error';
      facade['_userError'].set(errorMessage);

      expect(facade.error()).toBe(errorMessage);
    });
  });
});
