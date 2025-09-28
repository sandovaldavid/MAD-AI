/**
 * User List Mapper
 *
 * @description
 * Specialized mapper for transforming paginated user lists from the application layer
 * to presentation-optimized list data structures. Handles pagination metadata,
 * filtering state, and list-specific transformations.
 *
 * @responsibilities
 * - Transform paginated user results to UI-friendly list data
 * - Handle pagination metadata and navigation state
 * - Process filter criteria and search results
 * - Optimize data for table and list display components
 * - Generate bulk action configurations
 *
 * @architecture
 * - Specialized Mapper: Focused on list-specific transformations
 * - Pagination Support: Comprehensive pagination metadata handling
 * - Filter Integration: Search and filter state management
 * - Performance Optimized: Efficient transformations for large lists
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Presentation
 */

import type { User } from '@domain/entities/user.entity';
import type { ListUsersResult } from '@/app/application/types/users/users.types';
import type {
  UserListData,
  UserPaginationConfig,
  UserSearchCriteria,
  UserSelectionState,
  UserBulkAction,
  UserActionConfig,
} from '../types';
import { UserPresentationMapper } from './user-presentation.mapper';
import { UserListViewModel } from '../../../models/users/user-display.model';

/**
 * User List Mapper
 *
 * Static utility class for transforming application layer list results
 * into presentation layer list data structures optimized for UI consumption.
 */
export class UserListMapper {
  // ============================================================================
  // List Data Transformations
  // ============================================================================

  /**
   * Transform application layer ListUsersResult to presentation UserListData
   *
   * @param result Application layer result with users and pagination
   * @param currentPage Current page number (1-based)
   * @param pageSize Number of items per page
   * @param permissions Optional permissions mapping for users
   * @returns UserListData optimized for list components
   */
  static toListData(
    result: ListUsersResult,
    currentPage = 1,
    pageSize = 20,
    permissions?: Map<number, UserActionConfig>
  ): UserListData {
    const userViewModels = UserPresentationMapper.toListViewModels(result.users, permissions);
    const totalPages = Math.ceil(result.totalCount / pageSize);

    return {
      users: userViewModels.map((vm) => ({
        id: vm.id,
        displayName: vm.displayName,
        email: vm.email,
        username: vm.username,
        role: vm.role,
        status: vm.status,
        avatar: vm.avatar,
        initials: vm.initials,
        lastActivity: vm.lastActivity,
        createdAt: vm.createdAt,
        isActive: vm.isActive,
        canEdit: vm.canEdit,
        canDelete: vm.canDelete,
      })),
      totalCount: result.totalCount,
      currentPage,
      pageSize,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    };
  }

  /**
   * Transform Users array to UserListData (for non-paginated results)
   *
   * @param users Array of domain User entities
   * @param permissions Optional permissions mapping for users
   * @returns UserListData with pagination disabled
   */
  static fromUsersArray(users: User[], permissions?: Map<number, UserActionConfig>): UserListData {
    const userViewModels = UserPresentationMapper.toListViewModels(users, permissions);

    return {
      users: userViewModels.map((vm) => ({
        id: vm.id,
        displayName: vm.displayName,
        email: vm.email,
        username: vm.username,
        role: vm.role,
        status: vm.status,
        avatar: vm.avatar,
        initials: vm.initials,
        lastActivity: vm.lastActivity,
        createdAt: vm.createdAt,
        isActive: vm.isActive,
        canEdit: vm.canEdit,
        canDelete: vm.canDelete,
      })),
      totalCount: users.length,
      currentPage: 1,
      pageSize: users.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    };
  }

  // ============================================================================
  // Pagination Configuration
  // ============================================================================

  /**
   * Create pagination configuration with defaults
   *
   * @param currentPage Current page number
   * @param pageSize Number of items per page
   * @param customSizes Optional custom page size options
   * @returns UserPaginationConfig for pagination components
   */
  static createPaginationConfig(
    currentPage = 1,
    pageSize = 20,
    customSizes?: number[]
  ): UserPaginationConfig {
    const defaultSizes = [10, 20, 50, 100];
    const sizeOptions = customSizes || defaultSizes;

    return {
      page: Math.max(1, currentPage),
      pageSize: sizeOptions.includes(pageSize) ? pageSize : defaultSizes[1],
      showSizeOptions: true,
      sizeOptions,
    };
  }

  // ============================================================================
  // Selection State Management
  // ============================================================================

  /**
   * Create initial selection state for user list
   *
   * @param totalCount Total number of users in the list
   * @returns Empty UserSelectionState
   */
  static createInitialSelectionState(totalCount: number): UserSelectionState {
    return {
      selectedIds: new Set<number>(),
      isAllSelected: false,
      selectedCount: 0,
      totalCount,
    };
  }

