/**
 * Users Application Types
 *
 * @description
 * Minimal type definitions for Application Layer coordination.
 * These types provide simple interfaces for use case orchestration,
 * bridging domain contracts with facade requirements.
 *
 * @responsibilities
 * - Define minimal request interfaces for facade operations
 * - Provide type safety for user management coordination
 * - Keep complexity in appropriate layers (Domain/Infrastructure)
 *
 * @architecture
 * - Application layer: Simple coordination types only
 * - Domain layer: Business logic and contracts
 * - Infrastructure layer: DTOs and technical implementations
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Application
 */

import type { User } from '@domain/entities/user.entity';
import type {
  CreateUserContract,
  UpdateUserPatchContract,
  UserListFilterContract,
} from '@/app/domain/repositories/business/user.contract';

// ============================================================================
// Simple Request Interfaces (Application Layer Coordination)
// ============================================================================

/**
 * Simple request for creating a user
 */
export interface CreateUserRequest {
  userData: CreateUserContract;
  createdBy?: number;
  sendWelcomeNotification?: boolean;
}

/**
 * Simple request for updating a user
 */
export interface UpdateUserRequest {
  userId: number;
  updateData: UpdateUserPatchContract;
  notifyUser?: boolean;
}

/**
 * Simple request for listing users
 */
export interface ListUsersRequest {
  filter?: UserListFilterContract;
}

/**
 * Simple request for getting user by ID
 */
export interface GetUserByIdRequest {
  userId: number;
}

/**
 * Simple request for getting user by email
 */
export interface GetUserByEmailRequest {
  email: string;
}

/**
 * Simple request for getting user by username
 */
export interface GetUserByUsernameRequest {
  username: string;
}

/**
 * Simple request for deleting a user
 */
export interface DeleteUserRequest {
  userId: number;
}

/**
 * Simple request for activating a user
 */
export interface ActivateUserRequest {
  userId: number;
}

/**
 * Simple request for deactivating a user
 */
export interface DeactivateUserRequest {
  userId: number;
}

/**
 * Simple request for bulk creating users
 */
export interface BulkCreateUsersRequest {
  usersData: CreateUserContract[];
  createdBy?: number;
}

/**
 * Simple request for bulk updating users
 */
export interface BulkUpdateUsersRequest {
  updates: {
    userId: number;
    updateData: UpdateUserPatchContract;
  }[];
  requesterId?: number;
}

/**
 * Simple request for bulk deleting users
 */
export interface BulkDeleteUsersRequest {
  userIds: number[];
  requesterId?: number;
}

// ============================================================================
// Minimal Result Types (Domain entities returned directly)
// ============================================================================

/**
 * User creation result - returns domain entity directly
 */
export type CreateUserResult = User;

/**
 * User update result - returns domain entity directly
 */
export type UpdateUserResult = User;

/**
 * User listing result - returns domain entities directly
 */
export interface ListUsersResult {
  users: User[];
  totalCount: number;
}

/**
 * User detail result - returns domain entity directly
 */
export type GetUserResult = User;

/**
 * User deletion result - simple confirmation
 */
export interface DeleteUserResult {
  success: boolean;
  userId: number;
}

/**
 * Bulk create users result
 */
export interface BulkCreateUsersResult {
  created: User[];
  failed: {
    data: CreateUserContract;
    error: string;
  }[];
  totalProcessed: number;
  successCount: number;
  failureCount: number;
}

/**
 * Bulk update users result
 */
export interface BulkUpdateUsersResult {
  updated: User[];
  failed: {
    userId: number;
    updateData: UpdateUserPatchContract;
    error: string;
  }[];
  totalProcessed: number;
  successCount: number;
  failureCount: number;
}

/**
 * Bulk delete users result
 */
export interface BulkDeleteUsersResult {
  deleted: number[];
  failed: {
    userId: number;
    error: string;
  }[];
  totalProcessed: number;
  successCount: number;
  failureCount: number;
}

// ============================================================================
// Additional Types for Facade Operations
// ============================================================================

/**
 * User lookup criteria for flexible user finding
 */
export interface UserLookupCriteria {
  id?: number;
  email?: string;
  username?: string;
}

/**
 * User search criteria for advanced filtering
 */
export interface UserSearchCriteria {
  query: string;
  filters?: UserListFilterContract;
}

/**
 * User event types for cross-facade communication
 */
export type UserEvent =
  | { type: 'user-created'; user: User; notificationSent?: boolean }
  | { type: 'user-updated'; user: User; updatedFields?: string[] }
  | { type: 'user-deleted'; userId: number }
  | { type: 'user-activated'; user: User }
  | { type: 'user-deactivated'; user: User }
  | { type: 'bulk-operation-completed'; operation: string; results: Record<string, unknown> };

/**
 * User statistics for analytics
 */
export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersByRole: Record<string, number>;
  recentActivity: {
    recentlyCreated: number;
    recentlyUpdated: number;
    recentlyLoggedIn: number;
  };
}

/**
 * Users facade state interface
 */
export interface UsersState {
  users: User[];
  selectedUser: User | null;
  loading: boolean;
  error: string | null;
  currentFilter: UserListFilterContract | null;
  totalCount: number;
  lastBulkOperation: {
    type: 'create' | 'update' | 'delete' | null;
    result: BulkCreateUsersResult | BulkUpdateUsersResult | BulkDeleteUsersResult | null;
  };
}
