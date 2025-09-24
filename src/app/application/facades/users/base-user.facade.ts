/**
 * @fileoverview Base User Facade - Shared State and Dependencies
 *
 * This file contains the base class for all user facade components, providing
 * shared state management, common dependencies, and reactive state primitives
 * that are used across all user facade operations.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, Subject } from 'rxjs';

// Injection Tokens
import {
  CREATE_USER_USECASE_PORT,
  UPDATE_USER_USECASE_PORT,
  DELETE_USER_USECASE_PORT,
  GET_USER_BY_ID_USECASE_PORT,
  GET_USER_BY_EMAIL_USECASE_PORT,
  GET_USER_BY_USERNAME_USECASE_PORT,
  LIST_USERS_USECASE_PORT,
  ACTIVATE_USER_USECASE_PORT,
  DEACTIVATE_USER_USECASE_PORT,
  CHANGE_PASSWORD_USECASE_PORT,
} from '@di/tokens';

// Domain Imports
import type { User } from '@domain/entities/user.entity';
import type { UserListFilterContract } from '@domain/repositories/business/user.contract';

// Application Layer Imports
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { AuthFacade } from '../auth.facade';
import type {
  BulkCreateUsersResult,
  BulkUpdateUsersResult,
  BulkDeleteUsersResult,
  UserEvent,
  UserStatistics,
} from '@application/types/users.types';

/**
 * Base User Facade
 *
 * @description
 * Provides shared state management, common dependencies, and reactive state primitives
 * for all user facade operations. This base class centralizes the common concerns
 * of user management while allowing specialized facades to focus on their specific
 * responsibilities.
 *
 * @responsibilities
 * - Manage shared reactive state for user data
 * - Provide common use case dependencies
 * - Handle error transformation and notifications
 * - Emit events for cross-facade communication
 * - Provide computed properties for common derived state
 *
 * @architecture
 * - Base class for all user facade components
 * - Centralizes shared state and dependencies
 * - Uses Angular signals for reactive state management
 * - Follows Single Responsibility Principle for specialized facades
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export abstract class BaseUserFacade {
  // ============================================================================
  // Dependencies Injection
  // ============================================================================

  /** Use case for changing/resetting user password */
  protected readonly changePasswordUC = inject(CHANGE_PASSWORD_USECASE_PORT);

  /** Use case for creating new users */
  protected readonly createUserUC = inject(CREATE_USER_USECASE_PORT);

  /** Use case for updating existing users */
  protected readonly updateUserUC = inject(UPDATE_USER_USECASE_PORT);

  /** Use case for deleting users */
  protected readonly deleteUserUC = inject(DELETE_USER_USECASE_PORT);

  /** Use case for retrieving user by ID */
  protected readonly getUserByIdUC = inject(GET_USER_BY_ID_USECASE_PORT);

  /** Use case for retrieving user by email */
  protected readonly getUserByEmailUC = inject(GET_USER_BY_EMAIL_USECASE_PORT);

  /** Use case for retrieving user by username */
  protected readonly getUserByUsernameUC = inject(GET_USER_BY_USERNAME_USECASE_PORT);

  /** Use case for listing users with filtering */
  protected readonly listUsersUC = inject(LIST_USERS_USECASE_PORT);

  /** Use case for activating users */
  protected readonly activateUserUC = inject(ACTIVATE_USER_USECASE_PORT);

  /** Use case for deactivating users */
  protected readonly deactivateUserUC = inject(DEACTIVATE_USER_USECASE_PORT);

  /** Service for transforming domain errors to user-friendly messages */
  protected readonly errorTransformer = inject(ApplicationErrorTransformer);

  /** Facade for accessing authentication state and current user information */
  protected readonly auth = inject(AuthFacade);

  // ============================================================================
  // Protected State Signals
  // ============================================================================

  /** Internal signal storing the current list of users */
  protected readonly _users = signal<User[]>([]);

  /** Internal signal storing the currently selected user */
  protected readonly _selectedUser = signal<User | null>(null);

  /** Internal signal tracking loading state for async operations */
  protected readonly _loading = signal(false);

  /** Internal signal storing the current error message */
  protected readonly _userError = signal<string | null>(null);

  /** Internal signal storing the current filter applied to user list */
  protected readonly _currentFilter = signal<UserListFilterContract | null>(null);

  /** Internal signal storing the total count of users */
  protected readonly _totalCount = signal(0);

  /** Internal signal storing the result of the last bulk operation */
  protected readonly _lastBulkOperation = signal<{
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
   * @protected
   */
  protected readonly _eventsSubject = new Subject<UserEvent | null>();

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
  // Protected Utility Methods
  // ============================================================================

  /**
   * Set loading state
   * @protected
   * @param loading - Loading state to set
   */
  protected setLoading(loading: boolean): void {
    this._loading.set(loading);
  }

  /**
   * Set error state
   * @protected
   * @param error - Error message to set or null to clear
   */
  protected setError(error: string | null): void {
    this._userError.set(error);
  }

  /**
   * Emit user event
   * @protected
   * @param event - Event to emit
   */
  protected emitEvent(event: UserEvent | null): void {
    this._eventsSubject.next(event);
  }

  /**
   * Transform and set error from caught exception
   * @protected
   * @param error - Caught error to transform
   */
  protected handleError(error: unknown): void {
    const errorMessage = this.errorTransformer.transform(error);
    this._userError.set(errorMessage.userMessage);
  }

  /**
   * Get the current authenticated user's ID
   *
   * Returns the ID of the currently authenticated user from the auth facade.
   * Provides a fallback value (-1) for unauthenticated scenarios to satisfy
   * the requesterId requirement in use case contracts while maintaining
   * type safety.
   *
   * @protected
   * @returns Current user ID or -1 if not authenticated
   * @example
   * ```typescript
   * const requesterId = this.getCurrentUserId();
   * const request: ListUsersRequest = {
   *   filter: { isActive: true },
   *   requesterId
   * };
   * ```
   */
  protected getCurrentUserId(): number {
    const currentUser = this.auth.user();
    return currentUser?.id ?? -1;
  }
}
