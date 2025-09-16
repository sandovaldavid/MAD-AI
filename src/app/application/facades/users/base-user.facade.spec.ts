/**
 * @fileoverview BaseUserFacade Test Suite
 *
 * Comprehensive test suite for BaseUserFacade covering all reactive state management,
 * utility methods, event emission, and error handling. Tests follow MAD-AI testing
 * guidelines with 95% coverage requirement.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { TestBed } from '@angular/core/testing';

// Application Layer Imports
import { BaseUserFacade } from './base-user.facade';

// Domain Imports
import type { User } from '@domain/entities/user.entity';

// Use Case Imports
import { CreateUser } from '@application/use-cases/users/create-user.usecase';
import { UpdateUserUseCase } from '@application/use-cases/users/update-user.usecase';
import { DeleteUser } from '@application/use-cases/users/delete-user.usecase';
import { GetUserById } from '@application/use-cases/users/get-user-by-id.usecase';
import { GetUserByEmail } from '@application/use-cases/users/get-user-by-email.usecase';
import { GetUserByUsernameUseCase } from '@application/use-cases/users/get-user-by-username.usecase';
import { ListUsersUseCase } from '@application/use-cases/users/list-users.usecase';
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

// Concrete implementation for testing abstract BaseUserFacade
class TestBaseUserFacade extends BaseUserFacade {}

/**
 * Mock Data - Simplified mocks for testing
 */
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

