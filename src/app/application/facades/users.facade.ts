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
import {
    BulkCreateUsers,
    type BulkCreateUsersRequest,
    type BulkCreateUsersResponse,
} from '../use-cases/users/bulk-create-users.usecase';
import {
    BulkUpdateUsers,
    type BulkUpdateUsersRequest,
    type BulkUpdateUsersResponse,
} from '../use-cases/users/bulk-update-users.usecase';
import {
    BulkDeleteUsers,
    type BulkDeleteUsersRequest,
    type BulkDeleteUsersResponse,
} from '../use-cases/users/bulk-delete-users.usecase';

// Domain Imports
import type { User } from '@domain/entities/user.entity';
import type {
    CreateUserContract,
    UpdateUserPatchContract,
    UserListFilterContract,
} from '@domain/contracts/user.contract';

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
    BulkCreateUsersResult,
    BulkUpdateUsersResult,
    BulkDeleteUsersResult,
    UsersState,
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

    private readonly createUserUC = inject(CreateUser);
    private readonly updateUserUC = inject(UpdateUser);
    private readonly deleteUserUC = inject(DeleteUser);
    private readonly getUserByIdUC = inject(GetUserById);
    private readonly getUserByEmailUC = inject(GetUserByEmail);
    private readonly getUserByUsernameUC = inject(GetUserByUsername);
    private readonly listUsersUC = inject(ListUsers);
    private readonly activateUserUC = inject(ActivateUser);
    private readonly deactivateUserUC = inject(DeactivateUser);
    private readonly bulkCreateUsersUC = inject(BulkCreateUsers);
    private readonly bulkUpdateUsersUC = inject(BulkUpdateUsers);
    private readonly bulkDeleteUsersUC = inject(BulkDeleteUsers);

    private readonly errorTransformer = inject(ApplicationErrorTransformer);
    private readonly notifications = inject(NotificationsFacade);

    // ============================================================================
    // Private State Signals
    // ============================================================================

    private readonly _users = signal<User[]>([]);
    private readonly _selectedUser = signal<User | null>(null);
    private readonly _loading = signal(false);
    private readonly _userError = signal<string | null>(null);
    private readonly _currentFilter = signal<UserListFilterContract | null>(null);
    private readonly _totalCount = signal(0);
    private readonly _lastBulkOperation = signal<{
        type: 'create' | 'update' | 'delete' | null;
        result: BulkCreateUsersResult | BulkUpdateUsersResult | BulkDeleteUsersResult | null;
    }>({ type: null, result: null });

    // ============================================================================
    // Public Computed Properties (Reactive State)
    // ============================================================================

    /** Current list of users */
    readonly users = computed(() => this._users());

    /** Currently selected user for detailed view */
    readonly selectedUser = computed(() => this._selectedUser());

    /** Loading state for async operations */
    readonly loading = computed(() => this._loading());

    /** Current error state */
    readonly error = computed(() => this._userError());

    /** Current filter applied to user list */
    readonly currentFilter = computed(() => this._currentFilter());

    /** Total count of users (for pagination) */
    readonly totalCount = computed(() => this._totalCount());

    /** Last bulk operation result */
    readonly lastBulkOperation = computed(() => this._lastBulkOperation());

    /** Whether there are users in the current list */
    readonly hasUsers = computed(() => this._users().length > 0);

    /** Number of active users in current list */
    readonly activeUsersCount = computed(() => this._users().filter((user) => user.active).length);

    /** Number of inactive users in current list */
    readonly inactiveUsersCount = computed(
        () => this._users().filter((user) => !user.active).length
    );

    /** Whether a user is currently selected */
    readonly hasSelectedUser = computed(() => !!this._selectedUser());

    /** User statistics for analytics */
    readonly userStatistics = computed((): UserStatistics => {
        const users = this._users();
        const activeUsers = users.filter((u) => u.active).length;

        return {
            totalUsers: users.length,
            activeUsers,
            inactiveUsers: users.length - activeUsers,
            usersByRole: [], // Could be enhanced with role grouping
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

    private readonly _eventsSubject = new Subject<UserEvent | null>();

    /** Observable stream of user events for cross-facade coordination */
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
            const user = await this.createUserUC.execute(request.userData);

            // Update local state
            this._users.update((users) => [...users, user]);
            this._totalCount.update((count) => count + 1);

            // Send welcome notification if requested
            let notificationId: string | undefined;
            if (request.sendWelcomeNotification) {
                try {
                    const notificationResult = await this.notifications.success(
                        `Welcome to MAD-AI, ${user.firstName}!`,
                        'Your account has been created successfully'
                    );
                    notificationId = notificationResult.notification?.id;
                } catch (notificationError) {
                    // Don't fail user creation if notification fails
                    console.warn('Failed to send welcome notification:', notificationError);
                }
            }

            // Emit event for cross-facade coordination
            this._eventsSubject.next({
                type: 'user-created',
                user,
                notificationSent: !!notificationId,
            });

            const result: CreateUserResult = {
                success: true,
                user,
                notificationId,
            };

            return result;
        } catch (error: any) {
            const errorMessage = this.errorTransformer.transformError(error);
            this._userError.set(errorMessage);

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
            const user = await this.updateUserUC.execute(request.userId, request.updateData);

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

            const result: UpdateUserResult = {
                success: true,
                user,
                updatedFields,
            };

            return result;
        } catch (error: any) {
            const errorMessage = this.errorTransformer.transformError(error);
            this._userError.set(errorMessage);

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
            const userName = userToDelete
                ? `${userToDelete.firstName} ${userToDelete.lastName}`
                : 'Unknown';

            await this.deleteUserUC.execute(userId);

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
                userName,
            });
        } catch (error: any) {
            const errorMessage = this.errorTransformer.transformError(error);
            this._userError.set(errorMessage);

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
            const user = await this.getUserByIdUC.execute(userId);
            return user;
        } catch (error: any) {
            const errorMessage = this.errorTransformer.transformError(error);
            this._userError.set(errorMessage);
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
            const user = await this.getUserByEmailUC.execute(email);
            return user;
        } catch (error: any) {
            const errorMessage = this.errorTransformer.transformError(error);
            this._userError.set(errorMessage);
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
            const user = await this.getUserByUsernameUC.execute(username);
            return user;
        } catch (error: any) {
            const errorMessage = this.errorTransformer.transformError(error);
            this._userError.set(errorMessage);
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
     * @param criteria Lookup criteria (id, username, or email)
     * @param opts Optional facade configuration
     * @returns Promise resolving to user entity
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
            const users = await this.listUsersUC.execute(request?.filter);

            // Update local state
            this._users.set(users);
            this._currentFilter.set(request?.filter || null);
            this._totalCount.set(users.length);

            // Emit filter change event
            this._eventsSubject.next({
                type: 'users-filter-changed',
                filter: request?.filter || null,
            });

            const result: ListUsersResult = {
                success: true,
                users,
                totalCount: users.length,
                metadata: {
                    hasMore: false, // Could be enhanced with pagination
                    currentOffset: request?.filter?.offset || 0,
                    currentLimit: request?.filter?.limit || 50,
                },
            };

            return result;
        } catch (error: any) {
            const errorMessage = this.errorTransformer.transformError(error);
            this._userError.set(errorMessage);

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
     * @param criteria Search criteria
     * @param opts Optional facade configuration
     * @returns Promise resolving to list result
     */
    async searchUsers(criteria: UserSearchCriteria, opts?: FacadeOpts): Promise<ListUsersResult> {
        return this.listUsers({ filter: criteria }, opts);
    }

    // ============================================================================
    // User State Management Operations
    // ============================================================================

    /**
     * Activate a user
     *
     * @param userId ID of the user to activate
     * @param opts Optional facade configuration
     * @returns Promise resolving when activation is complete
     */
    async activateUser(userId: number, opts?: FacadeOpts): Promise<void> {
        if (!opts?.skipLoading) {
            this._loading.set(true);
        }
        this._userError.set(null);

        try {
            await this.activateUserUC.execute(userId);

            // Get the updated user to emit in event (since activate UC returns void)
            const updatedUser = await this.getUserByIdUC.execute(userId);

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
        } catch (error: any) {
            const errorMessage = this.errorTransformer.transformError(error);
            this._userError.set(errorMessage);
            throw error;
        } finally {
            if (!opts?.skipLoading) {
                this._loading.set(false);
            }
        }
    }

    /**
     * Deactivate a user
     *
     * @param userId ID of the user to deactivate
     * @param opts Optional facade configuration
     * @returns Promise resolving when deactivation is complete
     */
    async deactivateUser(userId: number, opts?: FacadeOpts): Promise<void> {
        if (!opts?.skipLoading) {
            this._loading.set(true);
        }
        this._userError.set(null);

        try {
            await this.deactivateUserUC.execute(userId);

            // Get the updated user to emit in event (since deactivate UC returns void)
            const updatedUser = await this.getUserByIdUC.execute(userId);

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
        } catch (error: any) {
            const errorMessage = this.errorTransformer.transformError(error);
            this._userError.set(errorMessage);
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
                users: usersData,
                performingUserId: 1, // Could be enhanced with current user ID
            };

            const response = await this.bulkCreateUsersUC.execute(request);

            // Transform response to facade result
            const createdUsers = response.results
                .filter((r) => r.success && r.user)
                .map((r) => r.user!);

            const failedUsers = response.results
                .filter((r) => !r.success)
                .map((r) => ({
                    userData: usersData[r.index],
                    error: r.error || 'Unknown error',
                }));

            // Update local state
            this._users.update((users) => [...users, ...createdUsers]);
            this._totalCount.update((count) => count + createdUsers.length);

            // Send welcome notifications if requested
            if (sendWelcomeNotifications && createdUsers.length > 0) {
                try {
                    await this.notifications.success(
                        `Successfully created ${createdUsers.length} users`,
                        'Welcome notifications will be sent shortly'
                    );
                } catch (notificationError) {
                    console.warn('Failed to send bulk creation notification:', notificationError);
                }
            }

            const result: BulkCreateUsersResult = {
                success: response.successfulCreations > 0,
                createdUsers,
                failedUsers,
                summary: {
                    totalRequested: response.totalRequested,
                    totalCreated: response.successfulCreations,
                    totalFailed: response.failedCreations,
                },
            };

            // Update last bulk operation
            this._lastBulkOperation.set({
                type: 'create',
                result,
            });

            // Emit event for cross-facade coordination
            this._eventsSubject.next({
                type: 'bulk-users-created',
                users: createdUsers,
                count: createdUsers.length,
            });

            return result;
        } catch (error: any) {
            const errorMessage = this.errorTransformer.transformError(error);
            this._userError.set(errorMessage);

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
     * @param user User to select (null to clear selection)
     */
    selectUser(user: User | null): void {
        this._selectedUser.set(user);
        this._eventsSubject.next({
            type: 'user-selected',
            user,
        });
    }

    /**
     * Clear all error states
     */
    clearError(): void {
        this._userError.set(null);
    }

    /**
     * Reset all facade state to initial values
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
     * @param opts Optional facade configuration
     * @returns Promise resolving when refresh is complete
     */
    async refresh(opts?: FacadeOpts): Promise<void> {
        const currentFilter = this._currentFilter();
        await this.listUsers(currentFilter ? { filter: currentFilter } : undefined, opts);
    }
}
