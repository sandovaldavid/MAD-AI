import { Injectable, inject } from '@angular/core';
import {
  LIST_ROLES_USECASE_PORT,
  GET_ROLE_BY_ID_USECASE_PORT,
  CREATE_ROLE_USECASE_PORT,
  UPDATE_ROLE_USECASE_PORT,
  DELETE_ROLE_USECASE_PORT,
  GET_ROLE_BY_NAME_USECASE_PORT,
} from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { NotificationsFacade } from '@application/facades/notifications.facade';
import { AuthFacade } from '@application/facades/auth.facade';
import { RoleStateFacade } from './role-state.facade';
import { Role } from '@domain/entities/role.entity';
import { RoleApplicationMapper } from '@/app/application/mappers/role.mapper';
import type { CreateRoleData, UpdateRoleData } from './role.types';
import type { FacadeOpts } from '@application/types/facade-opts';

/**
 * CRUD operations facade for roles
 *
 * Handles all basic CRUD (Create, Read, Update, Delete) operations for roles.
 * Coordinates with use cases and manages state through the RoleStateFacade.
 *
 * Responsibilities:
 * - Create new roles
 * - Read/fetch roles (by ID, name, list all)
 * - Update existing roles
 * - Delete roles
 * - Handle errors and notifications for CRUD operations
 */
@Injectable({ providedIn: 'root' })
export class RoleCrudFacade {
  private readonly listRolesUC = inject(LIST_ROLES_USECASE_PORT);
  private readonly getRoleByIdUC = inject(GET_ROLE_BY_ID_USECASE_PORT);
  private readonly createRoleUC = inject(CREATE_ROLE_USECASE_PORT);
  private readonly updateRoleUC = inject(UPDATE_ROLE_USECASE_PORT);
  private readonly deleteRoleUC = inject(DELETE_ROLE_USECASE_PORT);
  private readonly getRoleByNameUC = inject(GET_ROLE_BY_NAME_USECASE_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);
  private readonly notifications = inject(NotificationsFacade);
  private readonly authFacade = inject(AuthFacade);
  private readonly roleState = inject(RoleStateFacade);

  /**
   * Loads all roles and updates state
   */
  async loadRoles(opts?: FacadeOpts): Promise<void> {
    return this.executeOperation(async () => {
      const roles = await this.listRolesUC.execute();
      const mappedRoles = roles.map((role) => RoleApplicationMapper.toRoleSummary(role));
      this.roleState.setRoles(mappedRoles);
    }, opts);
  }

  /**
   * Loads a specific role by ID and sets it as current
   */
  async loadRole(id: number, opts?: FacadeOpts): Promise<void> {
    return this.executeOperation(async () => {
      const role = await this.getRoleByIdUC.execute({ id, requesterId: this.getCurrentUserId() });
      const mappedRole = RoleApplicationMapper.toRoleSummary(role);
      this.roleState.setCurrentRole(mappedRole);
    }, opts);
  }

  /**
   * Creates a new role
   */
  async createRole(roleData: CreateRoleData, opts?: FacadeOpts): Promise<Role> {
    return this.executeOperation(async () => {
      const role = await this.createRoleUC.execute({
        name: roleData.name,
        accessLevel: roleData.accessLevel,
        description: roleData.description,
        canLeadProjects: roleData.canLeadProjects || false,
        isUniquePerTeam: roleData.isUniquePerTeam || false,
        requesterId: this.getCurrentUserId(),
      });

      // Add to state
      const mappedRole = RoleApplicationMapper.toRoleSummary(role);
      this.roleState.addRole(mappedRole);

      // Show success notification
      if (!opts?.silent) {
        this.notifications.success(
          'Role created successfully',
          `Role "${role.name}" has been created.`
        );
      }

      return role;
    }, opts);
  }

  /**
   * Updates an existing role
   */
  async updateRole(id: number, roleData: UpdateRoleData, opts?: FacadeOpts): Promise<Role> {
    return this.executeOperation(async () => {
      const role = await this.updateRoleUC.execute({
        id,
        name: roleData.name,
        accessLevel: roleData.accessLevel,
        description: roleData.description,
        canLeadProjects: roleData.canLeadProjects,
        isUniquePerTeam: roleData.isUniquePerTeam,
        isActive: roleData.isActive,
      });

      // Update state
      const mappedRole = RoleApplicationMapper.toRoleSummary(role);
      this.roleState.updateRole(mappedRole);

      // Show success notification
      if (!opts?.silent) {
        this.notifications.success(
          'Role updated successfully',
          `Role "${role.name}" has been updated.`
        );
      }

      return role;
    }, opts);
  }

  /**
   * Deletes a role
   */
  async deleteRole(id: number, opts?: FacadeOpts): Promise<void> {
    return this.executeOperation(async () => {
      const currentUserId = this.getCurrentUserId();
      await this.deleteRoleUC.execute({
        id,
        requesterId: currentUserId,
      });

      // Remove from state
      this.roleState.removeRole(id);

      // Show success notification
      if (!opts?.silent) {
        this.notifications.success('Role deleted', 'Role has been deleted successfully.');
      }
    }, opts);
  }

  /**
   * Finds a role by name (does not affect state)
   */
  async findRoleByName(name: string): Promise<Role | null> {
    try {
      return await this.getRoleByNameUC.execute({ name });
    } catch (error: unknown) {
      const appError = this.errorTransformer.transform(error);
      throw appError;
    }
  }

  /**
   * Executes operation with error handling and loading state
   */
  private async executeOperation<T>(operation: () => Promise<T>, opts?: FacadeOpts): Promise<T> {
    if (!opts?.skipLoading) this.roleState.setLoading(true);
    this.roleState.setError(null);

    try {
      return await operation();
    } catch (error: unknown) {
      const appError = this.errorTransformer.transform(error);
      this.roleState.setError(appError.message);
      throw appError;
    } finally {
      if (!opts?.skipLoading) this.roleState.setLoading(false);
    }
  }

  /**
   * Gets current user ID for operations
   */
  private getCurrentUserId(): number {
    const currentUser = this.authFacade.user();
    if (!currentUser?.id) {
      throw new Error('No authenticated user found');
    }
    return currentUser.id;
  }
}