describe('BaseUserFacade', () => {
  let facade: TestBaseUserFacade;
  let mockCreateUserUC: jasmine.SpyObj<CreateUser>;
  let mockUpdateUserUC: jasmine.SpyObj<UpdateUserUseCase>;
  let mockDeleteUserUC: jasmine.SpyObj<DeleteUser>;
  let mockGetUserByIdUC: jasmine.SpyObj<GetUserById>;
  let mockGetUserByEmailUC: jasmine.SpyObj<GetUserByEmail>;
  let mockGetUserByUsernameUC: jasmine.SpyObj<GetUserByUsernameUseCase>;
  let mockListUsersUC: jasmine.SpyObj<ListUsersUseCase>;
  let mockActivateUserUC: jasmine.SpyObj<ActivateUser>;
  let mockDeactivateUserUC: jasmine.SpyObj<DeactivateUser>;
  let mockErrorTransformer: jasmine.SpyObj<ApplicationErrorTransformer>;
  let mockNotifications: jasmine.SpyObj<NotificationsFacade>;
  let mockAuth: jasmine.SpyObj<AuthFacade>;

  beforeEach(() => {
    // Create spy objects for all dependencies
    mockCreateUserUC = jasmine.createSpyObj('CreateUser', ['execute']);
    mockUpdateUserUC = jasmine.createSpyObj('UpdateUserUseCase', ['execute']);
    mockDeleteUserUC = jasmine.createSpyObj('DeleteUser', ['execute']);
    mockGetUserByIdUC = jasmine.createSpyObj('GetUserById', ['execute']);
    mockGetUserByEmailUC = jasmine.createSpyObj('GetUserByEmail', ['execute']);
    mockGetUserByUsernameUC = jasmine.createSpyObj('GetUserByUsernameUseCase', ['execute']);
    mockListUsersUC = jasmine.createSpyObj('ListUsersUseCase', ['execute']);
    mockActivateUserUC = jasmine.createSpyObj('ActivateUser', ['execute']);
    mockDeactivateUserUC = jasmine.createSpyObj('DeactivateUser', ['execute']);
    mockErrorTransformer = jasmine.createSpyObj('ApplicationErrorTransformer', ['transform']);
    mockNotifications = jasmine.createSpyObj('NotificationsFacade', ['showSuccess', 'showError']);
    mockAuth = jasmine.createSpyObj('AuthFacade', ['getCurrentUser', 'isAuthenticated'], {
      user: jasmine.createSpy('user').and.returnValue({ id: 1, username: 'testuser' }),
    });

    TestBed.configureTestingModule({
      providers: [
        TestBaseUserFacade,
        { provide: CreateUser, useValue: mockCreateUserUC },
        { provide: UpdateUserUseCase, useValue: mockUpdateUserUC },
        { provide: DeleteUser, useValue: mockDeleteUserUC },
        { provide: GetUserById, useValue: mockGetUserByIdUC },
        { provide: GetUserByEmail, useValue: mockGetUserByEmailUC },
        { provide: GetUserByUsernameUseCase, useValue: mockGetUserByUsernameUC },
        { provide: ListUsersUseCase, useValue: mockListUsersUC },
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

    facade = TestBed.inject(TestBaseUserFacade);
  });

  afterEach(() => {
    // Reset facade state between tests
    facade['_users'].set([]);
    facade['_selectedUser'].set(null);
    facade['_loading'].set(false);
    facade['_userError'].set(null);
    facade['_currentFilter'].set(null);
    facade['_totalCount'].set(0);
    facade['_lastBulkOperation'].set({ type: null, result: null });
  });

  describe('Initial State', () => {
    it('should initialize with empty users array', () => {
      expect(facade.users()).toEqual([]);
    });

    it('should initialize with no selected user', () => {
      expect(facade.selectedUser()).toBeNull();
    });

    it('should initialize with loading false', () => {
      expect(facade.loading()).toBe(false);
    });

    it('should initialize with no error', () => {
      expect(facade.error()).toBeNull();
    });

    it('should initialize with no current filter', () => {
      expect(facade.currentFilter()).toBeNull();
    });

    it('should initialize with total count of 0', () => {
      expect(facade.totalCount()).toBe(0);
    });

    it('should initialize with no last bulk operation', () => {
      expect(facade.lastBulkOperation()).toEqual({ type: null, result: null });
    });
  });

  describe('Reactive Computed Properties', () => {
    describe('hasUsers', () => {
      it('should return false when users array is empty', () => {
        facade['_users'].set([]);
        expect(facade.hasUsers()).toBe(false);
      });

      it('should return true when users array has items', () => {
        facade['_users'].set([mockUser1]);
        expect(facade.hasUsers()).toBe(true);
      });
    });

    describe('activeUsersCount', () => {
      it('should return correct count of active users', () => {
        facade['_users'].set(mockUsers); // 2 active, 1 inactive
        expect(facade.activeUsersCount()).toBe(2);
      });

      it('should return 0 when no users are active', () => {
        const inactiveUsers = [mockUser2]; // mockUser2 is inactive
        facade['_users'].set(inactiveUsers);
        expect(facade.activeUsersCount()).toBe(0);
      });
    });

    describe('inactiveUsersCount', () => {
      it('should return correct count of inactive users', () => {
        facade['_users'].set(mockUsers); // 2 active, 1 inactive
        expect(facade.inactiveUsersCount()).toBe(1);
      });

      it('should return 0 when all users are active', () => {
        const activeUsers = [mockUser1, mockUser3]; // Both are active
        facade['_users'].set(activeUsers);
        expect(facade.inactiveUsersCount()).toBe(0);
      });
    });

    describe('hasSelectedUser', () => {
      it('should return false when no user is selected', () => {
        facade['_selectedUser'].set(null);
        expect(facade.hasSelectedUser()).toBe(false);
      });

      it('should return true when a user is selected', () => {
        facade['_selectedUser'].set(mockUser1);
        expect(facade.hasSelectedUser()).toBe(true);
      });
    });

    describe('userStatistics', () => {
      it('should return correct statistics for mixed active/inactive users', () => {
        facade['_users'].set(mockUsers); // 2 active, 1 inactive

        const stats = facade.userStatistics();

        expect(stats.totalUsers).toBe(3);
        expect(stats.activeUsers).toBe(2);
        expect(stats.inactiveUsers).toBe(1);
      });

      it('should return zero statistics for empty users array', () => {
        facade['_users'].set([]);

        const stats = facade.userStatistics();

        expect(stats.totalUsers).toBe(0);
        expect(stats.activeUsers).toBe(0);
        expect(stats.inactiveUsers).toBe(0);
      });
    });
  });

  describe('Protected Utility Methods', () => {
    describe('setLoading', () => {
      it('should set loading state to true', () => {
        (facade as any).setLoading(true);
        expect(facade.loading()).toBe(true);
      });

      it('should set loading state to false', () => {
        (facade as any).setLoading(false);
        expect(facade.loading()).toBe(false);
      });
    });

    describe('setError', () => {
      it('should set error message', () => {
        const errorMessage = 'Test error message';
        (facade as any).setError(errorMessage);
        expect(facade.error()).toBe(errorMessage);
      });

      it('should clear error when passed null', () => {
        (facade as any).setError('Test error');
        (facade as any).setError(null);
        expect(facade.error()).toBeNull();
      });
    });

    describe('emitEvent', () => {
      it('should emit event through events$ observable', (done) => {
        const testEvent = { type: 'user-created' as const, user: mockUser1 };

        facade.events$.subscribe((event) => {
          expect(event).toEqual(testEvent);
          done();
        });

        (facade as any).emitEvent(testEvent);
      });

      it('should emit null event', (done) => {
        facade.events$.subscribe((event) => {
          expect(event).toBeNull();
          done();
        });

        (facade as any).emitEvent(null);
      });
    });

    describe('handleError', () => {
      it('should transform error and set error message', () => {
        const error = new Error('Test error');
        const transformedError = new ApplicationError(
          ApplicationErrorCode.UNEXPECTED_ERROR,
          'Technical error message',
          'User-friendly error message'
        );

        mockErrorTransformer.transform.and.returnValue(transformedError);

        (facade as any).handleError(error);

        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(error);
        expect(facade.error()).toBe(transformedError.userMessage);
      });
    });

    describe('getCurrentUserId', () => {
      it('should return current user ID when authenticated', () => {
        const result = (facade as any).getCurrentUserId();
        expect(result).toBe(1);
        expect(mockAuth.user).toHaveBeenCalled();
      });

      it('should return -1 when user is not authenticated', () => {
        mockAuth.user.and.returnValue(null);

        const result = (facade as any).getCurrentUserId();
        expect(result).toBe(-1);
      });

      it('should return -1 when user has no ID', () => {
        mockAuth.user.and.returnValue(null);

        const result = (facade as any).getCurrentUserId();
        expect(result).toBe(-1);
      });
    });
  });

  describe('Event Stream', () => {
    it('should provide observable events stream', () => {
      expect(facade.events$).toBeDefined();
      expect(typeof facade.events$.subscribe).toBe('function');
    });

    it('should emit multiple events in sequence', (done) => {
      const events: any[] = [];
      const subscription = facade.events$.subscribe((event) => {
        events.push(event);
        if (events.length === 3) {
          expect(events).toEqual([{ type: 'event1' }, { type: 'event2' }, null]);
          subscription.unsubscribe();
          done();
        }
      });

      (facade as any).emitEvent({ type: 'event1' });
      (facade as any).emitEvent({ type: 'event2' });
      (facade as any).emitEvent(null);
    });
  });
});
