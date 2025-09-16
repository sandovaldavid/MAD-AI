import { Injectable, inject } from '@angular/core';
import { RoleStateFacade } from './role-state.facade';
import { RoleCrudFacade } from './role-crud.facade';
import { RoleActivationFacade } from './role-activation.facade';
import { RoleAssignmentFacade } from './role-assignment.facade';
import { RoleSearchFacade } from './role-search.facade';
import { RoleExportFacade } from './role-export.facade';
import type {
  ListRolesParams,
  CreateRoleData,
  UpdateRoleData,
  FacadeOpts,
} from './role.types';
import type { RoleSummary } from '@/app/application/mappers/role.mapper';
import type { User } from '@domain/entities/user.entity';
import type { RoleExportConfig } from '@application/types/role-export.types';

/**
 * Main Role Facade - Orchestrator
 *
 * This facade serves as the main entry point for all role-related operations.
 * It composes and orchestrates multiple specialized role facades while maintaining
 * backward compatibility with the original monolithic RolesFacade.
 *
 * Architecture:
 * - Delegates operations to specialized facades based on functionality
 * - Maintains a unified public API for easy consumption
 * - Provides backward compatibility for existing code
 * - Exposes reactive state through the RoleStateFacade
 *
 * Specialized Facades:
 * - RoleStateFacade: Reactive state management
 * - RoleCrudFacade: Basic CRUD operations
 * - RoleActivationFacade: Activation/deactivation
 * - RoleAssignmentFacade: User-role assignments
 * - RoleBulkFacade: Bulk operations
 * - RoleSearchFacade: Search and filtering
 * - RoleExportFacade: Export operations
 */
@Injectable({ providedIn: 'root' })
export class RolesFacade {
  // Specialized facades
  private readonly roleState = inject(RoleStateFacade);
  private readonly roleCrud = inject(RoleCrudFacade);
  private readonly roleActivation = inject(RoleActivationFacade);
  private readonly roleAssignment = inject(RoleAssignmentFacade);
  private readonly roleSearch = inject(RoleSearchFacade);
  private readonly roleExport = inject(RoleExportFacade);

  constructor() {}

  // ========================================
  // State Management (delegates to RoleStateFacade)
  // ========================================

  /** Reactive loading state */
  get loading() {
    return this.roleState.loading;
  }

  /** Reactive error state */
  get error() {
    return this.roleState.error;
  }

  /** Reactive roles collection */
  get roles() {
    return this.roleState.roles;
  }

  /** Reactive current selected role */
  get currentRole() {
    return this.roleState.currentRole;
  }

  /** Reactive users assigned to current role */
  get roleUsers() {
    return this.roleState.roleUsers;
  }

  /** Reactive current applied filters */
  get currentFilters() {
    return this.roleState.currentFilters;
  }

  /** Reactive total roles count */
  get totalRoles() {
    return this.roleState.totalRoles;
  }

  /** Reactive active roles count */
  get activeRoles() {
    return this.roleState.activeRoles;
  }

  /** Reactive inactive roles count */
  get inactiveRoles() {
    return this.roleState.inactiveRoles;
  }

  /** Reactive boolean indicating if a role is selected */
  get hasSelectedRole() {
    return this.roleState.hasSelectedRole;
  }

  /** Get role statistics */
  get statistics() {
    return {
      totalRoles: this.roleState.totalRoles(),
      activeRoles: this.roleState.activeRoles(),
      inactiveRoles: this.roleState.inactiveRoles(),
    };
  }

  /** Clear current error state */
  clearError(): void {
    this.roleState.clearError();
  }

  /** Clear current role selection */
  clearCurrentRole(): void {
    this.roleState.clearCurrentRole();
  }

  /** Clear current role users */
  clearRoleUsers(): void {
    this.roleState.setRoleUsers([]);
  }

  // ========================================
  // CRUD Operations (delegates to RoleCrudFacade)
  // ========================================

  /** Load all roles with optional parameters */
  async loadRoles(opts?: FacadeOpts): Promise<void> {
    return this.roleCrud.loadRoles(opts);
  }

  /**
   * Refresh the roles list (backward compatibility alias)
   * @param params Optional filter parameters
   * @param opts Facade options
   */
  async refresh(params?: ListRolesParams, opts?: FacadeOpts): Promise<void> {
    if (params) {
      // If parameters are provided, use search method
      await this.roleSearch.searchRoles(params, opts);
    } else {
      // If no parameters, load all roles
      return this.roleCrud.loadRoles(opts);
    }
  }

  /** Load a specific role by ID */
  async loadRole(roleId: number, opts?: FacadeOpts): Promise<void> {
    return this.roleCrud.loadRole(roleId, opts);
  }

