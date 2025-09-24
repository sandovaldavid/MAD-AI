/**
 * @fileoverview User Listing Operations Facade
 *
 * This file contains the UserListFacade class, which handles user listing,
 * filtering, and search operations. It extends the BaseUserFacade to leverage
 * shared state and dependencies while focusing solely on list management functionality.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { Injectable } from '@angular/core';
import { BaseUserFacade } from './base-user.facade';
import type { Message } from '@application/types/message.type';

// Domain Imports
import type { UserListFilterContract } from '@domain/repositories/business/user.contract';

// Application Layer Imports
import type { FacadeOpts } from '@application/types/facade-opts';
import type {
  ListUsersRequest,
  ListUsersResult,
  UserSearchCriteria,
} from '@application/types/users.types';

/**
 * User Listing Operations Facade
 *
 * @description
 * Specialized facade handling user listing, filtering, and search operations.
 * This facade focuses exclusively on retrieving and managing collections of users
 * with support for pagination, filtering, and advanced search capabilities.
 *
 * @responsibilities
 * - Handle paginated user listing with optional filtering
 * - Process advanced user search with multiple criteria
 * - Manage filter state and list synchronization
 * - Coordinate list updates with local state management
 * - Emit events for list operations and filter changes
 * - Provide convenient methods for common listing scenarios
 *
 * @architecture
 * - Extends BaseUserFacade for shared state and dependencies
 * - Follows Single Responsibility Principle for list operations
 * - Uses reactive state management via inherited signals
 * - Delegates business logic to domain use cases
 * - Maintains filter state for consistent list management
 *
 * @patterns
 * - Facade Pattern: Simplifies user listing interface
 * - Command Pattern: Each operation delegates to specific use case
 * - Observer Pattern: Emits events for list state changes
 * - Template Method: Uses base class methods for common operations
 * - Strategy Pattern: Different listing strategies based on criteria
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class UserListFacade extends BaseUserFacade {
  // ============================================================================
  // User Listing and Filtering Operations
  // ============================================================================

  /**
   * List users with optional filtering
   *
   * Retrieves a paginated list of users with optional filtering criteria.
   * This method supports various filter options including search terms,
   * status filters, role filters, and pagination parameters. The results
   * update the local state and emit events for cross-facade coordination.
   *
   * @param request Optional list request with filter criteria and pagination
   * @param opts Optional facade configuration (skipLoading, etc.)
   * @returns Promise resolving to paginated list result with users and metadata
   * @throws Error if listing operation fails or invalid filters are provided
   *
   * @example
   * ```typescript
   * // List all users with default pagination
   * const result = await userListFacade.listUsers();
   *
   * // List users with filters
   * const result = await userListFacade.listUsers({
   *   filter: {
   *     isActive: true,
   *     searchTerm: 'john',
   *     role: 'admin'
   *   },
   *   pagination: {
   *     page: 1,
   *     pageSize: 20
   *   }
   * });
   *
   * // List users without loading indicator
   * const result = await userListFacade.listUsers(undefined, { skipLoading: true });
   * ```
   */
  async listUsers(
    request?: ListUsersRequest,
    opts?: FacadeOpts
  ): Promise<ListUsersResult | Message> {
    if (!opts?.skipLoading) {
      this.setLoading(true);
    }
    this.setError(null);

    try {
      const result = await this.listUsersUC.execute(request);

      // Actualiza el estado local
      this._users.set(result.users);
      this._currentFilter.set(request?.filter || null);
      this._totalCount.set(result.totalCount);

      // Emitir evento de actualización de lista
      this.emitEvent({
        type: 'bulk-operation-completed',
        operation: 'list-users',
        results: result,
      });

      if (result.users.length === 0) {
        return {
          success: false,
          error: 'No se encontraron usuarios para los filtros aplicados.',
          message: 'No se encontraron usuarios que coincidan con los criterios de búsqueda.',
        };
      }

      return result;
    } catch (error: unknown) {
      this.handleError(error);
      return {
        success: false,
        error: 'Ocurrió un error al listar los usuarios.',
        message: 'No se pudo obtener la lista de usuarios. Por favor, intenta nuevamente.',
      };
    } finally {
      if (!opts?.skipLoading) {
        this.setLoading(false);
      }
    }
  }

  /**
   * Search users with advanced criteria
   *
   * Performs a flexible search across user data using query terms and optional filters.
   * This method supports full-text search across user fields and can be combined with
   * additional filtering criteria for precise user discovery. The search functionality
   * provides a more flexible alternative to basic listing with filters.
   *
   * @param criteria Object containing search query and optional additional filters
   * @param opts Optional facade configuration for the search operation
   * @returns Promise resolving to list of matching users
   * @throws Error if search operation fails or invalid search criteria are provided
   *
   * @example
   * ```typescript
   * // Simple text search across user fields
   * const results = await userListFacade.searchUsers({
   *   query: 'john',
   *   filters: { isActive: true }
   * });
   *
   * // Advanced search with multiple filters
   * const results = await userListFacade.searchUsers({
   *   query: 'admin',
   *   filters: {
   *     role: 'administrator',
   *     department: 'IT',
   *     isActive: true
   *   }
   * });
   *
   * // Search without specific query (filter-only search)
   * const results = await userListFacade.searchUsers({
   *   query: '',
   *   filters: {
   *     role: 'manager'
   *   }
   * });
   * ```
   */
  async searchUsers(
    criteria: UserSearchCriteria,
    opts?: FacadeOpts
  ): Promise<ListUsersResult | Message> {
    // Convert search criteria to filter format for the list use case
    // This could be enhanced with dedicated search logic in the future
    const filter: UserListFilterContract = {
      searchTerm: criteria.query,
      ...criteria.filters,
    };

    const request: ListUsersRequest = {
      filter,
      requesterId: this.getCurrentUserId(),
    };

    return this.listUsers(request, opts);
  }

  /**
   * Load users with specific filter
   *
   * Convenience method for loading users with a specific filter configuration.
   * This method provides a simplified interface when you only need to apply
   * filters without dealing with the full request structure.
   *
   * @param filter Filter criteria to apply to the user list
   * @param opts Optional facade configuration for the load operation
   * @returns Promise resolving to filtered list of users
   *
   * @example
   * ```typescript
   * // Load only active users
   * await userListFacade.loadUsersWithFilter({ isActive: true });
   *
   * // Load users by role
   * await userListFacade.loadUsersWithFilter({ role: 'admin' });
   *
   * // Load users with search term
   * await userListFacade.loadUsersWithFilter({ searchTerm: 'john' });
   * ```
   */
  async loadUsersWithFilter(
    filter: UserListFilterContract,
    opts?: FacadeOpts
  ): Promise<ListUsersResult | Message> {
    return this.listUsers({ filter, requesterId: this.getCurrentUserId() }, opts);
  }

  /**
   * Load next page of users
   *
   * Convenience method for pagination that loads the next page of users
   * while preserving the current filter criteria. This method is useful
   * for implementing pagination controls in the UI. Note that pagination
   * state management would need to be implemented separately.
   *
   * @param opts Optional facade configuration for the load operation
   * @returns Promise resolving to next page of users
   *
   * @example
   * ```typescript
   * // Load next page
   * await userListFacade.loadNextPage();
   * ```
   */
  async loadNextPage(opts?: FacadeOpts): Promise<ListUsersResult | Message> {
    const currentFilter = this._currentFilter();

    // Implementation would need to track current page state
    // This is a simplified version - full implementation would manage pagination state
    const request: ListUsersRequest = {
      filter: currentFilter || undefined,
      requesterId: this.getCurrentUserId(),
    };

    return this.listUsers(request, opts);
  }

  /**
   * Clear current filter and reload users
   *
   * Resets any applied filters and reloads the user list with default
   * parameters. This method is useful for implementing "clear filters"
   * functionality in the UI.
   *
   * @param opts Optional facade configuration for the reload operation
   * @returns Promise resolving to unfiltered list of users
   *
   * @example
   * ```typescript
   * // Clear all filters and reload
   * await userListFacade.clearFilterAndReload();
   * ```
   */
  async clearFilterAndReload(opts?: FacadeOpts): Promise<ListUsersResult | Message> {
    // Create a request with cleared filter but preserve requester ID
    const clearRequest: ListUsersRequest = {
      filter: undefined,
      requesterId: this.getCurrentUserId(),
    };

    return this.listUsers(clearRequest, opts);
  }
}
