/**
 * @fileoverview Users Facade - Application Layer Orchestrator
 *
 * This file contains the UsersFacade class, which serves as the primary interface
 * for user management operations in the MAD-AI application. It follows Clean
 * Architecture principles and acts as an orchestrator between the presentation
 * layer and the domain/application layers.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, Subject } from 'rxjs';

// Use Cases Imports
import { CreateUser } from '../use-cases/users/create-user.usecase';
import { UpdateUser } from '../use-cases/users/update-user.usecase';
import { DeleteUser } from '../use-cases/users/delete-user.usecase';
import { GetUserById } from '../use-cases/users/get-user-by-id.usecase';
import { GetUserByEmail } from '../use-cases/users/get-user-by-email.usecase';
import { GetUserByUsername } from '../use-cases/users/get-user-by-username.usecase';
import { ListUsers } from '../use-cases/users/list-users.usecase';
import { ActivateUser } from '../use-cases/users/activate-user.usecase';
import { DeactivateUser } from '../use-cases/users/deactivate-user.usecase';
import { BulkCreateUsers } from '../use-cases/users/bulk-create-users.usecase';
import { BulkUpdateUsers } from '../use-cases/users/bulk-update-users.usecase';
import { BulkDeleteUsers } from '../use-cases/users/bulk-delete-users.usecase';

// Domain Imports
import type { User } from '@domain/entities/user.entity';
import type {
  CreateUserContract,
  UpdateUserPatchContract,
  UserListFilterContract,
} from '@/app/domain/repositories/business/user.contract';

// Application Layer Imports
import { ApplicationErrorTransformer } from '../errors/application-error.transformer';
import { NotificationsFacade } from './notifications.facade';
import type { FacadeOpts } from '../types/facade-opts';
import type {
  CreateUserRequest,
  CreateUserResult,
  UpdateUserRequest,
  UpdateUserResult,
  ListUsersRequest,
  ListUsersResult,
  BulkCreateUsersRequest,
  BulkCreateUsersResult,
  BulkUpdateUsersRequest,
  BulkUpdateUsersResult,
  BulkDeleteUsersRequest,
  BulkDeleteUsersResult,
  UserEvent,
  UserLookupCriteria,
  UserStatistics,
  UserSearchCriteria,
} from '../types/users.types';

/**
 * Users Facade
 *
 * @description
 * Application layer facade that orchestrates user management operations with reactive state
 * management, cross-facade coordination, and comprehensive error handling. This facade serves
 * as the primary interface for all user-related operations in the presentation layer.
 *
 * @responsibilities
 * - Orchestrate user CRUD operations through use cases
 * - Manage reactive state for user data with Angular signals
 * - Provide convenient methods for common user management tasks
 * - Handle bulk operations with proper feedback and error handling
 * - Coordinate with NotificationsFacade for user feedback
 * - Emit events for cross-facade communication
 * - Transform and normalize errors for presentation layer
 *
 * @architecture
 * - Application Layer facade following clean architecture
 * - Uses Angular signals for reactive state management
 * - Coordinates multiple use cases for complex workflows
 * - Integrates with NotificationsFacade for user feedback
 * - Provides Observable stream for real-time updates
 * - Maintains no business logic (delegates to use cases)
 *
 * @patterns
 * - Facade Pattern: Simplifies complex user management operations
 * - Observer Pattern: Events stream for cross-facade coordination
 * - Command Pattern: Each operation delegates to specific use case
 * - State Pattern: Reactive state management with signals
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class UsersFacade {
  // ============================================================================
  // Dependencies Injection
  // ============================================================================

  /** Use case for creating new users */
  private readonly createUserUC = inject(CreateUser);

  /** Use case for updating existing users */
  private readonly updateUserUC = inject(UpdateUser);

  /** Use case for deleting users */
  private readonly deleteUserUC = inject(DeleteUser);

  /** Use case for retrieving user by ID */
  private readonly getUserByIdUC = inject(GetUserById);

  /** Use case for retrieving user by email */
  private readonly getUserByEmailUC = inject(GetUserByEmail);

  /** Use case for retrieving user by username */
  private readonly getUserByUsernameUC = inject(GetUserByUsername);

  /** Use case for listing users with filtering */
  private readonly listUsersUC = inject(ListUsers);

  /** Use case for activating users */
  private readonly activateUserUC = inject(ActivateUser);

  /** Use case for deactivating users */
  private readonly deactivateUserUC = inject(DeactivateUser);

  /** Use case for bulk user creation */
  private readonly bulkCreateUsersUC = inject(BulkCreateUsers);

  /** Use case for bulk user updates */
  private readonly bulkUpdateUsersUC = inject(BulkUpdateUsers);

  /** Use case for bulk user deletion */
  private readonly bulkDeleteUsersUC = inject(BulkDeleteUsers);

  /** Service for transforming domain errors to user-friendly messages */
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  /** Facade for managing user notifications */
  private readonly notifications = inject(NotificationsFacade);

  // ============================================================================
  // Private State Signals
  // ============================================================================

  /** Internal signal storing the current list of users */
  private readonly _users = signal<User[]>([]);

  /** Internal signal storing the currently selected user */
  private readonly _selectedUser = signal<User | null>(null);

  /** Internal signal tracking loading state for async operations */
  private readonly _loading = signal(false);

  /** Internal signal storing the current error message */
  private readonly _userError = signal<string | null>(null);

  /** Internal signal storing the current filter applied to user list */
  private readonly _currentFilter = signal<UserListFilterContract | null>(null);

  /** Internal signal storing the total count of users */
  private readonly _totalCount = signal(0);

  /** Internal signal storing the result of the last bulk operation */
  private readonly _lastBulkOperation = signal<{
    type: 'create' | 'update' | 'delete' | null;
    result: BulkCreateUsersResult | BulkUpdateUsersResult | BulkDeleteUsersResult | null;
  }>({ type: null, result: null });

  // ============================================================================
  // Public Computed Properties (Reactive State)
  // ============================================================================

  /**
   * Current list of users (reactive)
   * @returns {User[]} Array of user entities
   */
  readonly users = computed(() => this._users());

  /**
   * Currently selected user for detailed view (reactive)
   * @returns {User | null} Selected user entity or null
   */
  readonly selectedUser = computed(() => this._selectedUser());

  /**
   * Loading state for async operations (reactive)
   * @returns {boolean} True if any operation is in progress
   */
  readonly loading = computed(() => this._loading());

  /**
   * Current error state (reactive)
   * @returns {string | null} Error message or null if no error
   */
  readonly error = computed(() => this._userError());

  /**
   * Current filter applied to user list (reactive)
   * @returns {UserListFilterContract | null} Current filter or null
   */
  readonly currentFilter = computed(() => this._currentFilter());

  /**
   * Total count of users for pagination (reactive)
   * @returns {number} Total number of users
   */
  readonly totalCount = computed(() => this._totalCount());

  /**
   * Last bulk operation result (reactive)
   * @returns {Object} Last bulk operation details
   */
  readonly lastBulkOperation = computed(() => this._lastBulkOperation());

  /**
   * Whether there are users in the current list (reactive)
   * @returns {boolean} True if users array is not empty
   */
  readonly hasUsers = computed(() => this._users().length > 0);

  /**
   * Number of active users in current list (reactive)
   * @returns {number} Count of users with active status
   */
  readonly activeUsersCount = computed(() => this._users().filter((user) => user.active).length);

  /**
   * Number of inactive users in current list (reactive)
   * @returns {number} Count of users without active status
   */
  readonly inactiveUsersCount = computed(() => this._users().filter((user) => !user.active).length);

  /**
   * Whether a user is currently selected (reactive)
   * @returns {boolean} True if a user is selected
   */
  readonly hasSelectedUser = computed(() => !!this._selectedUser());

  /**
   * User statistics for analytics (reactive)
   * @returns {UserStatistics} Computed statistics object
   */
  readonly userStatistics = computed((): UserStatistics => {
    const users = this._users();
    const activeUsers = users.filter((u) => u.active).length;

    return {
      totalUsers: users.length,
      activeUsers,
      inactiveUsers: users.length - activeUsers,
      usersByRole: {} as Record<string, number>, // Could be enhanced with role grouping
      recentActivity: {
        recentlyCreated: 0, // Could be enhanced with date filtering
        recentlyUpdated: 0,
        recentlyLoggedIn: 0,
      },
    };
  });

  // ============================================================================
  // Events Stream for Cross-Facade Communication
  // ============================================================================

  /**
   * Internal subject for emitting user-related events
   * @private
   */
  private readonly _eventsSubject = new Subject<UserEvent | null>();

  /**
   * Observable stream of user events for cross-facade coordination
   *
   * This stream emits events when user operations occur, allowing other facades
   * and components to react to user state changes. Events include user creation,
   * updates, deletion, activation/deactivation, and bulk operations.
   *
   * @example
   * ```typescript
   * // Subscribe to user events
   * usersFacade.events$.subscribe(event => {
   *   if (event?.type === 'user-created') {
   *     console.log('New user created:', event.user);
   *   }
   * });
   * ```
   *
   * @returns {Observable<UserEvent | null>} Stream of user events
   */
  readonly events$: Observable<UserEvent | null> = this._eventsSubject.asObservable();

  // ============================================================================
  // User CRUD Operations
  // ============================================================================

  /**
   * Create a new user
   *
   * @param request User creation request data
   * @param opts Optional facade configuration
   * @returns Promise resolving to creation result
   */
  async createUser(request: CreateUserRequest, opts?: FacadeOpts): Promise<CreateUserResult> {
    if (!opts?.skipLoading) {
      this._loading.set(true);
    }
    this._userError.set(null);

    try {
      const user = await this.createUserUC.execute(request);

      // Update local state
      this._users.update((users) => [...users, user]);
      this._totalCount.update((count) => count + 1);

      // Send welcome notification if requested
      if (request.sendWelcomeNotification) {
        try {
          await this.notifications.success(
            `Welcome to MAD-AI, ${user.firstName}!`,
            'Your account has been created successfully'
          );
        } catch (notificationError) {
          // Don't fail user creation if notification fails
          console.warn('Failed to send welcome notification:', notificationError);
        }
      }

      // Emit event for cross-facade coordination
      this._eventsSubject.next({
        type: 'user-created',
        user,
        notificationSent: request.sendWelcomeNotification,
      });

      const result: CreateUserResult = user;

      return result;
    } catch (error: unknown) {
      const errorMessage = this.errorTransformer.transform(error);
      this._userError.set(errorMessage.userMessage);

      throw error;
    } finally {
      if (!opts?.skipLoading) {
        this._loading.set(false);
      }
    }
  }

  /**
   * Update an existing user
   *
   * @param request User update request data
   * @param opts Optional facade configuration
   * @returns Promise resolving to update result
   */
  async updateUser(request: UpdateUserRequest, opts?: FacadeOpts): Promise<UpdateUserResult> {
    if (!opts?.skipLoading) {
      this._loading.set(true);
    }
    this._userError.set(null);

    try {
      const user = await this.updateUserUC.execute(request);

      // Update local state
      this._users.update((users) => users.map((u) => (u.id === request.userId ? user : u)));

      // Update selected user if it's the one being updated
      if (this._selectedUser()?.id === request.userId) {
        this._selectedUser.set(user);
      }

      // Determine updated fields
      const updatedFields = Object.keys(request.updateData);

      // Send notification to user if requested
      if (request.notifyUser) {
        try {
          await this.notifications.info(
            'Your profile has been updated',
            `Updated: ${updatedFields.join(', ')}`
          );
        } catch (notificationError) {
          console.warn('Failed to send update notification:', notificationError);
        }
      }

      // Emit event for cross-facade coordination
      this._eventsSubject.next({
        type: 'user-updated',
        user,
        updatedFields,
      });

      const result: UpdateUserResult = user;

      return result;
    } catch (error: unknown) {
      const errorMessage = this.errorTransformer.transform(error);
      this._userError.set(errorMessage.userMessage);

      throw error;
    } finally {
      if (!opts?.skipLoading) {
        this._loading.set(false);
      }
    }
  }

  /**
   * Delete a user
   *
   * @param userId ID of the user to delete
   * @param opts Optional facade configuration
   * @returns Promise resolving when deletion is complete
   */
  async deleteUser(userId: number, opts?: FacadeOpts): Promise<void> {
    if (!opts?.skipLoading) {
      this._loading.set(true);
    }
    this._userError.set(null);

    try {
      // Get user info before deletion for event
      const userToDelete = this._users().find((u) => u.id === userId);
      console.log('Deleting user:', userToDelete); // Debug log

      await this.deleteUserUC.execute({ userId });

      // Update local state
      this._users.update((users) => users.filter((u) => u.id !== userId));
      this._totalCount.update((count) => count - 1);

      // Clear selected user if it's the one being deleted
      if (this._selectedUser()?.id === userId) {
        this._selectedUser.set(null);
      }

      // Emit event for cross-facade coordination
      this._eventsSubject.next({
        type: 'user-deleted',
        userId,
      });
    } catch (error: unknown) {
      const errorMessage = this.errorTransformer.transform(error);
      this._userError.set(errorMessage.userMessage);

      throw error;
    } finally {
      if (!opts?.skipLoading) {
        this._loading.set(false);
      }
    }
  }

  // ============================================================================
  // User Lookup Operations
  // ============================================================================

  /**
   * Get user by ID
   *
   * @param userId User ID to lookup
   * @param opts Optional facade configuration
   * @returns Promise resolving to user entity
   */
  async getUserById(userId: number, opts?: FacadeOpts): Promise<User> {
    if (!opts?.skipLoading) {
      this._loading.set(true);
    }
    this._userError.set(null);

    try {
      const user = await this.getUserByIdUC.execute({ userId });
      return user;
    } catch (error: unknown) {
      const errorMessage = this.errorTransformer.transform(error);
      this._userError.set(errorMessage.userMessage);
      throw error;
    } finally {
      if (!opts?.skipLoading) {
        this._loading.set(false);
      }
    }
  }

  /**
   * Get user by email
   *
   * @param email Email address to lookup
   * @param opts Optional facade configuration
   * @returns Promise resolving to user entity
   */
  async getUserByEmail(email: string, opts?: FacadeOpts): Promise<User> {
    if (!opts?.skipLoading) {
      this._loading.set(true);
    }
    this._userError.set(null);

    try {
      const user = await this.getUserByEmailUC.execute({ email });
      return user;
    } catch (error: unknown) {
      const errorMessage = this.errorTransformer.transform(error);
      this._userError.set(errorMessage.userMessage);
      throw error;
    } finally {
      if (!opts?.skipLoading) {
        this._loading.set(false);
      }
    }
  }

  /**
   * Get user by username
   *
   * @param username Username to lookup
   * @param opts Optional facade configuration
   * @returns Promise resolving to user entity
   */
  async getUserByUsername(username: string, opts?: FacadeOpts): Promise<User> {
    if (!opts?.skipLoading) {
      this._loading.set(true);
    }
    this._userError.set(null);

    try {
      const user = await this.getUserByUsernameUC.execute({ username });
      return user;
    } catch (error: unknown) {
      const errorMessage = this.errorTransformer.transform(error);
      this._userError.set(errorMessage.userMessage);
      throw error;
    } finally {
      if (!opts?.skipLoading) {
        this._loading.set(false);
      }
    }
  }

  /**
   * Find user by multiple criteria
   *
   * Provides a unified interface for finding users by different lookup criteria.
   * Automatically routes to the appropriate lookup method based on the provided criteria.
   * At least one criterion (id, email, or username) must be provided.
   *
   * @param criteria Object containing lookup criteria - id, email, or username
   * @param opts Optional facade configuration for the lookup operation
   * @returns Promise resolving to the found user entity
   * @throws Error if no lookup criteria are provided
   * @example
   * ```typescript
   * // Find by ID
   * const user = await usersFacade.findUser({ id: 123 });
   *
   * // Find by email
   * const user = await usersFacade.findUser({ email: 'user@example.com' });
   *
   * // Find by username
   * const user = await usersFacade.findUser({ username: 'johndoe' });
   * ```
   */
  async findUser(criteria: UserLookupCriteria, opts?: FacadeOpts): Promise<User> {
    if (criteria.id) {
      return this.getUserById(criteria.id, opts);
    } else if (criteria.email) {
      return this.getUserByEmail(criteria.email, opts);
    } else if (criteria.username) {
      return this.getUserByUsername(criteria.username, opts);
    } else {
      throw new Error('At least one lookup criterion must be provided');
    }
  }

  // ============================================================================
  // User Listing and Filtering
  // ============================================================================

  /**
   * List users with optional filtering
   *
   * @param request List request with filter criteria
   * @param opts Optional facade configuration
   * @returns Promise resolving to list result
   */
  async listUsers(request?: ListUsersRequest, opts?: FacadeOpts): Promise<ListUsersResult> {
    if (!opts?.skipLoading) {
      this._loading.set(true);
    }
    this._userError.set(null);

    try {
      const result = await this.listUsersUC.execute(request);

      // Update local state
      this._users.set(result.users);
      this._currentFilter.set(request?.filter || null);
      this._totalCount.set(result.totalCount);

      // Emit filter change event
      this._eventsSubject.next({
        type: 'bulk-operation-completed',
        operation: 'list-users',
        results: result,
      });

      return result;
    } catch (error: unknown) {
      const errorMessage = this.errorTransformer.transform(error);
      this._userError.set(errorMessage.userMessage);

      throw error;
    } finally {
      if (!opts?.skipLoading) {
        this._loading.set(false);
      }
    }
  }

  /**
   * Search users with advanced criteria
   *
   * Performs a flexible search across user data using query terms and optional filters.
   * Supports full-text search across user fields and can be combined with additional
   * filtering criteria for precise user discovery.
   *
   * @param criteria Object containing search query and optional filters
   * @param opts Optional facade configuration for the search operation
   * @returns Promise resolving to paginated list of matching users
   * @example
   * ```typescript
   * // Simple text search
   * const results = await usersFacade.searchUsers({
   *   query: 'john',
   *   filters: { isActive: true }
   * });
   *
   * // Advanced search with multiple filters
   * const results = await usersFacade.searchUsers({
   *   query: 'admin',
   *   filters: {
   *     role: 'administrator',
   *     department: 'IT',
   *     isActive: true
   *   }
   * });
   * ```
   */
  async searchUsers(criteria: UserSearchCriteria, opts?: FacadeOpts): Promise<ListUsersResult> {
    // For now, convert search criteria to filter - could be enhanced with search logic
    const filter: UserListFilterContract = {
      searchTerm: criteria.query,
      ...criteria.filters,
    };
    return this.listUsers({ filter }, opts);
  }

  // ============================================================================
  // User State Management Operations
  // ============================================================================

  /**
   * Activate a user account
   *
   * Enables a previously deactivated user account, allowing them to access the system
   * again. This operation updates the user's status and emits events for cross-facade
   * coordination. The method handles state synchronization and error management.
   *
   * @param userId Unique identifier of the user to activate
   * @param opts Optional facade configuration (skipLoading, etc.)
   * @returns Promise that resolves when the activation is complete
   * @throws Error if the user cannot be activated or if the operation fails
   * @example
   * ```typescript
   * // Activate a user with default loading behavior
   * await usersFacade.activateUser(123);
   *
   * // Activate without showing loading state
   * await usersFacade.activateUser(123, { skipLoading: true });
   * ```
   */
  async activateUser(userId: number, opts?: FacadeOpts): Promise<void> {
    if (!opts?.skipLoading) {
      this._loading.set(true);
    }
    this._userError.set(null);

    try {
      await this.activateUserUC.execute({ userId });

      // Get the updated user to emit in event (since activate UC returns void)
      const updatedUser = await this.getUserByIdUC.execute({ userId });

      // Update local state
      this._users.update((users) => users.map((u) => (u.id === userId ? updatedUser : u)));

      // Update selected user if it's the one being activated
      if (this._selectedUser()?.id === userId) {
        this._selectedUser.set(updatedUser);
      }

      // Emit event for cross-facade coordination
      this._eventsSubject.next({
        type: 'user-activated',
        user: updatedUser,
      });
    } catch (error: unknown) {
      const errorMessage = this.errorTransformer.transform(error);
      this._userError.set(errorMessage.userMessage);
      throw error;
    } finally {
      if (!opts?.skipLoading) {
        this._loading.set(false);
      }
    }
  }

  /**
   * Deactivate a user account
   *
   * Temporarily disables a user account, preventing them from accessing the system
   * while preserving their data. This operation updates the user's status and emits
   * events for cross-facade coordination. The method handles state synchronization
   * and error management.
   *
   * @param userId Unique identifier of the user to deactivate
   * @param opts Optional facade configuration (skipLoading, etc.)
   * @returns Promise that resolves when the deactivation is complete
   * @throws Error if the user cannot be deactivated or if the operation fails
   * @example
   * ```typescript
   * // Deactivate a user with default loading behavior
   * await usersFacade.deactivateUser(123);
   *
   * // Deactivate without showing loading state
   * await usersFacade.deactivateUser(123, { skipLoading: true });
   * ```
   */
  async deactivateUser(userId: number, opts?: FacadeOpts): Promise<void> {
    if (!opts?.skipLoading) {
      this._loading.set(true);
    }
    this._userError.set(null);

    try {
      await this.deactivateUserUC.execute({ userId });

      // Get the updated user to emit in event (since deactivate UC returns void)
      const updatedUser = await this.getUserByIdUC.execute({ userId });

      // Update local state
      this._users.update((users) => users.map((u) => (u.id === userId ? updatedUser : u)));

      // Update selected user if it's the one being deactivated
      if (this._selectedUser()?.id === userId) {
        this._selectedUser.set(updatedUser);
      }

      // Emit event for cross-facade coordination
      this._eventsSubject.next({
        type: 'user-deactivated',
        user: updatedUser,
      });
    } catch (error: unknown) {
      const errorMessage = this.errorTransformer.transform(error);
      this._userError.set(errorMessage.userMessage);
      throw error;
    } finally {
      if (!opts?.skipLoading) {
        this._loading.set(false);
      }
    }
  }

  // ============================================================================
  // Bulk Operations
  // ============================================================================

  /**
   * Create multiple users in bulk
   *
   * @param usersData Array of user data for creation
   * @param sendWelcomeNotifications Whether to send welcome notifications
   * @param opts Optional facade configuration
   * @returns Promise resolving to bulk creation result
   */
  async bulkCreateUsers(
    usersData: CreateUserContract[],
    sendWelcomeNotifications = false,
    opts?: FacadeOpts
  ): Promise<BulkCreateUsersResult> {
    if (!opts?.skipLoading) {
      this._loading.set(true);
    }
    this._userError.set(null);

    try {
      const request: BulkCreateUsersRequest = {
        usersData,
        createdBy: 1, // Could be enhanced with current user ID
      };

      const response = await this.bulkCreateUsersUC.execute(request);

      // Update local state with created users
      this._users.update((users) => [...users, ...response.created]);
      this._totalCount.update((count) => count + response.created.length);

      // Send welcome notifications if requested
      if (sendWelcomeNotifications && response.created.length > 0) {
        try {
          await this.notifications.success(
            `Successfully created ${response.created.length} users`,
            'Welcome notifications will be sent shortly'
          );
        } catch (notificationError) {
          console.warn('Failed to send bulk creation notification:', notificationError);
        }
      }

      // Update last bulk operation
      this._lastBulkOperation.set({
        type: 'create',
        result: response,
      });

      // Emit event for cross-facade coordination
      this._eventsSubject.next({
        type: 'bulk-operation-completed',
        operation: 'bulk-create-users',
        results: response,
      });

      return response;
    } catch (error: unknown) {
      const errorMessage = this.errorTransformer.transform(error);
      this._userError.set(errorMessage.userMessage);

      throw error;
    } finally {
      if (!opts?.skipLoading) {
        this._loading.set(false);
      }
    }
  }

  /**
   * Update multiple users in bulk
   *
   * @param updates Array of user updates with IDs and data
   * @param opts Optional facade configuration
   * @returns Promise resolving to bulk update result
   */
  async bulkUpdateUsers(
    updates: { userId: number; updateData: UpdateUserPatchContract }[],
    opts?: FacadeOpts
  ): Promise<BulkUpdateUsersResult> {
    if (!opts?.skipLoading) {
      this._loading.set(true);
    }
    this._userError.set(null);

    try {
      const request: BulkUpdateUsersRequest = {
        updates,
        requesterId: 1, // Could be enhanced with current user ID
      };

      const response = await this.bulkUpdateUsersUC.execute(request);

      // Update local state with updated users
      this._users.update((users) =>
        users.map((user) => {
          const update = response.updated.find((u) => u.id === user.id);
          return update || user;
        })
      );

      // Update last bulk operation
      this._lastBulkOperation.set({
        type: 'update',
        result: response,
      });

      // Emit event for cross-facade coordination
      this._eventsSubject.next({
        type: 'bulk-operation-completed',
        operation: 'bulk-update-users',
        results: response,
      });

      return response;
    } catch (error: unknown) {
      const errorMessage = this.errorTransformer.transform(error);
      this._userError.set(errorMessage.userMessage);

      throw error;
    } finally {
      if (!opts?.skipLoading) {
        this._loading.set(false);
      }
    }
  }

  /**
   * Delete multiple users in bulk
   *
   * @param userIds Array of user IDs to delete
   * @param opts Optional facade configuration
   * @returns Promise resolving to bulk delete result
   */
  async bulkDeleteUsers(userIds: number[], opts?: FacadeOpts): Promise<BulkDeleteUsersResult> {
    if (!opts?.skipLoading) {
      this._loading.set(true);
    }
    this._userError.set(null);

    try {
      const request: BulkDeleteUsersRequest = {
        userIds,
        requesterId: 1, // Could be enhanced with current user ID
      };

      const response = await this.bulkDeleteUsersUC.execute(request);

      // Update local state by removing deleted users
      this._users.update((users) => users.filter((user) => !response.deleted.includes(user.id)));
      this._totalCount.update((count) => count - response.deleted.length);

      // Clear selected user if it's among the deleted ones
      if (this._selectedUser() && response.deleted.includes(this._selectedUser()!.id)) {
        this._selectedUser.set(null);
      }

      // Update last bulk operation
      this._lastBulkOperation.set({
        type: 'delete',
        result: response,
      });

      // Emit event for cross-facade coordination
      this._eventsSubject.next({
        type: 'bulk-operation-completed',
        operation: 'bulk-delete-users',
        results: response,
      });

      return response;
    } catch (error: unknown) {
      const errorMessage = this.errorTransformer.transform(error);
      this._userError.set(errorMessage.userMessage);

      throw error;
    } finally {
      if (!opts?.skipLoading) {
        this._loading.set(false);
      }
    }
  }

  // ============================================================================
  // State Management and Utility Methods
  // ============================================================================

  /**
   * Select a user for detailed view
   *
   * Sets the currently selected user for detailed operations. This affects the
   * `selectedUser` and `hasSelectedUser` computed properties and emits an event
   * for cross-facade coordination.
   *
   * @param user User entity to select, or null to clear selection
   * @example
   * ```typescript
   * // Select a user
   * usersFacade.selectUser(someUser);
   *
   * // Clear selection
   * usersFacade.selectUser(null);
   * ```
   */
  selectUser(user: User | null): void {
    this._selectedUser.set(user);
    this._eventsSubject.next({
      type: 'bulk-operation-completed',
      operation: 'user-selection',
      results: { selectedUser: user },
    });
  }

  /**
   * Clear all error states
   *
   * Resets the current error state to null, clearing any error messages
   * that might be displayed to the user. This method is useful for dismissing
   * error notifications or resetting the error state after successful operations.
   *
   * @example
   * ```typescript
   * // Clear any displayed errors after successful retry
   * try {
   *   await usersFacade.createUser(userData);
   * } catch (error) {
   *   // Handle error and show to user
   *   console.error('Failed to create user:', error);
   *   // Later, when user acknowledges the error
   *   usersFacade.clearError();
   * }
   * ```
   */
  clearError(): void {
    this._userError.set(null);
  }

  /**
   * Reset all facade state to initial values
   *
   * Performs a complete reset of all internal state managed by the facade.
   * This includes clearing the users list, selected user, current filters,
   * loading states, error messages, and bulk operation results. Useful for
   * scenarios like user logout, component unmounting, or when a complete
   * state refresh is needed.
   *
   * @example
   * ```typescript
   * // Reset entire facade state after user logout
   * usersFacade.reset();
   *
   * // Reset state when component unmounts
   * ngOnDestroy() {
   *   this.usersFacade.reset();
   * }
   *
   * // Reset state before loading new data set
   * usersFacade.reset();
   * await usersFacade.loadUsers();
   * ```
   */
  reset(): void {
    this._users.set([]);
    this._selectedUser.set(null);
    this._loading.set(false);
    this._userError.set(null);
    this._currentFilter.set(null);
    this._totalCount.set(0);
    this._lastBulkOperation.set({ type: null, result: null });
  }

  /**
   * Refresh the current user list
   *
   * Reloads the user list using the current filter criteria. This is useful
   * for getting the latest data from the server without changing the current
   * filter or pagination settings.
   *
   * @param opts Optional facade configuration for the refresh operation
   * @returns Promise that resolves when the refresh is complete
   * @example
   * ```typescript
   * // Refresh current user list
   * await usersFacade.refresh();
   *
   * // Refresh without showing loading indicator
   * await usersFacade.refresh({ skipLoading: true });
   * ```
   */
  async refresh(opts?: FacadeOpts): Promise<void> {
    const currentFilter = this._currentFilter();
    await this.listUsers(currentFilter ? { filter: currentFilter } : undefined, opts);
  }
}
