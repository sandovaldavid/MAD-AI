/**
 * @fileoverview Tests for UserListFacade
 *
 * Comprehensive test suite for UserListFacade covering user listing,
 * filtering, search operations, state management, and error handling.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { TestBed } from '@angular/core/testing';

// Facade under test
import { UserListFacade } from './user-list.facade';

// Use Cases (to be mocked)
import { ListUsersUseCase } from '@application/use-cases/users/list-users.usecase';

// Domain entities and interfaces
import type { User } from '@domain/entities/user.entity';
import type { UserListFilterContract } from '@domain/repositories/business/user.contract';

// Application types
import type {
  ListUsersRequest,
  ListUsersResult,
  UserSearchCriteria,
} from '@application/types/users.types';

// DI Tokens
import { USER_REPOSITORY, LOGGER_PORT, CLOCK_PORT } from '@di/tokens';

// Mocks
import { NotificationsFacade } from '../notifications.facade';
import { AuthFacade } from '../auth.facade';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';

describe('UserListFacade', () => {
  let facade: UserListFacade;

  // Mock use cases
  let mockListUsersUC: jasmine.SpyObj<ListUsersUseCase>;

  // Mock dependencies
  let mockNotifications: jasmine.SpyObj<NotificationsFacade>;
  let mockAuth: jasmine.SpyObj<AuthFacade>;
  let mockErrorTransformer: jasmine.SpyObj<ApplicationErrorTransformer>;

  // Test data - using proper User entity structure
  let mockUsers: jasmine.SpyObj<User>[];
  let mockListResult: ListUsersResult;

  // Test data - using proper request structures
  const mockListRequest: ListUsersRequest = {
    filter: {
      isActive: true,
      searchTerm: 'john',
    },
    requesterId: 1,
  };

  const mockSearchCriteria: UserSearchCriteria = {
    query: 'john',
    filters: {
      isActive: true,
      roleId: 1,
    },
  };

  beforeEach(() => {
    // Create mock User entities
    mockUsers = [
      jasmine.createSpyObj('User', [], {
        id: 1,
        username: 'johndoe',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        active: true,
      }),
      jasmine.createSpyObj('User', [], {
        id: 2,
        username: 'janesmith',
        email: 'jane.smith@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        active: false,
      }),
    ];

    // Create mock list result
    mockListResult = {
      users: mockUsers,
      totalCount: 2,
    };

    // Create mock use cases
    mockListUsersUC = jasmine.createSpyObj('ListUsersUseCase', ['execute']);
    mockListUsersUC.execute.and.returnValue(Promise.resolve(mockListResult));

    // Create mock dependencies
    mockAuth = jasmine.createSpyObj('AuthFacade', [], {
      user: jasmine.createSpy().and.returnValue(jasmine.createSpyObj('User', [], { id: 1 })),
    });
    mockNotifications = jasmine.createSpyObj('NotificationsFacade', [
      'success',
      'error',
      'warning',
      'info',
    ]);
    mockErrorTransformer = jasmine.createSpyObj('ApplicationErrorTransformer', ['transform']);
    mockErrorTransformer.transform.and.callFake((error: any) => {
      return jasmine.createSpyObj('ApplicationError', [], {
        userMessage: 'Transformed error message',
      });
    });

    // Configure TestBed
    TestBed.configureTestingModule({
      providers: [
        UserListFacade,
        { provide: ListUsersUseCase, useValue: mockListUsersUC },
        { provide: NotificationsFacade, useValue: mockNotifications },
        { provide: AuthFacade, useValue: mockAuth },
        { provide: ApplicationErrorTransformer, useValue: mockErrorTransformer },
        // Mock infrastructure dependencies
        { provide: USER_REPOSITORY, useValue: {} },
        { provide: LOGGER_PORT, useValue: {} },
        { provide: CLOCK_PORT, useValue: {} },
      ],
    });

    facade = TestBed.inject(UserListFacade);
  });

  afterEach(() => {
    // Reset all mocks after each test
    mockListUsersUC.execute.calls.reset();
    mockNotifications.success.calls.reset();
    mockNotifications.error.calls.reset();
    mockNotifications.warning.calls.reset();
    mockNotifications.info.calls.reset();
  });

  describe('Facade Initialization', () => {
    it('should create UserListFacade instance', () => {
      expect(facade).toBeTruthy();
      expect(facade).toBeInstanceOf(UserListFacade);
    });

    it('should initialize with empty users list', () => {
      expect(facade.users()).toEqual([]);
      expect(facade.totalCount()).toBe(0);
      expect(facade.currentFilter()).toBeNull();
    });
  });

  describe('listUsers', () => {
    it('should list users with default parameters', async () => {
      // Act
      const result = await facade.listUsers();

      // Assert
      expect(mockListUsersUC.execute).toHaveBeenCalledWith(undefined);
      expect(result).toBe(mockListResult);
      expect(facade.users()).toEqual(mockUsers);
      expect(facade.totalCount()).toBe(2);
      expect(facade.currentFilter()).toBeNull();
    });

    it('should list users with filter and requester ID', async () => {
      // Act
      const result = await facade.listUsers(mockListRequest);

      // Assert
      expect(mockListUsersUC.execute).toHaveBeenCalledWith(mockListRequest);
      expect(result).toBe(mockListResult);
      expect(facade.users()).toEqual(mockUsers);
      expect(facade.totalCount()).toBe(2);
      expect(facade.currentFilter()).toEqual(mockListRequest.filter || null);
    });

    it('should manage loading state during list operation', async () => {
      // Act
      const promise = facade.listUsers();

      // Assert loading state
      expect(facade.loading()).toBe(true);

      await promise;

      // Assert loading completed
      expect(facade.loading()).toBe(false);
    });

    it('should skip loading when skipLoading option is true', async () => {
      // Act
      await facade.listUsers(undefined, { skipLoading: true });

      // Assert
      expect(facade.loading()).toBe(false);
      expect(mockListUsersUC.execute).toHaveBeenCalledWith(undefined);
    });

    it('should clear error state before listing users', async () => {
      // Arrange
      facade['_userError'].set('Previous error');

      // Act
      await facade.listUsers();

      // Assert
      expect(facade.error()).toBeNull();
    });

    it('should emit bulk-operation-completed event after successful listing', async () => {
      // Arrange
      let emittedEvent: any = null;
      facade.events$.subscribe((event) => {
        emittedEvent = event;
      });

      // Act
      await facade.listUsers();

      // Assert
      expect(emittedEvent).toEqual({
        type: 'bulk-operation-completed',
        operation: 'list-users',
        results: mockListResult,
      });
    });

    it('should handle errors during listing and update error state', async () => {
      // Arrange
      const mockError = new Error('List users failed');
      const mockApplicationError = jasmine.createSpyObj('ApplicationError', [], {
        userMessage: 'Failed to load users',
        code: 'USER_OPERATION_FAILED',
        context: { operation: 'list-users' },
      });
      mockListUsersUC.execute.and.rejectWith(mockError);
      mockErrorTransformer.transform.and.returnValue(mockApplicationError);

      // Act & Assert
      await expectAsync(facade.listUsers()).toBeRejectedWith(mockError);
      expect(facade.error()).toBe('Failed to load users');
      expect(facade.loading()).toBe(false);
    });
  });

  describe('searchUsers', () => {
    it('should search users and convert criteria to filter format', async () => {
      // Act
      const result = await facade.searchUsers(mockSearchCriteria);

      // Assert
      const expectedRequest: ListUsersRequest = {
        filter: {
          searchTerm: 'john',
          isActive: true,
          roleId: 1,
        },
        requesterId: 1, // From mock auth user
      };
      expect(mockListUsersUC.execute).toHaveBeenCalledWith(expectedRequest);
      expect(result).toBe(mockListResult);
    });

    it('should search users with only query term', async () => {
      // Arrange
      const criteria: UserSearchCriteria = {
        query: 'test query',
      };

      // Act
      await facade.searchUsers(criteria);

      // Assert
      const expectedRequest: ListUsersRequest = {
        filter: {
          searchTerm: 'test query',
        },
        requesterId: 1,
      };
      expect(mockListUsersUC.execute).toHaveBeenCalledWith(expectedRequest);
    });

    it('should search users with empty query but filters', async () => {
      // Arrange
      const criteria: UserSearchCriteria = {
        query: '',
        filters: {
          isActive: false,
        },
      };

      // Act
      await facade.searchUsers(criteria);

      // Assert
      const expectedRequest: ListUsersRequest = {
        filter: {
          searchTerm: '',
          isActive: false,
        },
        requesterId: 1,
      };
      expect(mockListUsersUC.execute).toHaveBeenCalledWith(expectedRequest);
    });

    it('should handle search errors and propagate them', async () => {
      // Arrange
      const mockError = new Error('Search failed');
      mockListUsersUC.execute.and.rejectWith(mockError);

      // Act & Assert
      await expectAsync(facade.searchUsers(mockSearchCriteria)).toBeRejectedWith(mockError);
    });
  });

  describe('loadUsersWithFilter', () => {
    it('should load users with specific filter', async () => {
      // Arrange
      const filter: UserListFilterContract = {
        isActive: true,
        searchTerm: 'admin',
      };

      // Act
      const result = await facade.loadUsersWithFilter(filter);

      // Assert
      const expectedRequest: ListUsersRequest = {
        filter,
        requesterId: 1,
      };
      expect(mockListUsersUC.execute).toHaveBeenCalledWith(expectedRequest);
      expect(result).toBe(mockListResult);
    });

    it('should load users with empty filter', async () => {
      // Arrange
      const filter: UserListFilterContract = {};

      // Act
      await facade.loadUsersWithFilter(filter);

      // Assert
      const expectedRequest: ListUsersRequest = {
        filter: {},
        requesterId: 1,
      };
      expect(mockListUsersUC.execute).toHaveBeenCalledWith(expectedRequest);
    });

    it('should handle filter loading errors', async () => {
      // Arrange
      const mockError = new Error('Filter loading failed');
      mockListUsersUC.execute.and.rejectWith(mockError);

      // Act & Assert
      await expectAsync(facade.loadUsersWithFilter({ isActive: true })).toBeRejectedWith(mockError);
    });
  });

  describe('loadNextPage', () => {
    it('should load next page with current filter', async () => {
      // Arrange
      const currentFilter: UserListFilterContract = {
        isActive: true,
        searchTerm: 'test',
      };
      facade['_currentFilter'].set(currentFilter);

      // Act
      const result = await facade.loadNextPage();

      // Assert
      const expectedRequest: ListUsersRequest = {
        filter: currentFilter,
        requesterId: 1,
      };
      expect(mockListUsersUC.execute).toHaveBeenCalledWith(expectedRequest);
      expect(result).toBe(mockListResult);
    });

    it('should load next page with null filter when no current filter exists', async () => {
      // Arrange
      facade['_currentFilter'].set(null);

      // Act
      await facade.loadNextPage();

      // Assert
      const expectedRequest: ListUsersRequest = {
        filter: undefined,
        requesterId: 1,
      };
      expect(mockListUsersUC.execute).toHaveBeenCalledWith(expectedRequest);
    });

    it('should handle next page loading errors', async () => {
      // Arrange
      const mockError = new Error('Next page loading failed');
      mockListUsersUC.execute.and.rejectWith(mockError);

      // Act & Assert
      await expectAsync(facade.loadNextPage()).toBeRejectedWith(mockError);
    });
  });

  describe('clearFilterAndReload', () => {
    it('should clear current filter and reload users', async () => {
      // Arrange
      const currentFilter: UserListFilterContract = {
        isActive: true,
        searchTerm: 'test',
      };
      facade['_currentFilter'].set(currentFilter);

      // Act
      const result = await facade.clearFilterAndReload();

      // Assert
      expect(facade.currentFilter()).toBeNull();
      const expectedRequest: ListUsersRequest = {
        filter: undefined,
        requesterId: 1,
      };
      expect(mockListUsersUC.execute).toHaveBeenCalledWith(expectedRequest);
      expect(result).toBe(mockListResult);
    });

    it('should work when no current filter exists', async () => {
      // Arrange
      facade['_currentFilter'].set(null);

      // Act
      await facade.clearFilterAndReload();

      // Assert
      const expectedRequest: ListUsersRequest = {
        filter: undefined,
        requesterId: 1,
      };
      expect(mockListUsersUC.execute).toHaveBeenCalledWith(expectedRequest);
    });

    it('should handle clear and reload errors', async () => {
      // Arrange
      const mockError = new Error('Clear and reload failed');
      mockListUsersUC.execute.and.rejectWith(mockError);

      // Act & Assert
      await expectAsync(facade.clearFilterAndReload()).toBeRejectedWith(mockError);
    });
  });

  describe('Error Handling', () => {
    it('should handle and transform errors from use case', async () => {
      // Arrange
      const mockError = new Error('Use case error');
      const mockApplicationError = jasmine.createSpyObj('ApplicationError', [], {
        userMessage: 'User-friendly error message',
      });
      mockListUsersUC.execute.and.rejectWith(mockError);
      mockErrorTransformer.transform.and.returnValue(mockApplicationError);

      // Act
      try {
        await facade.listUsers();
      } catch (error) {
        // Expected to throw
      }

      // Assert
      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(mockError);
      expect(facade.error()).toBe('User-friendly error message');
    });

    it('should reset error state on successful operations', async () => {
      // Arrange
      facade['_userError'].set('Previous error');

      // Act
      await facade.listUsers();

      // Assert
      expect(facade.error()).toBeNull();
    });
  });

  describe('State Management', () => {
    it('should update users state after successful listing', async () => {
      // Act
      await facade.listUsers();

      // Assert
      expect(facade.users()).toEqual(mockUsers);
      expect(facade.totalCount()).toBe(2);
    });

    it('should update current filter when listing with filter', async () => {
      // Act
      await facade.listUsers(mockListRequest);

      // Assert
      expect(facade.currentFilter()).toEqual(mockListRequest.filter || null);
    });

    it('should maintain loading state correctly during operations', async () => {
      // Act
      const promise = facade.listUsers();

      // Assert loading started
      expect(facade.loading()).toBe(true);

      await promise;

      // Assert loading completed
      expect(facade.loading()).toBe(false);
    });

    it('should emit events for bulk operations', async () => {
      // Arrange
      let emittedEvent: any = null;
      facade.events$.subscribe((event) => {
        emittedEvent = event;
      });

      // Act
      await facade.listUsers();

      // Assert
      expect(emittedEvent?.type).toBe('bulk-operation-completed');
      expect(emittedEvent?.operation).toBe('list-users');
      expect(emittedEvent?.results).toBe(mockListResult);
    });
  });

  describe('Event Emission', () => {
    it('should emit bulk-operation-completed event on successful listUsers', async () => {
      // Arrange
      const events: any[] = [];
      facade.events$.subscribe((event) => events.push(event));

      // Act
      await facade.listUsers(mockListRequest);

      // Assert
      expect(events.length).toBe(1);
      expect(events[0]).toEqual({
        type: 'bulk-operation-completed',
        operation: 'list-users',
        results: mockListResult,
      });
    });

    it('should not emit events on failed operations', async () => {
      // Arrange
      const events: any[] = [];
      facade.events$.subscribe((event) => events.push(event));
      mockListUsersUC.execute.and.rejectWith(new Error('Test error'));

      // Act
      try {
        await facade.listUsers();
      } catch (error) {
        // Expected to throw
      }

      // Assert
      expect(events.length).toBe(0);
    });
  });
});
