import { Injectable, inject } from '@angular/core';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { NotificationsFacade } from '@application/facades/notifications.facade';
import { RoleStateFacade } from './role-state.facade';
import { LIST_ROLES_USECASE_PORT } from '@di/tokens';
import type { RoleSummary } from '@/app/application/mappers/role.mapper';
import type { ListRolesParams, FacadeOpts } from './role.types';
import { RoleApplicationMapper } from '@application/mappers/role.mapper';

/**
 * Search and filtering facade for roles
 *
 * Handles search, filtering, and pagination operations including:
 * - Text-based search across role properties
 * - Active/inactive filtering
 * - Combined search and filter operations
 *
 * Responsibilities:
 * - Execute search queries with text and active filters
 * - Apply search logic to role lists
 * - Update state with search results
 * - Provide user feedback for search operations
 */
@Injectable({ providedIn: 'root' })
export class RoleSearchFacade {
  private readonly errorTransformer = inject(ApplicationErrorTransformer);
  private readonly notifications = inject(NotificationsFacade);

  // Dependencies on other role facades
  private readonly roleState = inject(RoleStateFacade);
  private readonly listRolesUC = inject(LIST_ROLES_USECASE_PORT);

  constructor() {}

  /**
   * Execute operation with standardized error handling
   */
  private async executeOperation<T>(
    operation: () => Promise<T>,
    opts: FacadeOpts = {}
  ): Promise<T> {
    try {
      if (!opts.skipLoading) {
        this.roleState.setLoading(true);
      }
      this.roleState.clearError();
      return await operation();
    } catch (error) {
      const applicationError = this.errorTransformer.transform(error);
      this.roleState.setError(applicationError.message);

      if (!opts.silent) {
        this.notifications.notificationError(applicationError.message);
      }

      throw applicationError;
    } finally {
      if (!opts.skipLoading) {
        this.roleState.setLoading(false);
      }
    }
  }

  /**
   * Search roles with text query and/or active filter
   */
  async searchRoles(searchParams: ListRolesParams, opts: FacadeOpts = {}): Promise<RoleSummary[]> {
    return this.executeOperation(async () => {
      // Load all roles first
      const roles = await this.listRolesUC.execute();
      const allRoles = RoleApplicationMapper.toRoleSummaries(roles);

      // Apply search and filter logic
      const filteredRoles = allRoles.filter((role) => {
        const matchesSearch = searchParams.search
          ? role.name.toLowerCase().includes(searchParams.search.toLowerCase()) ||
            (role.description &&
              role.description.toLowerCase().includes(searchParams.search.toLowerCase()))
          : true;

        const matchesActive =
          searchParams.active !== undefined ? role.isActive === searchParams.active : true;

        return matchesSearch && matchesActive;
      });

      // Update state with search results
      this.roleState.setRoles(filteredRoles);

      if (!opts.silent) {
        const searchTerm = searchParams.search;
        const activeFilter = searchParams.active;
        let message = `Found ${filteredRoles.length} role(s)`;

        if (searchTerm && activeFilter !== undefined) {
          message += ` matching "${searchTerm}" with ${activeFilter ? 'active' : 'inactive'} status`;
        } else if (searchTerm) {
          message += ` matching "${searchTerm}"`;
        } else if (activeFilter !== undefined) {
          message += ` with ${activeFilter ? 'active' : 'inactive'} status`;
        }

        if (filteredRoles.length === 0) {
          this.notifications.warning('No roles found matching your search criteria');
        } else {
          this.notifications.success(message);
        }
      }

      return filteredRoles;
    }, opts);
  }

  /**
   * Quick search by name only
   */
  async searchByName(name: string, opts: FacadeOpts = {}): Promise<RoleSummary[]> {
    return this.searchRoles({ search: name }, opts);
  }

  /**
   * Filter by active status only
   */
  async filterByActiveStatus(active: boolean, opts: FacadeOpts = {}): Promise<RoleSummary[]> {
    return this.searchRoles({ active }, opts);
  }

  /**
   * Get only active roles
   */
  async getActiveRoles(opts: FacadeOpts = {}): Promise<RoleSummary[]> {
    return this.filterByActiveStatus(true, opts);
  }

  /**
   * Get only inactive roles
   */
  async getInactiveRoles(opts: FacadeOpts = {}): Promise<RoleSummary[]> {
    return this.filterByActiveStatus(false, opts);
  }

  /**
   * Clear all search filters and show all roles
   */
  async clearSearch(opts: FacadeOpts = {}): Promise<RoleSummary[]> {
    return this.executeOperation(async () => {
      // Load all roles without filters
      const roles = await this.listRolesUC.execute();
      const allRoles = RoleApplicationMapper.toRoleSummaries(roles);

      if (!opts.silent) {
        this.notifications.success('Search cleared. Showing all roles');
      }

      return allRoles;
    }, opts);
  }

  /**
   * Find exact role by name
   */
  async findRoleByName(name: string, opts: FacadeOpts = {}): Promise<RoleSummary | null> {
    return this.executeOperation(async () => {
      const roles = await this.listRolesUC.execute();
      const allRoles = RoleApplicationMapper.toRoleSummaries(roles);
      const role = allRoles.find((r) => r.name.toLowerCase() === name.toLowerCase());

      if (!role && !opts.silent) {
        this.notifications.warning(`No role found with name "${name}"`);
      }

      return role || null;
    }, opts);
  }

  /**
   * Get search suggestions based on partial name
   */
  async getSearchSuggestions(
    partialName: string,
    maxSuggestions = 5,
    opts: FacadeOpts = {}
  ): Promise<string[]> {
    return this.executeOperation(async () => {
      const roles = await this.listRolesUC.execute();
      const allRoles = RoleApplicationMapper.toRoleSummaries(roles);
      const suggestions = allRoles
        .filter((role) => role.name.toLowerCase().includes(partialName.toLowerCase()))
        .map((role) => role.name)
        .slice(0, maxSuggestions);
      return suggestions;
    }, opts);
  }
}
