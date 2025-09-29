import type {
  RoleSearchView,
  RoleFiltersView,
  DateRangeView,
} from '../../../models/roles/role.models';
import type {
  ListRolesRequest,
  GetRoleByIdRequest,
  GetRoleByNameRequest,
  GetUsersByRoleRequest,
  RoleFilters,
  PaginationOptions,
} from '@application/types/roles/roles.types';

/**
 * Mappers for converting Presentation layer search/filter models to Application layer query requests
 */

/**
 * Maps role search view to ListRolesRequest for the Application layer
 */
export function mapRoleSearchViewToListRequest(
  searchView: RoleSearchView,
  pagination?: PaginationOptions,
  requesterId?: number
): ListRolesRequest {
  return {
    filters: mapRoleFiltersViewToApplicationFilters(searchView.filters),
    pagination: pagination || {
      page: 1,
      pageSize: 10,
      sortBy: searchView.sortBy,
      sortOrder: searchView.sortDirection,
    },
    requesterId: requesterId,
  };
}

/**
 * Maps role filters view to Application layer role filters
 */
export function mapRoleFiltersViewToApplicationFilters(filtersView: RoleFiltersView): RoleFilters {
  return {
    isActive:
      filtersView.status === 'active'
        ? true
        : filtersView.status === 'inactive'
          ? false
          : undefined,
    accessLevel: filtersView.accessLevel,
    // Map UI-specific filters to application filters as needed
  };
}

/**
 * Maps date range view to filter parameters
 */
export function mapDateRangeToFilters(dateRange: DateRangeView): {
  startDate: string;
  endDate: string;
} {
  return {
    startDate: dateRange.start,
    endDate: dateRange.end,
  };
}

/**
 * Creates a simple get role by ID request
 */
export function createGetRoleByIdRequest(roleId: string, requesterId?: number): GetRoleByIdRequest {
  return {
    id: parseInt(roleId, 10),
    requesterId: requesterId,
  };
}

/**
 * Creates a get role by name request
 */
export function createGetRoleByNameRequest(
  roleName: string,
  requesterId?: number
): GetRoleByNameRequest {
  return {
    name: roleName.trim(),
    requesterId: requesterId,
  };
}

/**
 * Creates a get users by role request
 */
export function createGetUsersByRoleRequest(
  roleId: string,
  pagination?: PaginationOptions,
  requesterId?: number
): GetUsersByRoleRequest {
  return {
    roleId: parseInt(roleId, 10),
    pagination: pagination || { page: 1, pageSize: 20 },
    requesterId: requesterId,
  };
}

/**
 * Creates pagination options from UI parameters
 */
export function createPaginationOptions(
  page = 1,
  pageSize = 10,
  sortBy?: string,
  sortOrder: 'asc' | 'desc' = 'asc'
): PaginationOptions {
  return {
    page: Math.max(1, page),
    pageSize: Math.min(Math.max(1, pageSize), 100), // Limit page size
    sortBy: sortBy,
    sortOrder: sortOrder,
  };
}

/**
 * Validates role search parameters
 */
export function isValidRoleSearch(searchView: RoleSearchView): boolean {
  return !!(
    searchView &&
    typeof searchView.query === 'string' &&
    searchView.sortBy &&
    ['asc', 'desc'].includes(searchView.sortDirection)
  );
}

/**
 * Validates pagination options
 */
export function isValidPaginationOptions(pagination: PaginationOptions): boolean {
  return !!(
    pagination &&
    pagination.page > 0 &&
    pagination.pageSize > 0 &&
    pagination.pageSize <= 100 &&
    (!pagination.sortOrder || ['asc', 'desc'].includes(pagination.sortOrder))
  );
}