  /** Create a new role */
  async createRole(roleData: CreateRoleData, opts?: FacadeOpts): Promise<void> {
    await this.roleCrud.createRole(roleData, opts);
  }

  /** Update an existing role */
  async updateRole(roleId: number, roleData: UpdateRoleData, opts?: FacadeOpts): Promise<void> {
    await this.roleCrud.updateRole(roleId, roleData, opts);
  }

  /** Delete a role */
  async deleteRole(roleId: number, opts?: FacadeOpts): Promise<void> {
    return this.roleCrud.deleteRole(roleId, opts);
  }

  /** Find role by name */
  async findRoleByName(name: string, opts?: FacadeOpts): Promise<void> {
    await this.roleCrud.findRoleByName(name);
    // Return void to match the facade pattern - users get data through reactive state
  }

  // ========================================
  // Activation Operations (delegates to RoleActivationFacade)
  // ========================================

  /** Activate a role */
  async activateRole(roleId: number, opts?: FacadeOpts): Promise<void> {
    await this.roleActivation.activateRole(roleId, opts);
  }

  /** Deactivate a role */
  async deactivateRole(roleId: number, opts?: FacadeOpts): Promise<void> {
    await this.roleActivation.deactivateRole(roleId, opts);
  }

  /** Toggle role activation status */
  async toggleRoleActivation(roleId: number, opts?: FacadeOpts): Promise<void> {
    await this.roleActivation.toggleRoleActivation(roleId, opts);
  }

  // ========================================
  // Assignment Operations (delegates to RoleAssignmentFacade)
  // ========================================

  /** Load users assigned to a role */
  async loadRoleUsers(roleId: number, opts?: FacadeOpts): Promise<User[]> {
    return this.roleAssignment.loadRoleUsers(roleId, opts);
  }

  /** Assign a role to a user */
  async assignRoleToUser(roleId: number, userId: number, opts?: FacadeOpts): Promise<void> {
    return this.roleAssignment.assignRoleToUser(roleId, userId, opts);
  }

  /** Unassign a role from a user */
  async unassignRoleFromUser(roleId: number, userId: number, opts?: FacadeOpts): Promise<void> {
    return this.roleAssignment.unassignRoleFromUser(roleId, userId, opts);
  }

  // ========================================
  // Search Operations (delegates to RoleSearchFacade)
  // ========================================

  /** Search roles with parameters */
  async searchRoles(searchParams: ListRolesParams, opts?: FacadeOpts): Promise<RoleSummary[]> {
    return this.roleSearch.searchRoles(searchParams, opts);
  }

  /** Search roles by name only */
  async searchByName(name: string, opts?: FacadeOpts): Promise<RoleSummary[]> {
    return this.roleSearch.searchByName(name, opts);
  }

  /** Filter roles by active status */
  async filterByActiveStatus(active: boolean, opts?: FacadeOpts): Promise<RoleSummary[]> {
    return this.roleSearch.filterByActiveStatus(active, opts);
  }

  /** Get only active roles */
  async getActiveRoles(opts?: FacadeOpts): Promise<RoleSummary[]> {
    return this.roleSearch.getActiveRoles(opts);
  }

  /** Get only inactive roles */
  async getInactiveRoles(opts?: FacadeOpts): Promise<RoleSummary[]> {
    return this.roleSearch.getInactiveRoles(opts);
  }

  /** Clear search filters */
  async clearSearch(opts?: FacadeOpts): Promise<RoleSummary[]> {
    return this.roleSearch.clearSearch(opts);
  }

  /** Get search suggestions */
  async getSearchSuggestions(
    partialName: string,
    maxSuggestions?: number,
    opts?: FacadeOpts
  ): Promise<string[]> {
    return this.roleSearch.getSearchSuggestions(partialName, maxSuggestions, opts);
  }

  // ========================================
  // Export Operations (delegates to RoleExportFacade)
  // ========================================

  /** Export selected roles */
  async exportRoles(
    roleIds: number[],
    options: Partial<RoleExportConfig>,
    opts?: FacadeOpts
  ): Promise<void> {
    return this.roleExport.exportRoles(roleIds, options, opts);
  }

  /** Export all visible roles */
  async exportAllVisibleRoles(
    options: Partial<RoleExportConfig>,
    opts?: FacadeOpts
  ): Promise<void> {
    return this.roleExport.exportAllVisibleRoles(options, opts);
  }

  /** Export only active roles */
  async exportActiveRoles(options: Partial<RoleExportConfig>, opts?: FacadeOpts): Promise<void> {
    return this.roleExport.exportActiveRoles(options, opts);
  }

