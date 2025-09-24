import { Injectable, inject } from '@angular/core';
import {
  GET_USERS_BY_ROLE_USECASE_PORT,
  ASSIGN_ROLE_TO_USER_USECASE_PORT,
  UNASSIGN_ROLE_FROM_USER_USECASE_PORT,
} from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { AuthFacade } from '@application/facades/auth.facade';
import { RoleStateFacade } from './role-state.facade';
import type { User } from '@domain/entities/user.entity';
import type { FacadeOpts } from '@application/types/facade-opts';
import type { Message } from '@application/types/message.type';

/**
 * Role assignment facade
 *
 * Handles user-role assignment operations including:
 * - Loading users assigned to roles
 * - Assigning roles to users
 * - Unassigning roles from users
 * - Bulk assignment operations
 *
 * Responsibilities:
 * - Load users by role
 * - Assign/unassign roles to/from users
 * - Handle bulk assignment operations
 * - Manage role users state
 * - Handle errors and notifications for assignment operations
 */
@Injectable({ providedIn: 'root' })
export class RoleAssignmentFacade {
  private readonly getUsersByRoleUC = inject(GET_USERS_BY_ROLE_USECASE_PORT);
  private readonly assignRoleToUserUC = inject(ASSIGN_ROLE_TO_USER_USECASE_PORT);
  private readonly unassignRoleFromUserUC = inject(UNASSIGN_ROLE_FROM_USER_USECASE_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);
  private readonly authFacade = inject(AuthFacade);
  private readonly roleState = inject(RoleStateFacade);

  /**
   * Loads users assigned to a role
   */
  async loadRoleUsers(roleId: number, opts?: FacadeOpts): Promise<User[] | Message> {
    return this.executeOperation(async () => {
      const users = await this.getUsersByRoleUC.execute({ roleId });
      this.roleState.setRoleUsers(users);
      return users;
    }, opts);
  }

  /**
   * Asigna un rol a un usuario
   */
  async assignRoleToUser(roleId: number, userId: number, opts?: FacadeOpts): Promise<Message> {
    return this.executeOperation(async () => {
      const currentUserId = this.getCurrentUserId();
      await this.assignRoleToUserUC.execute({
        roleId,
        userId,
        assignedByUserId: currentUserId,
      });

      // Actualiza los usuarios del rol si corresponde
      const currentRole = this.roleState.currentRole();
      if (currentRole && currentRole.id === roleId) {
        await this.loadRoleUsers(roleId, { skipLoading: true });
      }

      return {
        success: true,
        message: 'El rol ha sido asignado al usuario exitosamente.',
      };
    }, opts);
  }

  /**
   * Desasigna un rol de un usuario
   */
  async unassignRoleFromUser(roleId: number, userId: number, opts?: FacadeOpts): Promise<Message> {
    return this.executeOperation(async () => {
      const currentUserId = this.getCurrentUserId();
      await this.unassignRoleFromUserUC.execute({
        roleId,
        userId,
        requesterId: currentUserId,
      });

      // Actualiza los usuarios del rol si corresponde
      const currentRole = this.roleState.currentRole();
      if (currentRole && currentRole.id === roleId) {
        await this.loadRoleUsers(roleId, { skipLoading: true });
      }

      return {
        success: true,
        message: 'El rol ha sido removido del usuario exitosamente.',
      };
    }, opts);
  }

  /**
   * Asigna un rol a múltiples usuarios
   */
  async bulkAssignRoleToUsers(
    roleId: number,
    userIds: number[],
    opts?: FacadeOpts
  ): Promise<Message> {
    return this.executeOperation(async () => {
      const currentUserId = this.getCurrentUserId();

      // Ejecuta las asignaciones en paralelo
      await Promise.all(
        userIds.map((userId) =>
          this.assignRoleToUserUC.execute({
            roleId,
            userId,
            assignedByUserId: currentUserId,
          })
        )
      );

      // Actualiza los usuarios del rol si corresponde
      const currentRole = this.roleState.currentRole();
      if (currentRole && currentRole.id === roleId) {
        await this.loadRoleUsers(roleId, { skipLoading: true });
      }

      return {
        success: true,
        message: `El rol ha sido asignado exitosamente a ${userIds.length} usuarios.`,
      };
    }, opts);
  }

  /**
   * Desasigna un rol de múltiples usuarios
   */
  async bulkUnassignRoleFromUsers(
    roleId: number,
    userIds: number[],
    opts?: FacadeOpts
  ): Promise<Message> {
    return this.executeOperation(async () => {
      const currentUserId = this.getCurrentUserId();

      // Ejecuta las desasignaciones en paralelo
      await Promise.all(
        userIds.map((userId) =>
          this.unassignRoleFromUserUC.execute({
            roleId,
            userId,
            requesterId: currentUserId,
          })
        )
      );

      // Actualiza los usuarios del rol si corresponde
      const currentRole = this.roleState.currentRole();
      if (currentRole && currentRole.id === roleId) {
        await this.loadRoleUsers(roleId, { skipLoading: true });
      }

      return {
        success: true,
        message: `El rol ha sido removido exitosamente de ${userIds.length} usuarios.`,
      };
    }, opts);
  }

  /**
   * Ejecuta una operación con manejo de errores y estado de carga
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
      this.roleState.setError(appError.message);
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
      throw new Error('No authenticated user found');
    }
    return currentUser.id;
  }
}
