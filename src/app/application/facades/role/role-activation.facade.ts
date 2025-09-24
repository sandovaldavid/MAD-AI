import { Injectable, inject } from '@angular/core';
import { ACTIVATE_ROLE_USECASE_PORT, DEACTIVATE_ROLE_USECASE_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { AuthFacade } from '@application/facades/auth.facade';
import { RoleStateFacade } from './role-state.facade';
import { RoleApplicationMapper } from '@/app/application/mappers/role.mapper';
import type { Message } from '@application/types/message.type';
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
  private readonly activateRoleUC = inject(ACTIVATE_ROLE_USECASE_PORT);
  private readonly deactivateRoleUC = inject(DEACTIVATE_ROLE_USECASE_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);
  private readonly authFacade = inject(AuthFacade);
  private readonly roleState = inject(RoleStateFacade);

  /**
   * Activa un rol
   */
  async activateRole(id: number, opts?: FacadeOpts): Promise<Message> {
    return this.executeOperation(async () => {
      const currentUserId = this.getCurrentUserId();
      const role = await this.activateRoleUC.execute({
        id,
        requesterId: currentUserId,
      });

      // Actualiza el estado
      const mappedRole = RoleApplicationMapper.toRoleSummary(role);
      this.roleState.updateRole(mappedRole);

      return {
        success: true,
        role,
        message: `El rol "${role.name}" ha sido activado exitosamente.`,
      };
    }, opts);
  }

  /**
   * Desactiva un rol
   */
  async deactivateRole(id: number, opts?: FacadeOpts): Promise<Message> {
    return this.executeOperation(async () => {
      const currentUserId = this.getCurrentUserId();
      const role = await this.deactivateRoleUC.execute({
        id,
        requesterId: currentUserId,
      });

      // Actualiza el estado
      const mappedRole = RoleApplicationMapper.toRoleSummary(role);
      this.roleState.updateRole(mappedRole);

      return {
        success: true,
        role,
        message: `El rol "${role.name}" ha sido desactivado exitosamente.`,
      };
    }, opts);
  }

  /**
   * Alterna el estado de activación de un rol
   */
  async toggleRoleActivation(id: number, opts?: FacadeOpts): Promise<Message> {
    const currentRole = this.roleState.roles().find((role) => role.id === id);
    if (!currentRole) {
      return {
        success: false,
        error: `No se encontró el rol con ID ${id} en el estado actual.`,
        message: 'No se pudo alternar el estado del rol.',
      };
    }

    return currentRole.isActive
      ? await this.deactivateRole(id, opts)
      : await this.activateRole(id, opts);
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
      throw new Error('No se encontró un usuario autenticado');
    }
    return currentUser.id;
  }
}
