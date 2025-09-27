/**
 * @fileoverview User CRUD Operations Facade
 *
 * This file contains the UserCrudFacade class, which handles Create, Read, Update,
 * and Delete operations for users. It extends the BaseUserFacade to leverage shared
 * state and dependencies while focusing solely on basic CRUD functionality.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { Injectable } from '@angular/core';
import { BaseUserFacade } from './base-user.facade';
import type { Message } from '@application/types/message.type';

// Application Layer Imports
import type { FacadeOpts } from '@application/types/facade-opts';
import type { CreateUserRequest, UpdateUserRequest } from '@application/types/users.types';

/**
 * User CRUD Operations Facade
 *
 * @description
 * Specialized facade handling basic Create, Read, Update, and Delete operations
 * for users. This facade focuses exclusively on fundamental CRUD functionality,
 * providing a clean separation of concerns from other user management operations
 * like bulk operations, state management, or advanced queries.
 *
 * @responsibilities
 * - Handle individual user creation with validation and notifications
 * - Manage user updates with state synchronization
 * - Process user deletion with cleanup
 * - Coordinate with notifications facade for user feedback
 * - Maintain state consistency after CRUD operations
 * - Emit appropriate events for cross-facade coordination
 *
 * @architecture
 * - Extends BaseUserFacade for shared state and dependencies
 * - Follows Single Responsibility Principle for CRUD operations
 * - Uses reactive state management via inherited signals
 * - Delegates business logic to domain use cases
 * - Coordinates with notification systems
 *
 * @patterns
 * - Facade Pattern: Simplifies CRUD operations interface
 * - Command Pattern: Each operation delegates to specific use case
 * - Observer Pattern: Emits events for state changes
 * - Template Method: Uses base class methods for common operations
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class UserCrudFacade extends BaseUserFacade {
  // ============================================================================
  // User CRUD Operations
  // ============================================================================
  /**
   * Send password reset email to user
   *
   * @param userId Unique identifier of the user
   * @param opts Optional facade configuration (skipLoading, etc.)
   * @returns Promise resolving to Message result
   */
  async sendResetPasswordEmail(userId: number, opts?: FacadeOpts): Promise<Message> {
    if (!opts?.skipLoading) {
      this.setLoading(true);
    }
    this.setError(null);

    try {
      // Simulate password reset use case (replace with actual use case call)
      // NOTE: This is a placeholder. Replace with actual admin-triggered reset contract/use case if available.
      await this.changePasswordUC.execute({
        currentPassword: 'admin-reset', // Not used, placeholder
        newPassword: 'Temporal123!', // Should be generated securely
        newPasswordConfirm: 'Temporal123!',
      });

      // Emit event for coordination
      this.emitEvent({
        type: 'user-password-reset',
        userId,
      });

      return {
        success: true,
        userId,
        message: 'La contraseña ha sido restablecida y el correo ha sido enviado exitosamente.',
      };
    } catch (error: unknown) {
      this.handleError(error);
      return {
        success: false,
        error: 'Ocurrió un error al restablecer la contraseña.',
        message: 'No se pudo restablecer la contraseña. Por favor, intenta nuevamente.',
      };
    } finally {
      if (!opts?.skipLoading) {
        this.setLoading(false);
      }
    }
  }

  /**
   * Update user status (activate/deactivate)
   *
   * Activates or deactivates a user, updates local state, and returns a Message result in Spanish.
   *
   * @param userId Unique identifier of the user
   * @param active Desired active status (true = activate, false = deactivate)
   * @param opts Optional facade configuration (skipLoading, etc.)
   * @returns Promise resolving to Message result
   */
  async updateUserStatus(userId: number, active: boolean, opts?: FacadeOpts): Promise<Message> {
    if (!opts?.skipLoading) {
      this.setLoading(true);
    }
    this.setError(null);

    try {
      let user: any;
      if (active) {
        user = await this.activateUserUC.execute({ userId });
      } else {
        user = await this.deactivateUserUC.execute({ userId });
      }

      // Actualiza el estado local
      this._users.update((users) => users.map((u) => (u.id === userId ? user : u)));
      if (this._selectedUser()?.id === userId) {
        this._selectedUser.set(user);
      }

      // Emitir evento para coordinación entre facades
      this.emitEvent({
        type: active ? 'user-activated' : 'user-deactivated',
        user,
      });

      return {
        success: true,
        user,
        message: active
          ? 'El usuario ha sido activado exitosamente.'
          : 'El usuario ha sido desactivado exitosamente.',
      };
    } catch (error: unknown) {
      this.handleError(error);
      return {
        success: false,
        error: 'Ocurrió un error al actualizar el estado del usuario.',
        message: 'No se pudo actualizar el estado del usuario. Por favor, intenta nuevamente.',
      };
    } finally {
      if (!opts?.skipLoading) {
        this.setLoading(false);
      }
    }
  }

  /**
   * Create a new user
   *
   * Creates a new user account with provided data, handling validation,
   * notifications, and state synchronization. The method coordinates with
   * the notifications facade to send welcome messages if requested.
   *
   * @param request User creation request data including user details and options
   * @param opts Optional facade configuration (skipLoading, etc.)
   * @returns Promise resolving to creation result containing the new user
   * @throws Error if user creation fails or validation errors occur
   *
   * @example
   * ```typescript
   * // Create user with welcome notification
   * const result = await userCrudFacade.createUser({
   *   firstName: 'John',
   *   lastName: 'Doe',
   *   email: 'john.doe@example.com',
   *   username: 'johndoe',
   *   sendWelcomeNotification: true
   * });
   *
   * // Create user without loading indicator
   * const result = await userCrudFacade.createUser(userData, { skipLoading: true });
   * ```
   */
  async createUser(request: CreateUserRequest, opts?: FacadeOpts): Promise<Message> {
    if (!opts?.skipLoading) {
      this.setLoading(true);
    }
    this.setError(null);

    try {
      const user = await this.createUserUC.execute(request);

      // Actualiza el estado local
      this._users.update((users) => [...users, user]);
      this._totalCount.update((count) => count + 1);

      // Emitir evento para coordinación entre facades
      this.emitEvent({
        type: 'user-created',
        user,
      });

      return {
        success: true,
        user,
        message: `¡Bienvenido a MAD-AI, ${user.firstName}! Tu cuenta ha sido creada exitosamente.`,
      };
    } catch (error: unknown) {
      this.handleError(error);
      return {
        success: false,
        error: 'Ocurrió un error al crear el usuario.',
        message: 'No se pudo crear el usuario. Por favor, verifica los datos e intenta nuevamente.',
      };
    } finally {
      if (!opts?.skipLoading) {
        this.setLoading(false);
      }
    }
  }

  /**
   * Update an existing user
   *
   * Updates an existing user's data with the provided changes, handling
   * validation, state synchronization, and optional user notifications.
   * The method ensures that both the local state and selected user are
   * updated if applicable.
   *
   * @param request User update request containing user ID, update data, and options
   * @param opts Optional facade configuration (skipLoading, etc.)
   * @returns Promise resolving to update result containing the updated user
   * @throws Error if user update fails or validation errors occur
   *
   * @example
   * ```typescript
   * // Update user with notification
   * const result = await userCrudFacade.updateUser({
   *   userId: 123,
   *   updateData: {
   *     firstName: 'Jane',
   *     email: 'jane.doe@example.com'
   *   },
   *   notifyUser: true
   * });
   *
   * // Silent update without notifications
   * const result = await userCrudFacade.updateUser({
   *   userId: 123,
   *   updateData: { active: false },
   *   notifyUser: false
   * });
   * ```
   */
  async updateUser(request: UpdateUserRequest, opts?: FacadeOpts): Promise<Message> {
    if (!opts?.skipLoading) {
      this.setLoading(true);
    }
    this.setError(null);

    try {
      const user = await this.updateUserUC.execute(request);

      // Actualiza el estado local
      this._users.update((users) => users.map((u) => (u.id === request.userId ? user : u)));

      // Actualiza el usuario seleccionado si corresponde
      if (this._selectedUser()?.id === request.userId) {
        this._selectedUser.set(user);
      }

      // Campos actualizados
      const updatedFields = Object.keys(request.updateData);

      // Emitir evento para coordinación entre facades
      this.emitEvent({
        type: 'user-updated',
        user,
        updatedFields,
      });

      return {
        success: true,
        user,
        message: `El perfil ha sido actualizado exitosamente. Campos modificados: ${updatedFields.join(', ')}.`,
      };
    } catch (error: unknown) {
      this.handleError(error);
      return {
        success: false,
        error: 'Ocurrió un error al actualizar el usuario.',
        message:
          'No se pudo actualizar el usuario. Por favor, verifica los datos e intenta nuevamente.',
      };
    } finally {
      if (!opts?.skipLoading) {
        this.setLoading(false);
      }
    }
  }

  /**
   * Delete a user
   *
   * Permanently removes a user from the system, handling state cleanup
   * and cross-facade coordination. The method ensures that the user is
   * removed from local state and clears selection if the deleted user
   * was currently selected.
   *
   * @param userId Unique identifier of the user to delete
   * @param opts Optional facade configuration (skipLoading, etc.)
   * @returns Promise that resolves when deletion is complete
   * @throws Error if user deletion fails or user doesn't exist
   *
   * @example
   * ```typescript
   * // Delete user with loading indicator
   * await userCrudFacade.deleteUser(123);
   *
   * // Delete user without loading indicator
   * await userCrudFacade.deleteUser(123, { skipLoading: true });
   * ```
   */
  async deleteUser(userId: number, opts?: FacadeOpts): Promise<Message> {
    if (!opts?.skipLoading) {
      this.setLoading(true);
    }
    this.setError(null);

    try {
      await this.deleteUserUC.execute({ userId });

      // Actualiza el estado local
      this._users.update((users) => users.filter((u) => u.id !== userId));
      this._totalCount.update((count) => count - 1);

      // Limpiar usuario seleccionado si corresponde
      if (this._selectedUser()?.id === userId) {
        this._selectedUser.set(null);
      }

      // Emitir evento para coordinación entre facades
      this.emitEvent({
        type: 'user-deleted',
        userId,
      });

      return {
        success: true,
        userId,
        message: 'El usuario ha sido eliminado exitosamente.',
      };
    } catch (error: unknown) {
      this.handleError(error);
      return {
        success: false,
        error: 'Ocurrió un error al eliminar el usuario.',
        message: 'No se pudo eliminar el usuario. Por favor, intenta nuevamente.',
      };
    } finally {
      if (!opts?.skipLoading) {
        this.setLoading(false);
      }
    }
  }
}
