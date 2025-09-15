import { Injectable, inject } from '@angular/core';
import { ActivateRole } from '@application/use-cases/roles/activate-role.usecase';
import { DeactivateRoleUseCase } from '@application/use-cases/roles/deactivate-role.usecase';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { NotificationsFacade } from '@application/facades/notifications.facade';
import { AuthFacade } from '@application/facades/auth.facade';
import { RoleStateFacade } from './role-state.facade';
import { Role } from '@domain/entities/role.entity';
import { RoleApplicationMapper } from '@/app/application/mappers/role.mapper';
import type { FacadeOpts } from '@application/types/facade-opts';

/**
 * Role activation/deactivation facade
 *
 * Handles role activation and deactivation operations.
 * Manages role status changes and updates state accordingly.
 *
 * Responsibilities:
 * - Activate roles
 * - Deactivate roles
 * - Toggle role activation status
 * - Handle errors and notifications for activation operations
 */
@Injectable({ providedIn: 'root' })
export class RoleActivationFacade {
  private readonly activateRoleUC = inject(ActivateRole);
  private readonly deactivateRoleUC = inject(DeactivateRoleUseCase);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);
  private readonly notifications = inject(NotificationsFacade);
  private readonly authFacade = inject(AuthFacade);
  private readonly roleState = inject(RoleStateFacade);

  /**
   * Activates a role
   */
  async activateRole(id: number, opts?: FacadeOpts): Promise<Role> {
    return this.executeOperation(async () => {
      const currentUserId = this.getCurrentUserId();
      const role = await this.activateRoleUC.execute({
        id,
        requesterId: currentUserId,
      });

      // Update state
      const mappedRole = RoleApplicationMapper.toRoleSummary(role);
      this.roleState.updateRole(mappedRole);

      // Show success notification
      if (!opts?.silent) {
        this.notifications.success('Role activated', `Role "${role.name}" is now active.`);
      }

      return role;
    }, opts);
  }

  /**
   * Deactivates a role
   */
  async deactivateRole(id: number, opts?: FacadeOpts): Promise<Role> {
    return this.executeOperation(async () => {
      const currentUserId = this.getCurrentUserId();
      const role = await this.deactivateRoleUC.execute({
        id,
        requesterId: currentUserId,
      });

      // Update state
      const mappedRole = RoleApplicationMapper.toRoleSummary(role);
      this.roleState.updateRole(mappedRole);

      // Show success notification
      if (!opts?.silent) {
        this.notifications.success('Role deactivated', `Role "${role.name}" is now inactive.`);
      }

      return role;
    }, opts);
  }

  /**
   * Toggles role activation status
   */
  async toggleRoleActivation(id: number, opts?: FacadeOpts): Promise<Role> {
    const currentRole = this.roleState.roles().find((role) => role.id === id);
    if (!currentRole) {
      throw new Error(`Role with ID ${id} not found in current state`);
    }

    return currentRole.isActive
      ? await this.deactivateRole(id, opts)
      : await this.activateRole(id, opts);
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