  /**
   * Update selection state when user selection changes
   *
   * @param currentState Current selection state
   * @param userId User ID being toggled
   * @param isSelected Whether the user is being selected or deselected
   * @returns Updated UserSelectionState
   */
  static updateUserSelection(
    currentState: UserSelectionState,
    userId: number,
    isSelected: boolean
  ): UserSelectionState {
    const newSelectedIds = new Set(currentState.selectedIds);

    if (isSelected) {
      newSelectedIds.add(userId);
    } else {
      newSelectedIds.delete(userId);
    }

    const selectedCount = newSelectedIds.size;
    const isAllSelected = selectedCount > 0 && selectedCount === currentState.totalCount;

    return {
      selectedIds: newSelectedIds,
      isAllSelected,
      selectedCount,
      totalCount: currentState.totalCount,
    };
  }

  /**
   * Toggle select all users
   *
   * @param currentState Current selection state
   * @param availableUserIds Array of user IDs available for selection
   * @returns Updated UserSelectionState
   */
  static toggleSelectAll(
    currentState: UserSelectionState,
    availableUserIds: number[]
  ): UserSelectionState {
    if (currentState.isAllSelected || currentState.selectedCount > 0) {
      // Deselect all
      return {
        selectedIds: new Set<number>(),
        isAllSelected: false,
        selectedCount: 0,
        totalCount: currentState.totalCount,
      };
    } else {
      // Select all available
      return {
        selectedIds: new Set(availableUserIds),
        isAllSelected: availableUserIds.length === currentState.totalCount,
        selectedCount: availableUserIds.length,
        totalCount: currentState.totalCount,
      };
    }
  }

  // ============================================================================
  // Bulk Actions Configuration
  // ============================================================================

  /**
   * Get available bulk actions based on selected users
   *
   * @param selectedUsers Array of selected user data
   * @param currentUserPermissions Current user's permissions
   * @returns Array of available bulk actions
   */
  static getAvailableBulkActions(
    selectedUsers: UserListViewModel[],
    currentUserPermissions?: {
      canActivateUsers: boolean;
      canDeactivateUsers: boolean;
      canDeleteUsers: boolean;
      canExportUsers: boolean;
      canAssignRoles: boolean;
    }
  ): UserBulkAction[] {
    if (selectedUsers.length === 0) return [];

    const actions: UserBulkAction[] = [];
    const permissions = currentUserPermissions || {
      canActivateUsers: true,
      canDeactivateUsers: true,
      canDeleteUsers: true,
      canExportUsers: true,
      canAssignRoles: true,
    };

    // Check if any selected users can be activated
    const hasInactiveUsers = selectedUsers.some((user) => !user.isActive);
    if (hasInactiveUsers && permissions.canActivateUsers) {
      actions.push('activate');
    }

    // Check if any selected users can be deactivated
    const hasActiveUsers = selectedUsers.some((user) => user.isActive);
    if (hasActiveUsers && permissions.canDeactivateUsers) {
      actions.push('deactivate');
    }

    // Check if any selected users can be deleted
    const hasDeletableUsers = selectedUsers.some((user) => user.canDelete);
    if (hasDeletableUsers && permissions.canDeleteUsers) {
      actions.push('delete');
    }

    // Export is always available if user has permission
    if (permissions.canExportUsers) {
      actions.push('export');
    }

    // Role assignment if user has permission
    if (permissions.canAssignRoles) {
      actions.push('assignRole');
    }

    return actions;
  }

  // ============================================================================
  // Search and Filter Helpers
  // ============================================================================

  /**
   * Create default search criteria
   *
   * @returns UserSearchCriteria with default values
   */
  static createDefaultSearchCriteria(): UserSearchCriteria {
    return {
      searchTerm: '',
      statusFilter: 'all',
      roleFilter: '',
      sortBy: 'name',
      sortDirection: 'asc',
    };
  }

  /**
   * Check if search criteria has active filters
   *
   * @param criteria Search criteria to check
   * @returns Boolean indicating if any filters are active
   */
  static hasActiveFilters(criteria: UserSearchCriteria): boolean {
    return (
      criteria.searchTerm.trim().length > 0 ||
      criteria.statusFilter !== 'all' ||
      (criteria.roleFilter && criteria.roleFilter.length > 0) ||
      criteria.dateRange !== undefined
    );
  }

  /**
   * Get filter summary for display
   *
   * @param criteria Current search criteria
   * @returns Human-readable filter summary
   */
  static getFilterSummary(criteria: UserSearchCriteria): string {
    const filters: string[] = [];

    if (criteria.searchTerm.trim().length > 0) {
      filters.push(`search: "${criteria.searchTerm}"`);
    }

    if (criteria.statusFilter !== 'all') {
      filters.push(`status: ${criteria.statusFilter}`);
    }

    if (criteria.roleFilter && criteria.roleFilter !== '') {
      filters.push(`role: ${criteria.roleFilter}`);
    }

    if (criteria.dateRange) {
      filters.push(`date range: ${criteria.dateRange.startDate} - ${criteria.dateRange.endDate}`);
    }

    return filters.length > 0 ? filters.join(', ') : 'No active filters';
  }
}
