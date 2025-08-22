/**
 * Users Facade Types
 * 
 * @description
 * Type definitions for the UsersFacade application layer.
 * These types bridge the domain layer contracts with facade-specific requirements,
 * providing clean interfaces for user management operations in the presentation layer.
 * 
 * @responsibilities
 * - Define request/result interfaces for facade operations
 * - Provide type safety for user management workflows
 * - Bridge domain contracts with application layer needs
 * - Support bulk operations and reactive state management
 * 
 * @architecture
 * - Application layer type definitions
 * - Extends domain contracts with facade-specific requirements
 * - Supports reactive programming with Angular signals
 * - Enables type-safe cross-facade communication
 * 
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Application
 */

import type { User } from '@domain/entities/user.entity';
import type { Role } from '@domain/entities/role.entity';
import type { CreateUserContract, UpdateUserPatchContract, UserListFilterContract } from '@domain/contracts/user.contract';

// ============================================================================
// Request/Result Interfaces
// ============================================================================

/**
 * Request interface for creating a new user
 */
export interface CreateUserRequest {
    /** User data following domain contract */
    userData: CreateUserContract;
    /** Whether to send welcome notification */
    sendWelcomeNotification?: boolean;
    /** Whether to send email confirmation */
    sendEmailConfirmation?: boolean;
}

/**
 * Result interface for user creation
 */
export interface CreateUserResult {
    /** Whether the operation was successful */
    success: boolean;
    /** The created user entity */
    user?: User;
    /** Error message if operation failed */
    error?: string;
    /** Notification ID if welcome notification was sent */
    notificationId?: string;
}

/**
 * Request interface for updating a user
 */
export interface UpdateUserRequest {
    /** ID of the user to update */
    userId: number;
    /** Update data following domain contract */
    updateData: UpdateUserPatchContract;
    /** Whether to notify user of changes */
    notifyUser?: boolean;
}

/**
 * Result interface for user update
 */
export interface UpdateUserResult {
    /** Whether the operation was successful */
    success: boolean;
    /** The updated user entity */
    user?: User;
    /** Error message if operation failed */
    error?: string;
    /** Fields that were actually updated */
    updatedFields?: string[];
}

/**
 * Request interface for listing users
 */
export interface ListUsersRequest {
    /** Filter criteria following domain contract */
    filter?: UserListFilterContract;
    /** Whether to include roles in response */
    includeRoles?: boolean;
    /** Whether to include usage statistics */
    includeStats?: boolean;
}

/**
 * Result interface for user listing
 */
export interface ListUsersResult {
    /** Whether the operation was successful */
    success: boolean;
    /** Array of user entities */
    users?: User[];
    /** Total count of users (for pagination) */
    totalCount?: number;
    /** Error message if operation failed */
    error?: string;
    /** Metadata about the query */
    metadata?: {
        hasMore: boolean;
        currentOffset: number;
        currentLimit: number;
    };
}

/**
 * Request interface for bulk user creation
 */
export interface BulkCreateUsersRequest {
    /** Array of user data for creation */
    usersData: CreateUserContract[];
    /** Whether to send welcome notifications */
    sendWelcomeNotifications?: boolean;
    /** Whether to continue on individual failures */
    continueOnFailure?: boolean;
}

/**
 * Result interface for bulk user creation
 */
export interface BulkCreateUsersResult {
    /** Whether the overall operation was successful */
    success: boolean;
    /** Successfully created users */
    createdUsers: User[];
    /** Users that failed to create */
    failedUsers: Array<{
        userData: CreateUserContract;
        error: string;
    }>;
    /** Summary statistics */
    summary: {
        totalRequested: number;
        totalCreated: number;
        totalFailed: number;
    };
}

/**
 * Request interface for bulk user updates
 */
export interface BulkUpdateUsersRequest {
    /** Array of user updates */
    updates: Array<{
        userId: number;
        updateData: UpdateUserPatchContract;
    }>;
    /** Whether to notify users of changes */
    notifyUsers?: boolean;
    /** Whether to continue on individual failures */
    continueOnFailure?: boolean;
}

/**
 * Result interface for bulk user updates
 */
