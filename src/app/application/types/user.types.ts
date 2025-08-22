/**
 * Application Layer Types for User Management Feature
 * 
 * @description
 * This module contains request/response types, result patterns, and application-specific
 * contracts for user management operations. These types bridge the gap between the
 * presentation layer and the domain layer, providing clean interfaces for use cases
 * and facades while maintaining separation of concerns.
 * 
 * @architecture
 * - Request types: Input data for use cases (from presentation layer)
 * - Response types: Output data from use cases (to presentation layer)  
 * - Result patterns: Standardized success/failure handling
 * - Filter contracts: Search and pagination support
 * 
 * @since 1.0.0
 * @layer Application
 */

import type { User } from '@domain/entities/user.entity';
import type { 
    CreateUserContract, 
    UpdateUserPatchContract, 
    UserListFilterContract
} from '@domain/contracts/user.contract';

// ==========================================
// REQUEST TYPES
// ==========================================

/**
 * User creation request data
 */
export interface CreateUserRequest {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    roleId: number;
    isActive?: boolean;
    deviceInfo?: DeviceInfo;
}

/**
 * User update request data
 */
export interface UpdateUserRequest {
    id: number;
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    roleId?: number;
    isActive?: boolean;
    deviceInfo?: DeviceInfo;
}

/**
 * User list request with filtering and pagination
 */
export interface UserListRequest {
    status?: 'active' | 'inactive' | 'all';
    roleId?: number;
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'username' | 'email' | 'firstName' | 'lastName' | 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
    deviceInfo?: DeviceInfo;
}

/**
 * User search request data
 */
export interface UserSearchRequest {
    query: string;
    limit?: number;
    includeInactive?: boolean;
    deviceInfo?: DeviceInfo;
}

/**
 * Get user by ID request
 */
export interface GetUserByIdRequest {
    id: number;
    includePermissions?: boolean;
    deviceInfo?: DeviceInfo;
}

/**
 * Get user by email request
 */
export interface GetUserByEmailRequest {
    email: string;
    includePermissions?: boolean;
    deviceInfo?: DeviceInfo;
}

/**
 * Get user by username request
 */
export interface GetUserByUsernameRequest {
    username: string;
    includePermissions?: boolean;
    deviceInfo?: DeviceInfo;
}

/**
 * User activation request
 */
export interface ActivateUserRequest {
    id: number;
    reason?: string;
    deviceInfo?: DeviceInfo;
}

/**
 * User deactivation request
 */
export interface DeactivateUserRequest {
    id: number;
    reason?: string;
    deviceInfo?: DeviceInfo;
}

/**
 * Update user role request
 */
export interface UpdateUserRoleRequest {
    userId: number;
    roleId: number;
    reason?: string;
    deviceInfo?: DeviceInfo;
}

/**
 * Delete user request
 */
export interface DeleteUserRequest {
    id: number;
    reason?: string;
    hardDelete?: boolean;
    deviceInfo?: DeviceInfo;
}

/**
 * Bulk user update request
 */
export interface BulkUpdateUsersRequest {
    updates: Array<{
        id: number;
        data: Partial<UpdateUserRequest>;
    }>;
    reason?: string;
    deviceInfo?: DeviceInfo;
}

/**
 * Device information for tracking and security
 */
export interface DeviceInfo {
    userAgent?: string;
    deviceId?: string;
    platform?: string;
    ipAddress?: string;
    location?: {
        country?: string;
        city?: string;
        timezone?: string;
    };
}

// ==========================================
// RESULT TYPES
// ==========================================

/**
 * Base result class for application operations
 */
export abstract class ApplicationResult<T> {
    constructor(
        protected readonly _isSuccess: boolean,
        protected readonly data?: T,
        protected readonly _error?: string,
        protected readonly _metadata?: Record<string, any>
    ) {}

    get isSuccess(): boolean {
        return this._isSuccess;
    }

    get isFailure(): boolean {
        return !this._isSuccess;
    }

    get error(): string | undefined {
        return this._error;
    }

    get metadata(): Record<string, any> | undefined {
        return this._metadata;
    }
}

/**
 * Single user operation result
 */
export class UserResult extends ApplicationResult<User> {
    private constructor(
        isSuccess: boolean,
        data?: User,
        error?: string,
        metadata?: Record<string, any>
    ) {
        super(isSuccess, data, error, metadata);
    }

    static success(user: User, metadata?: Record<string, any>): UserResult {
        return new UserResult(true, user, undefined, {
            timestamp: Date.now(),
            operation: 'user_operation',
            ...metadata
        });
    }

    static failure(error: string, metadata?: Record<string, any>): UserResult {
        return new UserResult(false, undefined, error, {
            timestamp: Date.now(),
            operation: 'user_operation',
            ...metadata
        });
    }

    get user(): User {
        if (!this.isSuccess || !this.data) {
            throw new Error('Cannot access user from failed result');
        }
        return this.data;
    }
}

/**
 * User list operation result
 */
export class UserListResult extends ApplicationResult<User[]> {
    private constructor(
        isSuccess: boolean,
        data?: User[],
        error?: string,
        metadata?: Record<string, any>
    ) {
        super(isSuccess, data, error, metadata);
    }

    static success(users: User[], metadata?: Record<string, any>): UserListResult {
        return new UserListResult(true, users, undefined, {
            timestamp: Date.now(),
            operation: 'list_users',
            count: users.length,
            ...metadata
        });
    }

    static failure(error: string, metadata?: Record<string, any>): UserListResult {
        return new UserListResult(false, undefined, error, {
            timestamp: Date.now(),
            operation: 'list_users',
            ...metadata
        });
    }

    get users(): User[] {
        if (!this.isSuccess || !this.data) {
            throw new Error('Cannot access users from failed result');
        }
        return this.data;
    }

    get count(): number {
        return this.isSuccess && this.data ? this.data.length : 0;
    }
}

/**
 * User deletion result
 */
export class UserDeletionResult extends ApplicationResult<void> {
    private constructor(
        isSuccess: boolean,
        error?: string,
        metadata?: Record<string, any>
    ) {
        super(isSuccess, undefined, error, metadata);
    }

    static success(metadata?: Record<string, any>): UserDeletionResult {
        return new UserDeletionResult(true, undefined, {
            timestamp: Date.now(),
            operation: 'delete_user',
            ...metadata
        });
    }

    static failure(error: string, metadata?: Record<string, any>): UserDeletionResult {
        return new UserDeletionResult(false, error, {
            timestamp: Date.now(),
            operation: 'delete_user',
            ...metadata
        });
    }
}

/**
 * Bulk operation result
 */
export class BulkUserResult extends ApplicationResult<User[]> {
    private constructor(
        isSuccess: boolean,
        data?: User[],
        error?: string,
        metadata?: Record<string, any>
    ) {
        super(isSuccess, data, error, metadata);
    }

    static success(users: User[], metadata?: Record<string, any>): BulkUserResult {
        return new BulkUserResult(true, users, undefined, {
            timestamp: Date.now(),
            operation: 'bulk_user_operation',
            processedCount: users.length,
            ...metadata
        });
    }

    static failure(error: string, metadata?: Record<string, any>): BulkUserResult {
        return new BulkUserResult(false, undefined, error, {
            timestamp: Date.now(),
            operation: 'bulk_user_operation',
            ...metadata
        });
    }

    get users(): User[] {
        if (!this.isSuccess || !this.data) {
            throw new Error('Cannot access users from failed bulk result');
        }
        return this.data;
    }

    get processedCount(): number {
        return this.metadata?.['processedCount'] || 0;
    }
}
