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
import { UserExportFacade } from './user-export.facade';

// Domain Imports
import type { User } from '@domain/entities/user.entity';

// Application Layer Imports
import type {
  CreateUserRequest,
  UpdateUserRequest,
  ListUsersRequest,
  UserSearchCriteria,
  UserLookupCriteria,
} from '@application/types/users.types';
import type { UserExportConfig } from '@application/types/user-export.types';
import type { FacadeOpts } from '@application/types/facade-opts';
import type { Message } from '@application/types/message.type';

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
    private readonly utilsFacade: UserUtilsFacade,
    private readonly exportFacade: UserExportFacade
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
  async createUser(request: CreateUserRequest, opts?: FacadeOpts): Promise<Message> {
    const result = await this.crudFacade.createUser(request, opts);
    if (result.success) {
      return {
        success: true,
        message: 'Usuario creado exitosamente.',
        data: result['data'],
      };
    }
    return {
      success: false,
      message: 'Error al crear el usuario.',
      error: result['error'],
    };
  }

  /**
   * Update an existing user
   * @param request User update request with user ID and updated data
   * @param opts Optional facade configuration
   * @returns Promise resolving to the update result
   */
  async updateUser(request: UpdateUserRequest, opts?: FacadeOpts): Promise<Message> {
    const result = await this.crudFacade.updateUser(request, opts);
    if (result.success) {
      return {
        success: true,
        message: 'Usuario actualizado exitosamente.',
        data: result['data'],
      };
    }
    return {
      success: false,
      message: 'Error al actualizar el usuario.',
      error: result['error'],
    };
  }

  /**
   * Delete a user by ID
   * @param userId ID of the user to delete
   * @param opts Optional facade configuration
   * @returns Promise resolving when deletion is complete
   */
  async deleteUser(userId: number, opts?: FacadeOpts): Promise<Message> {
    const result = (await this.crudFacade.deleteUser(userId, opts)) as Message;
    if (result.success) {
      return {
        success: true,
        message: 'Usuario eliminado exitosamente.',
      };
    }
    return {
      success: false,
      message: 'Error al eliminar el usuario.',
      error: result['error'],
    };
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
  async getUserById(userId: number, opts?: FacadeOpts): Promise<Message> {
    const user = await this.lookupFacade.getUserById(userId, opts);
    if (user) {
      return {
        success: true,
        message: 'Usuario encontrado.',
        data: user,
      };
    }
    return {
      success: false,
      message: 'Usuario no encontrado.',
    };
  }

  /**
   * Get user by email
   * @param email Email of the user to retrieve
   * @param opts Optional facade configuration
   * @returns Promise resolving to the user or null if not found
   */
  async getUserByEmail(email: string, opts?: FacadeOpts): Promise<Message> {
    const user = await this.lookupFacade.getUserByEmail(email, opts);
    if (user) {
      return {
        success: true,
        message: 'Usuario encontrado.',
        data: user,
      };
    }
    return {
      success: false,
      message: 'Usuario no encontrado.',
    };
  }

  /**
   * Get user by username
   * @param username Username of the user to retrieve
   * @param opts Optional facade configuration
   * @returns Promise resolving to the user or null if not found
   */
  async getUserByUsername(username: string, opts?: FacadeOpts): Promise<Message> {
    const user = await this.lookupFacade.getUserByUsername(username, opts);
    if (user) {
      return {
        success: true,
        message: 'Usuario encontrado.',
        data: user,
      };
    }
    return {
      success: false,
      message: 'Usuario no encontrado.',
    };
  }

  /**
   * Find user with flexible criteria
   * @param criteria Search criteria for finding the user
   * @param opts Optional facade configuration
   * @returns Promise resolving to the user or null if not found
   */
  async findUser(criteria: UserLookupCriteria, opts?: FacadeOpts): Promise<Message> {
    const user = await this.lookupFacade.findUser(criteria, opts);
    if (user) {
      return {
        success: true,
        message: 'Usuario encontrado.',
        data: user,
      };
    }
    return {
      success: false,
      message: 'Usuario no encontrado.',
    };
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
  async listUsers(request?: ListUsersRequest, opts?: FacadeOpts): Promise<Message> {
    const result = await this.listFacade.listUsers(request, opts);
    this._users.set(result.users);
    this._totalCount.set(result.totalCount);
    if (result.users.length > 0) {
      return {
        success: true,
        message: 'Usuarios listados exitosamente.',
        data: result,
      };
    }
    return {
      success: false,
      message: 'No se encontraron usuarios.',
      data: result,
    };
  }

  /**
   * Search users with specific criteria
   * @param criteria Search criteria for finding users
   * @param opts Optional facade configuration
   * @returns Promise resolving to the search result
   */
  async searchUsers(criteria: UserSearchCriteria, opts?: FacadeOpts): Promise<Message> {
    const result = await this.listFacade.searchUsers(criteria, opts);
    this._users.set(result.users);
    this._totalCount.set(result.totalCount);
    if (result.users.length > 0) {
      return {
        success: true,
        message: 'Usuarios encontrados.',
        data: result,
      };
    }
    return {
      success: false,
      message: 'No se encontraron usuarios.',
      data: result,
    };
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
  async activateUser(userId: number, opts?: FacadeOpts): Promise<Message> {
    const result = (await this.stateFacade.activateUser(userId, opts)) as Message;
    if (result.success) {
      return {
        success: true,
        message: 'Usuario activado exitosamente.',
      };
    }
    return {
      success: false,
      message: 'Error al activar el usuario.',
      error: result['error'],
    };
  }

  /**
   * Deactivate a user account
   * @param userId ID of the user to deactivate
   * @param opts Optional facade configuration
   * @returns Promise resolving when deactivation is complete
   */
  async deactivateUser(userId: number, opts?: FacadeOpts): Promise<Message> {
    const result = (await this.stateFacade.deactivateUser(userId, opts)) as Message;
    if (result.success) {
      return {
        success: true,
        message: 'Usuario desactivado exitosamente.',
      };
    }
    return {
      success: false,
      message: 'Error al desactivar el usuario.',
      error: result['error'],
    };
  }

  /**
   * Toggle user activation status
   * @param userId ID of the user to toggle
   * @param opts Optional facade configuration
   * @returns Promise resolving when status toggle is complete
   */
  async toggleUserStatus(userId: number, opts?: FacadeOpts): Promise<Message> {
    const result = (await this.stateFacade.toggleUserStatus(userId, opts)) as Message;
    if (result.success) {
      return {
        success: true,
        message: 'Estado de usuario cambiado exitosamente.',
      };
    }
    return {
      success: false,
      message: 'Error al cambiar el estado del usuario.',
      error: result['error'],
    };
  }

  /**
   * Activate multiple users
   * @param userIds Array of user IDs to activate
   * @param opts Optional facade configuration
   * @returns Promise resolving when all activations are complete
   */
  async activateUsers(userIds: number[], opts?: FacadeOpts): Promise<Message> {
    const result = (await this.stateFacade.batchActivateUsers(userIds, opts)) as Message;
    if (result.success) {
      return {
        success: true,
        message: 'Usuarios activados exitosamente.',
      };
    }
    return {
      success: false,
      message: 'Error al activar los usuarios.',
      error: result['error'],
    };
  }

  /**
   * Deactivate multiple users
   * @param userIds Array of user IDs to deactivate
   * @param opts Optional facade configuration
   * @returns Promise resolving when all deactivations are complete
   */
  async deactivateUsers(userIds: number[], opts?: FacadeOpts): Promise<Message> {
    const result = (await this.stateFacade.batchDeactivateUsers(userIds, opts)) as Message;
    if (result.success) {
      return {
        success: true,
        message: 'Usuarios desactivados exitosamente.',
      };
    }
    return {
      success: false,
      message: 'Error al desactivar los usuarios.',
      error: result['error'],
    };
  }

  // ============================================================================
  // Utility Operations (Delegated to UserUtilsFacade)
  // ============================================================================

  /**
   * Select a user for detailed view
   * @param user User entity to select, or null to clear selection
   * @returns Message indicating selection result
   */
  selectUser(user: User | null): Message {
    return this.utilsFacade.selectUser(user);
  }

  /**
   * Clear user selection
   * @returns Message indicating selection cleared
   */
  clearSelection(): Message {
    return this.utilsFacade.clearSelection();
  }

  /**
   * Select user by ID
   * @param userId ID of the user to select
   * @returns Message indicating selection result
   */
  selectUserById(userId: number): Message {
    return this.utilsFacade.selectUserById(userId);
  }

  /**
   * Clear all error states
   * @returns Message indicating error cleared
   */
  clearError(): Message {
    return this.utilsFacade.clearError();
  }

  /**
   * Check if there is an active error
   * @returns Message indicating error state
   */
  hasError(): Message {
    return this.utilsFacade.hasError();
  }

  /**
   * Reset all facade state to initial values
   * @returns Message indicating reset result
   */
  reset(): Message {
    return this.utilsFacade.reset();
  }

  /**
   * Refresh the current user list
   * @param opts Optional facade configuration
   * @returns Promise<Message> indicating refresh result
   */
  async refresh(opts?: FacadeOpts): Promise<Message> {
    return this.utilsFacade.refresh(opts);
  }

  /**
   * Initialize facade with default data
   * @param opts Optional facade configuration
   * @returns Promise<Message> indicating initialization result
   */
  async initialize(opts?: FacadeOpts): Promise<Message> {
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
  async createAndSelectUser(request: CreateUserRequest, opts?: FacadeOpts): Promise<Message> {
    const result = await this.createUser(request, opts);
    if (result.success && result['data']) {
      this.selectUser(result['data']);
    }
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
  async updateAndSelectUser(request: UpdateUserRequest, opts?: FacadeOpts): Promise<Message> {
    const result = await this.updateUser(request, opts);
    if (result.success && result['data']) {
      this.selectUser(result['data']);
    }
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
  async deleteSelectedUser(opts?: FacadeOpts): Promise<Message> {
    const selectedUser = this.selectedUser();
    if (!selectedUser) {
      return {
        success: false,
        message: 'No hay usuario seleccionado para eliminar.',
      };
    }
    const result = await this.deleteUser(selectedUser.id, opts);
    if (result.success) {
      this.clearSelection();
    }
    return result;
  }

  // ============================================================================
  // Export Operations (Delegated to UserExportFacade)
  // ============================================================================

  /**
   * Export users by IDs
   * @param userIds Array of user IDs to export
   * @param options Export configuration options
   * @param opts Optional facade configuration
   * @returns Promise resolving to export result
   */
  async exportUsers(
    userIds: number[],
    options: Partial<UserExportConfig> = {},
    opts?: FacadeOpts
  ): Promise<Message> {
    // Pass the current users from main facade state to export facade
    const currentUsers = this.users();
    return this.exportFacade.exportUsersWithData(userIds, currentUsers, options, opts);
  }

  /**
   * Export all active users
   * @param options Export configuration options
   * @param opts Optional facade configuration
   * @returns Promise resolving to export result
   */
  async exportActiveUsers(
    options: Partial<UserExportConfig> = {},
    opts?: FacadeOpts
  ): Promise<Message> {
    const currentUsers = this.users();
    const activeUsers = currentUsers.filter((user) => user.active);
    const userIds = activeUsers.map((user) => user.id);
    return this.exportFacade.exportUsersWithData(userIds, currentUsers, options, opts);
  }

  /**
   * Export all inactive users
   * @param options Export configuration options
   * @param opts Optional facade configuration
   * @returns Promise resolving to export result
   */
  async exportInactiveUsers(
    options: Partial<UserExportConfig> = {},
    opts?: FacadeOpts
  ): Promise<Message> {
    const currentUsers = this.users();
    const inactiveUsers = currentUsers.filter((user) => !user.active);
    const userIds = inactiveUsers.map((user) => user.id);
    return this.exportFacade.exportUsersWithData(userIds, currentUsers, options, opts);
  }

  /**
   * Export users by role
   * @param roleName Name of the role to filter users
   * @param options Export configuration options
   * @param opts Optional facade configuration
   * @returns Promise resolving to export result
   */
  async exportUsersByRole(
    roleName: string,
    options: Partial<UserExportConfig> = {},
    opts?: FacadeOpts
  ): Promise<Message> {
    const currentUsers = this.users();
    const roleUsers = currentUsers.filter(
      (user) => user.role?.name?.toLowerCase() === roleName.toLowerCase()
    );
    const userIds = roleUsers.map((user) => user.id);
    return this.exportFacade.exportUsersWithData(userIds, currentUsers, options, opts);
  }

  /**
   * Quick export to CSV format
   */
  async exportToCsv(userIds: number[], opts?: FacadeOpts): Promise<Message> {
    return this.exportFacade.exportToCsv(userIds, opts);
  }

  /**
   * Quick export to JSON format
   */
  async exportToJson(userIds: number[], opts?: FacadeOpts): Promise<Message> {
    return this.exportFacade.exportToJson(userIds, opts);
  }

  /**
   * Comprehensive PDF export with all fields
   */
  async exportComprehensivePdf(
    userIds: number[],
    customTitle?: string,
    opts?: FacadeOpts
  ): Promise<Message> {
    return this.exportFacade.exportComprehensivePdf(userIds, customTitle, opts);
  }

  /**
   * Minimal CSV export with essential fields only
   */
  async exportMinimalCsv(userIds: number[], opts?: FacadeOpts): Promise<Message> {
    return this.exportFacade.exportMinimalCsv(userIds, opts);
  }
}