export interface BulkUpdateUsersResult {
    /** Whether the overall operation was successful */
    success: boolean;
    /** Successfully updated users */
    updatedUsers: User[];
    /** Users that failed to update */
    failedUpdates: Array<{
        userId: number;
        updateData: UpdateUserPatchContract;
        error: string;
    }>;
    /** Summary statistics */
    summary: {
        totalRequested: number;
        totalUpdated: number;
        totalFailed: number;
    };
}

/**
 * Request interface for bulk user deletion
 */
export interface BulkDeleteUsersRequest {
    /** Array of user IDs to delete */
    userIds: number[];
    /** Whether to send deletion notifications */
    sendNotifications?: boolean;
    /** Whether to continue on individual failures */
    continueOnFailure?: boolean;
}

/**
 * Result interface for bulk user deletion
 */
export interface BulkDeleteUsersResult {
    /** Whether the overall operation was successful */
    success: boolean;
    /** Successfully deleted user IDs */
    deletedUserIds: number[];
    /** User IDs that failed to delete */
    failedDeletions: Array<{
        userId: number;
        error: string;
    }>;
    /** Summary statistics */
    summary: {
        totalRequested: number;
        totalDeleted: number;
        totalFailed: number;
    };
}

// ============================================================================
// State Management Types
// ============================================================================

/**
 * User management state interface
 */
export interface UsersState {
    /** Current list of users */
    users: User[];
    /** Selected user for detailed view */
    selectedUser: User | null;
    /** Loading state for async operations */
    loading: boolean;
    /** Error state */
    error: string | null;
    /** Current filter applied to user list */
    currentFilter: UserListFilterContract | null;
    /** Total count of users (for pagination) */
    totalCount: number;
    /** Bulk operation results */
    lastBulkOperation: {
        type: 'create' | 'update' | 'delete' | null;
        result: BulkCreateUsersResult | BulkUpdateUsersResult | BulkDeleteUsersResult | null;
    };
}

// ============================================================================
// Cross-Facade Communication Types
// ============================================================================

/**
 * User events for cross-facade coordination
 */
export type UserEvent = 
    | { type: 'user-created'; user: User; notificationSent?: boolean }
    | { type: 'user-updated'; user: User; updatedFields: string[] }
    | { type: 'user-deleted'; userId: number; userName: string }
    | { type: 'user-activated'; user: User }
    | { type: 'user-deactivated'; user: User }
    | { type: 'bulk-users-created'; users: User[]; count: number }
    | { type: 'bulk-users-updated'; users: User[]; count: number }
    | { type: 'bulk-users-deleted'; userIds: number[]; count: number }
    | { type: 'users-filter-changed'; filter: UserListFilterContract | null }
    | { type: 'user-selected'; user: User | null };

// ============================================================================
// Utility Types
// ============================================================================

/**
 * User lookup criteria for finding users
 */
export interface UserLookupCriteria {
    /** User ID */
    id?: number;
    /** Username */
    username?: string;
    /** Email address */
    email?: string;
}

/**
 * User statistics for analytics and reporting
 */
export interface UserStatistics {
    /** Total number of users */
    totalUsers: number;
    /** Number of active users */
    activeUsers: number;
    /** Number of inactive users */
    inactiveUsers: number;
    /** Users by role */
    usersByRole: Array<{
        role: Role;
        count: number;
    }>;
    /** Recent user activity */
    recentActivity: {
        recentlyCreated: number;
        recentlyUpdated: number;
        recentlyLoggedIn: number;
    };
}

// ============================================================================
// Search and Filtering Types
// ============================================================================

/**
 * Advanced search criteria for users
 */
export interface UserSearchCriteria extends UserListFilterContract {
    /** Include deactivated users in results */
    includeInactive?: boolean;
    /** Sort order for results */
    sortBy?: 'username' | 'email' | 'firstName' | 'lastName' | 'createdAt' | 'lastActivity';
    /** Sort direction */
    sortDirection?: 'asc' | 'desc';
    /** Date range filters */
    dateFilters?: {
        createdAfter?: string;
        createdBefore?: string;
        lastActiveAfter?: string;
        lastActiveBefore?: string;
    };
}
