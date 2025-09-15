import { Injectable, signal, computed } from '@angular/core';
import type { RoleState, ListRolesParams, RoleStatistics } from './role.types';
import type { RoleSummary } from '@/app/application/mappers/role.mapper';
import type { User } from '@domain/entities/user.entity';

/**
 * State management facade for roles
 *
 * Manages all reactive state for role-related operations including:
 * - Loading states
 * - Error states
 * - Role collections
 * - Current selection
 * - Users assigned to roles
 * - Applied filters
 *
 * This facade serves as the foundation for other role facades by providing
 * centralized state management with computed values and state manipulation methods.
 */
@Injectable({ providedIn: 'root' })
export class RoleStateFacade {
  /** Loading state for async operations */
  private readonly _loading = signal(false);

  /** Current error state */
  private readonly _error = signal<string | null>(null);

  /** List of roles */
  private readonly _roles = signal<RoleSummary[]>([]);

  /** Current selected role */
  private readonly _currentRole = signal<RoleSummary | null>(null);

  /** Users assigned to current role */
  private readonly _roleUsers = signal<User[]>([]);

  /** Current search/filter parameters */
  private readonly _currentFilters = signal<ListRolesParams | null>(null);

  // Computed readonly properties
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());
  readonly roles = computed(() => this._roles());
  readonly currentRole = computed(() => this._currentRole());
  readonly roleUsers = computed(() => this._roleUsers());
  readonly currentFilters = computed(() => this._currentFilters());
  readonly totalRoles = computed(() => this._roles().length);
  readonly activeRoles = computed(() => this._roles().filter((role) => role.isActive).length);
  readonly inactiveRoles = computed(() => this._roles().filter((role) => !role.isActive).length);
  readonly hasSelectedRole = computed(() => !!this._currentRole());

  /**
   * Sets the loading state
   */
  setLoading(loading: boolean): void {
    this._loading.set(loading);
  }

  /**
   * Sets the error state
   */
  setError(error: string | null): void {
    this._error.set(error);
  }

  /**
   * Sets the roles list
   */
  setRoles(roles: RoleSummary[]): void {
    this._roles.set(roles);
  }

  /**
   * Sets the current selected role
   */
  setCurrentRole(role: RoleSummary | null): void {
    this._currentRole.set(role);
  }

  /**
   * Sets the users assigned to current role
   */
  setRoleUsers(users: User[]): void {
    this._roleUsers.set(users);
  }

  /**
   * Sets the current filter parameters
   */
  setCurrentFilters(filters: ListRolesParams | null): void {
    this._currentFilters.set(filters);
  }

  /**
   * Updates a specific role in the list
   */
  updateRole(updatedRole: RoleSummary): void {
    this._roles.update((roles) =>
      roles.map((role) => (role.id === updatedRole.id ? updatedRole : role))
    );

    // Update current role if it's the same
    const currentRole = this._currentRole();
    if (currentRole && currentRole.id === updatedRole.id) {
      this._currentRole.set(updatedRole);
    }
  }

  /**
   * Adds a new role to the list
   */
  addRole(newRole: RoleSummary): void {
    this._roles.update((roles) => [...roles, newRole]);
  }

  /**
   * Removes a role from the list
   */
  removeRole(roleId: number): void {
    this._roles.update((roles) => roles.filter((role) => role.id !== roleId));

    // Clear current role if it was the deleted one
    const currentRole = this._currentRole();
    if (currentRole && currentRole.id === roleId) {
      this._currentRole.set(null);
      this._roleUsers.set([]);
    }
  }

  /**
   * Gets role statistics
   */
  getRoleStatistics(): RoleStatistics {
    const roles = this._roles();
    const byAccessLevel: Record<number, number> = {};

    roles.forEach((role) => {
      byAccessLevel[role.accessLevel] = (byAccessLevel[role.accessLevel] || 0) + 1;
    });

    return {
      total: roles.length,
      active: roles.filter((role) => role.isActive).length,
      inactive: roles.filter((role) => !role.isActive).length,
      byAccessLevel,
    };
  }

  /**
   * Clears the error state
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Clears the current role selection
   */
  clearCurrentRole(): void {
    this._currentRole.set(null);
    this._roleUsers.set([]);
  }

  /**
   * Resets all state
   */
  reset(): void {
    this._loading.set(false);
    this._error.set(null);
    this._roles.set([]);
    this._currentRole.set(null);
    this._roleUsers.set([]);
    this._currentFilters.set(null);
  }

  /**
   * Gets the complete current state
   */
  getState(): RoleState {
    return {
      loading: this._loading(),
      error: this._error(),
      roles: this._roles(),
      currentRole: this._currentRole(),
      roleUsers: this._roleUsers(),
      currentFilters: this._currentFilters(),
    };
  }
}
