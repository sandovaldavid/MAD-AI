import { Injectable, inject } from '@angular/core';
import { GetUsersByRole } from '@application/use-cases/roles/get-users-by-role.usecase';
import { AssignRoleToUser } from '@application/use-cases/roles/assign-role-to-user.usecase';
import { UnassignRoleFromUser } from '@application/use-cases/roles/unassign-role-from-user.usecase';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { NotificationsFacade } from '@application/facades/notifications.facade';
import { AuthFacade } from '@application/facades/auth.facade';
import { RoleStateFacade } from './role-state.facade';
import type { User } from '@domain/entities/user.entity';
import type { FacadeOpts } from '@application/types/facade-opts';

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
  private readonly getUsersByRoleUC = inject(GetUsersByRole);
  private readonly assignRoleToUserUC = inject(AssignRoleToUser);
  private readonly unassignRoleFromUserUC = inject(UnassignRoleFromUser);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);
  private readonly notifications = inject(NotificationsFacade);
  private readonly authFacade = inject(AuthFacade);
  private readonly roleState = inject(RoleStateFacade);

  /**
   * Loads users assigned to a role
   */
  async loadRoleUsers(roleId: number, opts?: FacadeOpts): Promise<User[]> {
    return this.executeOperation(async () => {
      const users = await this.getUsersByRoleUC.execute({ roleId });
      this.roleState.setRoleUsers(users);
      return users;
    }, opts);
  }

  /**
   * Assigns a role to a user
   */
  async assignRoleToUser(roleId: number, userId: number, opts?: FacadeOpts): Promise<void> {
    return this.executeOperation(async () => {
      const currentUserId = this.getCurrentUserId();
      await this.assignRoleToUserUC.execute({
        roleId,
        userId,
        assignedByUserId: currentUserId,
      });

      // Refresh role users if we're viewing this role's users
      const currentRole = this.roleState.currentRole();
      if (currentRole && currentRole.id === roleId) {
        await this.loadRoleUsers(roleId, { skipLoading: true });
      }

      // Show success notification
      if (!opts?.silent) {
        this.notifications.success(
          'Role assigned successfully',
          'The role has been assigned to the user.'
        );
      }
    }, opts);
  }

  /**
   * Unassigns a role from a user
   */
  async unassignRoleFromUser(roleId: number, userId: number, opts?: FacadeOpts): Promise<void> {
    return this.executeOperation(async () => {
      const currentUserId = this.getCurrentUserId();
      await this.unassignRoleFromUserUC.execute({
        roleId,
        userId,
        requesterId: currentUserId,
      });

      // Refresh role users if we're viewing this role's users
      const currentRole = this.roleState.currentRole();
      if (currentRole && currentRole.id === roleId) {
        await this.loadRoleUsers(roleId, { skipLoading: true });
      }

      // Show success notification
      if (!opts?.silent) {
        this.notifications.success(
          'Role unassigned successfully',
          'The role has been removed from the user.'
        );
      }
    }, opts);
  }

  /**
   * Assigns a role to multiple users
   */
  async bulkAssignRoleToUsers(roleId: number, userIds: number[], opts?: FacadeOpts): Promise<void> {
    return this.executeOperation(async () => {
      const currentUserId = this.getCurrentUserId();

      // Execute assignments in parallel
      await Promise.all(
        userIds.map((userId) =>
          this.assignRoleToUserUC.execute({
            roleId,
            userId,
            assignedByUserId: currentUserId,
          })
        )
      );

      // Refresh role users if we're viewing this role's users
      const currentRole = this.roleState.currentRole();
      if (currentRole && currentRole.id === roleId) {
        await this.loadRoleUsers(roleId, { skipLoading: true });
      }

      // Show success notification
      if (!opts?.silent) {
        this.notifications.success(
          'Bulk role assignment completed',
          `Role has been assigned to ${userIds.length} users successfully.`
        );
      }
    }, opts);
  }

  /**
   * Unassigns a role from multiple users
   */
  async bulkUnassignRoleFromUsers(
    roleId: number,
    userIds: number[],
    opts?: FacadeOpts
  ): Promise<void> {
    return this.executeOperation(async () => {
      const currentUserId = this.getCurrentUserId();

      // Execute unassignments in parallel
      await Promise.all(
        userIds.map((userId) =>
          this.unassignRoleFromUserUC.execute({
            roleId,
            userId,
            requesterId: currentUserId,
          })
        )
      );

      // Refresh role users if we're viewing this role's users
      const currentRole = this.roleState.currentRole();
      if (currentRole && currentRole.id === roleId) {
        await this.loadRoleUsers(roleId, { skipLoading: true });
      }

      // Show success notification
      if (!opts?.silent) {
        this.notifications.success(
          'Bulk role unassignment completed',
          `Role has been removed from ${userIds.length} users successfully.`
        );
      }
    }, opts);
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