  /** Export roles by access level */
  async exportRolesByAccessLevel(
    accessLevel: number,
    options: Partial<RoleExportConfig>,
    opts?: FacadeOpts
  ): Promise<void> {
    return this.roleExport.exportRolesByAccessLevel(accessLevel, options, opts);
  }

  /** Quick CSV export */
  async quickCSVExport(roleIds: number[], opts?: FacadeOpts): Promise<void> {
    return this.roleExport.quickCSVExport(roleIds, opts);
  }

  /** Quick JSON export */
  async quickJSONExport(roleIds: number[], opts?: FacadeOpts): Promise<void> {
    return this.roleExport.quickJSONExport(roleIds, opts);
  }

  /** Export detailed report */
  async exportDetailedReport(
    roleIds: number[],
    format?: 'csv' | 'json' | 'pdf',
    opts?: FacadeOpts
  ): Promise<void> {
    return this.roleExport.exportDetailedReport(roleIds, format, opts);
  }

  /** Export summary report */
  async exportSummaryReport(
    roleIds: number[],
    format?: 'csv' | 'json',
    opts?: FacadeOpts
  ): Promise<void> {
    return this.roleExport.exportSummaryReport(roleIds, format, opts);
  }

  /** Get export preview */
  async getExportPreview(
    roleIds: number[],
    options: Partial<RoleExportConfig>,
    opts?: FacadeOpts
  ): Promise<any[]> {
    return this.roleExport.getExportPreview(roleIds, options, opts);
  }

  // ========================================
  // Formatting Operations (Presentation Layer Support)
  // ========================================

  /**
   * Format role for display label
   *
   * @param roleSummary Role summary from Application layer
   * @returns Formatted display label
   */
  formatRoleLabel(roleSummary: RoleSummary): string {
    return `${roleSummary.name} (L${roleSummary.accessLevel})`;
  }

  /**
   * Format role for short display
   *
   * @param roleSummary Role summary from Application layer
   * @returns Short role label
   */
  formatRoleShortLabel(roleSummary: RoleSummary): string {
    return roleSummary.name;
  }

  /**
   * Format role for detailed display
   *
   * @param roleSummary Role summary from Application layer
   * @returns Detailed role label with status and user count
   */
  formatRoleDetailedLabel(roleSummary: RoleSummary): string {
    const status = roleSummary.isActive ? 'Active' : 'Inactive';
    const userText = roleSummary.userCount === 1 ? 'user' : 'users';
    return `${this.formatRoleLabel(roleSummary)} - ${status} - ${roleSummary.userCount} ${userText}`;
  }

  /**
   * Format role for different display contexts
   *
   * @param roleSummary Role summary from Application layer
   * @param context Display context
   * @returns Context-appropriate formatted role
   */
  formatRoleForContext(
    roleSummary: RoleSummary,
    context: 'label' | 'short' | 'detailed' | 'name-only'
  ): string {
    switch (context) {
      case 'label':
        return this.formatRoleLabel(roleSummary);
      case 'short':
        return this.formatRoleShortLabel(roleSummary);
      case 'detailed':
        return this.formatRoleDetailedLabel(roleSummary);
      case 'name-only':
        return roleSummary.name;
      default:
        return this.formatRoleLabel(roleSummary);
    }
  }

  /**
   * Get role display variants
   *
   * @param roleSummary Role summary from Application layer
   * @returns Object with different display variants
   */
  getRoleDisplayVariants(roleSummary: RoleSummary): {
    name: string;
    label: string;
    short: string;
    detailed: string;
    badge: string;
    accessLevel: string;
  } {
    return {
      name: roleSummary.name,
      label: this.formatRoleLabel(roleSummary),
      short: this.formatRoleShortLabel(roleSummary),
      detailed: this.formatRoleDetailedLabel(roleSummary),
      badge: roleSummary.name,
      accessLevel: `L${roleSummary.accessLevel}`,
    };
  }

  /**
   * Format role status for display
   *
   * @param roleSummary Role summary from Application layer
   * @returns Formatted status
   */
  formatRoleStatus(roleSummary: RoleSummary): string {
    return roleSummary.isActive ? 'Active' : 'Inactive';
  }

  /**
   * Create role summary text
   *
   * @param roleSummary Role summary from Application layer
   * @returns Role summary description
   */
  formatRoleSummary(roleSummary: RoleSummary): string {
    const statusText = roleSummary.isActive ? 'active' : 'inactive';
    const userText = roleSummary.userCount === 1 ? 'user' : 'users';
    const levelValue = roleSummary.accessLevel;
    const accessLevelText =
      levelValue === 1 ? 'high-level' : levelValue <= 3 ? 'medium-level' : 'basic';

    return `${roleSummary.name} role with ${accessLevelText} access (L${levelValue}), currently ${statusText} with ${roleSummary.userCount} assigned ${userText}`;
  }
}
