/**
 * @fileoverview Main User Facade Coordinator
 *
 * This file contains the main UserFacade class, which serves as the primary
 * entry point and coordinator for all user management operations. It combines
 * all specialized user facades into a unified interface while maintaining
 * backward compatibility with the original monolithic facade design.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { Injectable } from '@angular/core';

// Specialized Facade Imports
import { BaseUserFacade } from './base-user.facade';
import { UserCrudFacade } from './user-crud.facade';
import { UserLookupFacade } from './user-lookup.facade';
import { UserListFacade } from './user-list.facade';
import { UserStateFacade } from './user-state.facade';
import { UserUtilsFacade } from './user-utils.facade';

// Domain Imports
import type { User } from '@domain/entities/user.entity';

// Application Layer Imports
import type {
  CreateUserRequest,
  CreateUserResult,
  UpdateUserRequest,
  UpdateUserResult,
} from '@application/types/users.types';
import type {
  ListUsersRequest,
  ListUsersResult,
  UserSearchCriteria,
} from '@application/types/users.types';
import type {
  BulkCreateUsersResult,
  BulkUpdateUsersResult,
  BulkDeleteUsersResult,
} from '@application/types/users.types';
import type { UserLookupCriteria } from '@application/types/users.types';
import type { FacadeOpts } from '@application/types/facade-opts';

// Domain Contracts Imports
import type {
  CreateUserContract,
  UpdateUserPatchContract,
} from '@domain/repositories/business/user.contract';

/**
 * Main Users Facade Coordinator
 *
 * @description
 * The main coordinator facade that provides a unified interface for all user
 * management operations. This facade acts as a composition root, delegating
 * operations to specialized facades while presenting a single, cohesive API.
 * It maintains backward compatibility with the original monolithic facade while
 * benefiting from the improved maintainability of the decomposed architecture.
 *
 * @responsibilities
 * - Provide unified API for all user operations
 * - Coordinate between specialized facades
 * - Maintain shared state consistency
 * - Handle cross-cutting concerns
 * - Ensure backward compatibility
 * - Manage facade lifecycle and dependencies
 *
 * @architecture
 * - Composition Pattern: Combines specialized facades
 * - Facade Pattern: Provides unified interface to complex subsystem
 * - Coordinator Pattern: Orchestrates interactions between facades
 * - Delegation Pattern: Delegates specific operations to appropriate facades
 * - Bridge Pattern: Bridges old interface with new implementation
 *
 * @patterns
 * - Facade Pattern: Simplifies complex user management subsystem
 * - Composition Pattern: Combines specialized facades into unified interface
 * - Coordinator Pattern: Orchestrates interactions between facades
 * - Mediator Pattern: Mediates communication between different facade concerns
 * - Strategy Pattern: Delegates operations to appropriate specialized facades
 * - Template Method: Provides consistent operation patterns across facades
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class UsersFacade extends BaseUserFacade {
  // ============================================================================
  // Specialized Facade Coordination
  // ============================================================================

  constructor(
    // Inject all specialized facades for delegation
    private readonly crudFacade: UserCrudFacade,
    private readonly lookupFacade: UserLookupFacade,
    private readonly listFacade: UserListFacade,
    private readonly stateFacade: UserStateFacade,
    private readonly utilsFacade: UserUtilsFacade
  ) {
    super();
  }

  // ============================================================================
  // CRUD Operations (Delegated to UserCrudFacade)
  // ============================================================================

  /**
   * Create a new user
   * @param request User creation request with required user data
   * @param opts Optional facade configuration
   * @returns Promise resolving to the creation result
   */
  async createUser(request: CreateUserRequest, opts?: FacadeOpts): Promise<CreateUserResult> {
    return this.crudFacade.createUser(request, opts);
  }

  /**
   * Update an existing user
   * @param request User update request with user ID and updated data
   * @param opts Optional facade configuration
   * @returns Promise resolving to the update result
   */
  async updateUser(request: UpdateUserRequest, opts?: FacadeOpts): Promise<UpdateUserResult> {
    return this.crudFacade.updateUser(request, opts);
  }

  /**
   * Delete a user by ID
   * @param userId ID of the user to delete
   * @param opts Optional facade configuration
   * @returns Promise resolving when deletion is complete
   */
  async deleteUser(userId: number, opts?: FacadeOpts): Promise<void> {
    return this.crudFacade.deleteUser(userId, opts);
  }

  // ============================================================================
  // Lookup Operations (Delegated to UserLookupFacade)
  // ============================================================================

  /**
   * Get user by ID
   * @param userId ID of the user to retrieve
   * @param opts Optional facade configuration
   * @returns Promise resolving to the user or null if not found
   */
  async getUserById(userId: number, opts?: FacadeOpts): Promise<User | null> {
    return this.lookupFacade.getUserById(userId, opts);
  }

  /**
   * Get user by email
   * @param email Email of the user to retrieve
   * @param opts Optional facade configuration
   * @returns Promise resolving to the user or null if not found
   */
  async getUserByEmail(email: string, opts?: FacadeOpts): Promise<User | null> {
    return this.lookupFacade.getUserByEmail(email, opts);
  }

  /**
   * Get user by username
   * @param username Username of the user to retrieve
   * @param opts Optional facade configuration
   * @returns Promise resolving to the user or null if not found
   */
  async getUserByUsername(username: string, opts?: FacadeOpts): Promise<User | null> {
    return this.lookupFacade.getUserByUsername(username, opts);
  }

  /**
   * Find user with flexible criteria
   * @param criteria Search criteria for finding the user
   * @param opts Optional facade configuration
   * @returns Promise resolving to the user or null if not found
   */
  async findUser(criteria: UserLookupCriteria, opts?: FacadeOpts): Promise<User | null> {
    return this.lookupFacade.findUser(criteria, opts);
  }

  // ============================================================================
  // List Operations (Delegated to UserListFacade)
  // ============================================================================

  /**
   * List users with optional filtering
   * @param request Optional request with filtering criteria
   * @param opts Optional facade configuration
   * @returns Promise resolving to the list result
   */
  async listUsers(request?: ListUsersRequest, opts?: FacadeOpts): Promise<ListUsersResult> {
    console.log('UsersFacade.listUsers called with:', request);
    const result = await this.listFacade.listUsers(request, opts);
    console.log('UsersFacade.listUsers received result:', result);

    // Synchronize state with coordinated facade
    this._users.set(result.users);
    this._totalCount.set(result.totalCount);
    console.log('UsersFacade state synchronized - users count:', result.users.length);

    return result;
  }

  /**
   * Search users with specific criteria
   * @param criteria Search criteria for finding users
   * @param opts Optional facade configuration
   * @returns Promise resolving to the search result
   */
  async searchUsers(criteria: UserSearchCriteria, opts?: FacadeOpts): Promise<ListUsersResult> {
    const result = await this.listFacade.searchUsers(criteria, opts);

    // Synchronize state with coordinated facade
    this._users.set(result.users);
    this._totalCount.set(result.totalCount);

    return result;
  }

  // ============================================================================
  // State Operations (Delegated to UserStateFacade)
  // ============================================================================

  /**
   * Activate a user account
   * @param userId ID of the user to activate
   * @param opts Optional facade configuration
   * @returns Promise resolving when activation is complete
   */
  async activateUser(userId: number, opts?: FacadeOpts): Promise<void> {
    return this.stateFacade.activateUser(userId, opts);
  }

  /**
   * Deactivate a user account
   * @param userId ID of the user to deactivate
   * @param opts Optional facade configuration
   * @returns Promise resolving when deactivation is complete
   */
  async deactivateUser(userId: number, opts?: FacadeOpts): Promise<void> {
    return this.stateFacade.deactivateUser(userId, opts);
  }

  /**
   * Toggle user activation status
   * @param userId ID of the user to toggle
   * @param opts Optional facade configuration
   * @returns Promise resolving when status toggle is complete
   */
  async toggleUserStatus(userId: number, opts?: FacadeOpts): Promise<void> {
    return this.stateFacade.toggleUserStatus(userId, opts);
  }

  /**
   * Activate multiple users
   * @param userIds Array of user IDs to activate
   * @param opts Optional facade configuration
   * @returns Promise resolving when all activations are complete
   */
  async activateUsers(userIds: number[], opts?: FacadeOpts): Promise<void> {
    return this.stateFacade.batchActivateUsers(userIds, opts);
  }

  /**
   * Deactivate multiple users
   * @param userIds Array of user IDs to deactivate
   * @param opts Optional facade configuration
   * @returns Promise resolving when all deactivations are complete
   */
  async deactivateUsers(userIds: number[], opts?: FacadeOpts): Promise<void> {
    return this.stateFacade.batchDeactivateUsers(userIds, opts);
  }

  // ============================================================================
  // Utility Operations (Delegated to UserUtilsFacade)
  // ============================================================================

  /**
   * Select a user for detailed view
   * @param user User entity to select, or null to clear selection
   */
  selectUser(user: User | null): void {
    return this.utilsFacade.selectUser(user);
  }

  /**
   * Clear user selection
   */
  clearSelection(): void {
    return this.utilsFacade.clearSelection();
  }

  /**
   * Select user by ID
   * @param userId ID of the user to select
   * @returns boolean indicating whether the user was found and selected
   */
  selectUserById(userId: number): boolean {
    return this.utilsFacade.selectUserById(userId);
  }

  /**
   * Clear all error states
   */
  clearError(): void {
    return this.utilsFacade.clearError();
  }

  /**
   * Check if there is an active error
   * @returns boolean indicating whether there is an active error
   */
  hasError(): boolean {
    return this.utilsFacade.hasError();
  }

  /**
   * Reset all facade state to initial values
   */
  reset(): void {
    return this.utilsFacade.reset();
  }

  /**
   * Refresh the current user list
   * @param opts Optional facade configuration
   * @returns Promise that resolves when the refresh is complete
   */
  async refresh(opts?: FacadeOpts): Promise<void> {
    return this.utilsFacade.refresh(opts);
  }

  /**
   * Initialize facade with default data
   * @param opts Optional facade configuration
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(opts?: FacadeOpts): Promise<void> {
    return this.utilsFacade.initialize(opts);
  }

  /**
   * Get user count statistics
   * @returns Object containing user count statistics
   */
  getUserCountStats(): { total: number; active: number; inactive: number } {
    return this.utilsFacade.getUserCountStats();
  }

  /**
   * Check if facade is in loading state
   * @returns boolean indicating whether any operation is in progress
   */
  isLoading(): boolean {
    return this.utilsFacade.isLoading();
  }

  // ============================================================================
  // Enhanced Operations (Combination Methods)
  // ============================================================================

  /**
   * Create user and select for editing
   *
   * Combines user creation with immediate selection, useful for
   * create-and-edit workflows in the UI.
   *
   * @param request User creation request
   * @param opts Optional facade configuration
   * @returns Promise resolving to the created user
   */
  async createAndSelectUser(request: CreateUserRequest, opts?: FacadeOpts): Promise<User> {
    const result = await this.createUser(request, opts);
    this.selectUser(result);
    return result;
  }

  /**
   * Update user and select the updated result
   *
   * Updates a user with the provided request and selects the updated user.
   *
   * @param request User update request
   * @param opts Optional facade configuration
   * @returns Promise resolving to the updated user
   */
  async updateAndSelectUser(request: UpdateUserRequest, opts?: FacadeOpts): Promise<User> {
    const result = await this.updateUser(request, opts);
    this.selectUser(result);
    return result;
  }

  /**
   * Delete selected user
   *
   * Deletes the currently selected user and clears the selection.
   * Throws an error if no user is selected.
   *
   * @param opts Optional facade configuration
   * @returns Promise resolving when deletion is complete
   */
  async deleteSelectedUser(opts?: FacadeOpts): Promise<void> {
    const selectedUser = this.selectedUser();
    if (!selectedUser) {
      throw new Error('No user selected for deletion');
    }

    await this.deleteUser(selectedUser.id, opts);
    this.clearSelection();
  }
}
