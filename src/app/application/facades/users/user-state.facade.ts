/**
 * @fileoverview User State Management Facade
 *
 * This file contains the UserStateFacade class, which handles user state
 * management operations like activation and deactivation. It extends the
 * BaseUserFacade to leverage shared state and dependencies while focusing
 * solely on user state transitions.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { Injectable } from '@angular/core';
import { BaseUserFacade } from './base-user.facade';

// Application Layer Imports
import type { FacadeOpts } from '@application/types/facade-opts';
import type { Message } from '@application/types/message.type';

/**
 * User State Management Facade
 *
 * @description
 * Specialized facade handling user state management operations including
 * account activation and deactivation. This facade focuses exclusively on
 * user state transitions, providing clean methods for managing user account
 * status while coordinating with other system components.
 *
 * @responsibilities
 * - Handle user account activation with state synchronization
 * - Process user account deactivation with proper cleanup
 * - Coordinate state changes with local facade state
 * - Emit events for cross-facade coordination
 * - Manage loading states during state transitions
 * - Handle error scenarios for state management operations
 *
 * @architecture
 * - Extends BaseUserFacade for shared state and dependencies
 * - Follows Single Responsibility Principle for state operations
 * - Uses reactive state management via inherited signals
 * - Delegates business logic to domain use cases
 * - Maintains consistency between local and remote state
 *
 * @patterns
 * - Facade Pattern: Simplifies state management interface
 * - Command Pattern: Each operation delegates to specific use case
 * - State Pattern: Manages user state transitions
 * - Observer Pattern: Emits events for state changes
 * - Template Method: Uses base class methods for common operations
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class UserStateFacade extends BaseUserFacade {
  // ============================================================================
  // User State Management Operations
  // ============================================================================

  /**
   * Activate a user account
   *
   * Enables a previously deactivated user account, allowing them to access the system
   * again. This operation updates the user's status and emits events for cross-facade
   * coordination. The method handles state synchronization between local facade state
   * and the updated user entity, ensuring consistency across the application.
   *
   * @param userId Unique identifier of the user to activate
   * @param opts Optional facade configuration (skipLoading, etc.)
   * @returns Promise that resolves when the activation is complete
   * @throws Error if the user cannot be activated or if the operation fails
   *
   * @example
   * ```typescript
   * // Activate a user with default loading behavior
   * await userStateFacade.activateUser(123);
   *
   * // Activate without showing loading state
   * await userStateFacade.activateUser(123, { skipLoading: true });
   * ```
   */
  async activateUser(userId: number, opts?: FacadeOpts): Promise<Message> {
    if (!opts?.skipLoading) {
      this.setLoading(true);
    }
    this.setError(null);

    try {
      await this.activateUserUC.execute({ userId });
      const updatedUser = await this.getUserByIdUC.execute({ userId });
      if (!updatedUser) {
        return {
          success: false,
          message: `Usuario con ID ${userId} no encontrado después de la activación.`,
        };
      }
      this._users.update((users) => users.map((u) => (u.id === userId ? updatedUser : u)));
      if (this._selectedUser()?.id === userId) {
        this._selectedUser.set(updatedUser);
      }
      this.emitEvent({ type: 'user-activated', user: updatedUser });
      return {
        success: true,
        message: 'Usuario activado exitosamente.',
        data: updatedUser,
      };
    } catch (error: unknown) {
      this.handleError(error);
      return {
        success: false,
        message: 'Error al activar el usuario.',
        error: String(error),
      };
    } finally {
      if (!opts?.skipLoading) {
        this.setLoading(false);
      }
    }
  }

  /**
   * Deactivate a user account
   *
   * Temporarily disables a user account, preventing them from accessing the system
   * while preserving their data. This operation updates the user's status and emits
   * events for cross-facade coordination. The method handles state synchronization
   * between local facade state and the updated user entity, ensuring that UI
   * components reflect the current user status accurately.
   *
   * @param userId Unique identifier of the user to deactivate
   * @param opts Optional facade configuration (skipLoading, etc.)
   * @returns Promise that resolves when the deactivation is complete
   * @throws Error if the user cannot be deactivated or if the operation fails
   *
   * @example
   * ```typescript
   * // Deactivate a user with default loading behavior
   * await userStateFacade.deactivateUser(123);
   *
   * // Deactivate without showing loading state
   * await userStateFacade.deactivateUser(123, { skipLoading: true });
   * ```
   */
  async deactivateUser(userId: number, opts?: FacadeOpts): Promise<Message> {
    if (!opts?.skipLoading) {
      this.setLoading(true);
    }
    this.setError(null);

    try {
      await this.deactivateUserUC.execute({ userId });
      const updatedUser = await this.getUserByIdUC.execute({ userId });
      if (!updatedUser) {
        return {
          success: false,
          message: `Usuario con ID ${userId} no encontrado después de la desactivación.`,
        };
      }
      this._users.update((users) => users.map((u) => (u.id === userId ? updatedUser : u)));
      if (this._selectedUser()?.id === userId) {
        this._selectedUser.set(updatedUser);
      }
      this.emitEvent({ type: 'user-deactivated', user: updatedUser });
      return {
        success: true,
        message: 'Usuario desactivado exitosamente.',
        data: updatedUser,
      };
    } catch (error: unknown) {
      this.handleError(error);
      return {
        success: false,
        message: 'Error al desactivar el usuario.',
        error: String(error),
      };
    } finally {
      if (!opts?.skipLoading) {
        this.setLoading(false);
      }
    }
  }

  /**
   * Toggle user account status
   *
   * Convenience method that activates an inactive user or deactivates an active user.
   * This method determines the current user status and performs the opposite action,
   * providing a simple toggle interface for UI components that need to switch
   * user states based on current status.
   *
   * @param userId Unique identifier of the user whose status should be toggled
   * @param opts Optional facade configuration (skipLoading, etc.)
   * @returns Promise that resolves when the status toggle is complete
   * @throws Error if the user cannot be found or if the operation fails
   *
   * @example
   * ```typescript
   * // Toggle user status (activate if inactive, deactivate if active)
   * await userStateFacade.toggleUserStatus(123);
   *
   * // Toggle without loading indicator
   * await userStateFacade.toggleUserStatus(123, { skipLoading: true });
   * ```
   */
  async toggleUserStatus(userId: number, opts?: FacadeOpts): Promise<Message> {
    const currentUser = this._users().find((u) => u.id === userId);
    let user = currentUser;
    if (!user) {
      const fetchedUser = await this.getUserByIdUC.execute({ userId });
      user = fetchedUser === null ? undefined : fetchedUser;
      if (!user) {
        return {
          success: false,
          message: `Usuario con ID ${userId} no encontrado.`,
        };
      }
    }
    if (user.active) {
      return await this.deactivateUser(userId, opts);
    } else {
      return await this.activateUser(userId, opts);
    }
  }

  /**
   * Batch activate multiple users
   *
   * Activates multiple user accounts in sequence. This method is useful for
   * bulk operations where multiple users need to be activated at once.
   * The method processes each user individually to ensure proper error handling
   * and state management for each activation.
   *
   * @param userIds Array of user identifiers to activate
   * @param opts Optional facade configuration (skipLoading, etc.)
   * @returns Promise that resolves when all activations are complete
   * @throws Error if any activation fails (will stop processing remaining users)
   *
   * @example
   * ```typescript
   * // Activate multiple users
   * await userStateFacade.batchActivateUsers([123, 456, 789]);
   * ```
   */
  async batchActivateUsers(userIds: number[], opts?: FacadeOpts): Promise<Message> {
    try {
      for (const userId of userIds) {
        const result = await this.activateUser(userId, { ...opts, skipLoading: true });
        if (!result.success) {
          return {
            success: false,
            message: `Error al activar el usuario con ID ${userId}.`,
            error: result.error ? String(result.error) : undefined,
          };
        }
      }
      return {
        success: true,
        message: 'Usuarios activados exitosamente.',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al activar los usuarios.',
        error: String(error),
      };
    }
  }

  /**
   * Batch deactivate multiple users
   *
   * Deactivates multiple user accounts in sequence. This method is useful for
   * bulk operations where multiple users need to be deactivated at once.
   * The method processes each user individually to ensure proper error handling
   * and state management for each deactivation.
   *
   * @param userIds Array of user identifiers to deactivate
   * @param opts Optional facade configuration (skipLoading, etc.)
   * @returns Promise that resolves when all deactivations are complete
   * @throws Error if any deactivation fails (will stop processing remaining users)
   *
   * @example
   * ```typescript
   * // Deactivate multiple users
   * await userStateFacade.batchDeactivateUsers([123, 456, 789]);
   * ```
   */
  async batchDeactivateUsers(userIds: number[], opts?: FacadeOpts): Promise<Message> {
    try {
      for (const userId of userIds) {
        const result = await this.deactivateUser(userId, { ...opts, skipLoading: true });
        if (!result.success) {
          return {
            success: false,
            message: `Error al desactivar el usuario con ID ${userId}.`,
            error: result.error ? String(result.error) : undefined,
          };
        }
      }
      return {
        success: true,
        message: 'Usuarios desactivados exitosamente.',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al desactivar los usuarios.',
        error: String(error),
      };
    }
  }
}
