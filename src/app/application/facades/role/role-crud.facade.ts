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
import { AuthFacade } from '@application/facades/auth.facade';
import { RoleStateFacade } from './role-state.facade';
import { Role } from '@domain/entities/role.entity';
import { RoleApplicationMapper } from '@/app/application/mappers/role.mapper';
import type { CreateRoleData, UpdateRoleData } from './role.types';
import type { FacadeOpts } from '@application/types/facade-opts';
import type { Message } from '@application/types/message.type';

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
  private readonly authFacade = inject(AuthFacade);
  private readonly roleState = inject(RoleStateFacade);

  /**
   * Loads all roles and updates state
   */
  async loadRoles(opts?: FacadeOpts): Promise<Message> {
    return this.executeOperation(async () => {
      const roles = await this.listRolesUC.execute();
      const mappedRoles = roles.map((role) => RoleApplicationMapper.toRoleSummary(role));
      this.roleState.setRoles(mappedRoles);
      return { success: true, message: 'Los roles han sido cargados exitosamente.' };
    }, opts);
  }

  /**
   * Loads a specific role by ID and sets it as current
   */
  async loadRole(id: number, opts?: FacadeOpts): Promise<Message> {
    return this.executeOperation(async () => {
      const role = await this.getRoleByIdUC.execute({ id, requesterId: this.getCurrentUserId() });
      const mappedRole = RoleApplicationMapper.toRoleSummary(role);
      this.roleState.setCurrentRole(mappedRole);
      return { success: true, message: 'El rol ha sido cargado exitosamente.' };
    }, opts);
  }

  /**
   * Creates a new role
   */
  async createRole(roleData: CreateRoleData, opts?: FacadeOpts): Promise<Message> {
    return this.executeOperation(async () => {
      const role = await this.createRoleUC.execute({
        name: roleData.name,
        accessLevel: roleData.accessLevel,
        description: roleData.description,
        canLeadProjects: roleData.canLeadProjects || false,
        isUniquePerTeam: roleData.isUniquePerTeam || false,
        requesterId: this.getCurrentUserId(),
      });
      const mappedRole = RoleApplicationMapper.toRoleSummary(role);
      this.roleState.addRole(mappedRole);
      return {
        success: true,
        role,
        message: `El rol "${role.name}" ha sido creado exitosamente.`,
      };
    }, opts);
  }

  /**
   * Updates an existing role
   */
  async updateRole(id: number, roleData: UpdateRoleData, opts?: FacadeOpts): Promise<Message> {
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
      const mappedRole = RoleApplicationMapper.toRoleSummary(role);
      this.roleState.updateRole(mappedRole);
      return {
        success: true,
        role,
        message: `El rol "${role.name}" ha sido actualizado exitosamente.`,
      };
    }, opts);
  }

  /**
   * Deletes a role
   */
  async deleteRole(id: number, opts?: FacadeOpts): Promise<Message> {
    return this.executeOperation(async () => {
      const currentUserId = this.getCurrentUserId();
      await this.deleteRoleUC.execute({
        id,
        requesterId: currentUserId,
      });
      this.roleState.removeRole(id);
      return {
        success: true,
        message: 'El rol ha sido eliminado exitosamente.',
      };
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
  private async executeOperation<T>(
    operation: () => Promise<T | Message>,
    opts?: FacadeOpts
  ): Promise<T | Message> {
    if (!opts?.skipLoading) this.roleState.setLoading(true);
    this.roleState.setError(null);

    try {
      return await operation();
    } catch (error: unknown) {
      const appError = this.errorTransformer.transform(error);
      return {
        success: false,
        error: `Error: ${appError.message}`,
        message: 'Ocurrió un error al realizar la operación.',
      };
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
      throw new Error('No se encontró un usuario autenticado.');
    }
    return currentUser.id;
  }
}
