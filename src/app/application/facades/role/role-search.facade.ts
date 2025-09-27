import { Injectable, inject } from '@angular/core';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { RoleStateFacade } from './role-state.facade';
import { LIST_ROLES_USECASE_PORT } from '@di/tokens';
import { RoleApplicationMapper } from '@application/mappers/role.mapper';
import type { RoleSummary } from '@/app/application/mappers/role.mapper';
import type { ListRolesParams, FacadeOpts } from './role.types';
import type { Message } from '@application/types/message.type';

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

  // Dependencies on other role facades
  private readonly roleState = inject(RoleStateFacade);
  private readonly listRolesUC = inject(LIST_ROLES_USECASE_PORT);

  /**
   * Execute operation with standardized error handling
   */
  private async executeOperation<T>(
    operation: () => Promise<T | Message>,
    opts: FacadeOpts = {}
  ): Promise<T | Message> {
    try {
      if (!opts.skipLoading) {
        this.roleState.setLoading(true);
      }
      this.roleState.clearError();
      return await operation();
    } catch (error) {
      const applicationError = this.errorTransformer.transform(error);
      this.roleState.setError(applicationError.message);
      return {
        success: false,
        error: `Error: ${applicationError.message}`,
        message: 'Ocurrió un error al buscar roles.',
      };
    } finally {
      if (!opts.skipLoading) {
        this.roleState.setLoading(false);
      }
    }
  }

  /**
   * Search roles with text query and/or active filter
   */
  async searchRoles(
    searchParams: ListRolesParams,
    opts: FacadeOpts = {}
  ): Promise<RoleSummary[] | Message> {
    return this.executeOperation(async () => {
      // Cargar todos los roles primero
      const roles = await this.listRolesUC.execute();
      const allRoles = RoleApplicationMapper.toRoleSummaries(roles);

      // Aplicar lógica de búsqueda y filtro
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

      // Actualizar estado con resultados de búsqueda
      this.roleState.setRoles(filteredRoles);

      if (filteredRoles.length === 0) {
        return {
          success: false,
          error: 'No se encontraron roles que coincidan con los criterios de búsqueda.',
          message: 'No se encontraron roles para los filtros aplicados.',
        };
      }

      return filteredRoles;
    }, opts);
  }

  /**
   * Quick search by name only
   */
  async searchByName(name: string, opts: FacadeOpts = {}): Promise<RoleSummary[] | Message> {
    return this.searchRoles({ search: name }, opts);
  }

  /**
   * Filter by active status only
   */
  async filterByActiveStatus(
    active: boolean,
    opts: FacadeOpts = {}
  ): Promise<RoleSummary[] | Message> {
    return this.searchRoles({ active }, opts);
  }

  /**
   * Get only active roles
   */
  async getActiveRoles(opts: FacadeOpts = {}): Promise<RoleSummary[] | Message> {
    return this.filterByActiveStatus(true, opts);
  }

  /**
   * Get only inactive roles
   */
  async getInactiveRoles(opts: FacadeOpts = {}): Promise<RoleSummary[] | Message> {
    return this.filterByActiveStatus(false, opts);
  }

  /**
   * Clear all search filters and show all roles
   */
  async clearSearch(opts: FacadeOpts = {}): Promise<RoleSummary[] | Message> {
    return this.executeOperation(async () => {
      // Cargar todos los roles sin filtros
      const roles = await this.listRolesUC.execute();
      const allRoles = RoleApplicationMapper.toRoleSummaries(roles);

      if (allRoles.length === 0) {
        return {
          success: false,
          error: 'No hay roles disponibles para mostrar.',
          message: 'No se encontraron roles para mostrar.',
        };
      }

      return allRoles;
    }, opts);
  }

  /**
   * Find exact role by name
   */
  async findRoleByName(name: string, opts: FacadeOpts = {}): Promise<RoleSummary | Message> {
    return this.executeOperation(async () => {
      const roles = await this.listRolesUC.execute();
      const allRoles = RoleApplicationMapper.toRoleSummaries(roles);
      const role = allRoles.find((r) => r.name.toLowerCase() === name.toLowerCase());

      if (!role) {
        return {
          success: false,
          error: `No se encontró un rol con el nombre "${name}".`,
          message: 'No se encontró el rol solicitado.',
        };
      }

      return role;
    }, opts);
  }

  /**
   * Get search suggestions based on partial name
   */
  async getSearchSuggestions(
    partialName: string,
    maxSuggestions = 5,
    opts: FacadeOpts = {}
  ): Promise<string[] | Message> {
    return this.executeOperation(async () => {
      const roles = await this.listRolesUC.execute();
      const allRoles = RoleApplicationMapper.toRoleSummaries(roles);
      const suggestions = allRoles
        .filter((role) => role.name.toLowerCase().includes(partialName.toLowerCase()))
        .map((role) => role.name)
        .slice(0, maxSuggestions);
      if (suggestions.length === 0) {
        return {
          success: false,
          error: 'No se encontraron sugerencias para la búsqueda.',
          message: 'No hay sugerencias disponibles.',
        };
      }
      return suggestions;
    }, opts);
  }
}
