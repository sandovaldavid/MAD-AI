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

// Application Layer Imports
import type { FacadeOpts } from '@application/types/facade-opts';
import type {
  CreateUserRequest,
  CreateUserResult,
  UpdateUserRequest,
  UpdateUserResult,
} from '@application/types/users.types';

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
  async createUser(request: CreateUserRequest, opts?: FacadeOpts): Promise<CreateUserResult> {
    if (!opts?.skipLoading) {
      this.setLoading(true);
    }
    this.setError(null);

    try {
      const user = await this.createUserUC.execute(request);

      // Update local state
      this._users.update((users) => [...users, user]);
      this._totalCount.update((count) => count + 1);

      // Send welcome notification if requested
      if (request.sendWelcomeNotification) {
        try {
          await this.notifications.success(
            `Welcome to MAD-AI, ${user.firstName}!`,
            'Your account has been created successfully'
          );
        } catch (notificationError) {
          // Don't fail user creation if notification fails
          console.warn('Failed to send welcome notification:', notificationError);
        }
      }

      // Emit event for cross-facade coordination
      this.emitEvent({
        type: 'user-created',
        user,
        notificationSent: request.sendWelcomeNotification,
      });

      const result: CreateUserResult = user;
      return result;
    } catch (error: unknown) {
      this.handleError(error);
      throw error;
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
  async updateUser(request: UpdateUserRequest, opts?: FacadeOpts): Promise<UpdateUserResult> {
    if (!opts?.skipLoading) {
      this.setLoading(true);
    }
    this.setError(null);

    try {
      const user = await this.updateUserUC.execute(request);

      // Update local state
      this._users.update((users) => users.map((u) => (u.id === request.userId ? user : u)));

      // Update selected user if it's the one being updated
      if (this._selectedUser()?.id === request.userId) {
        this._selectedUser.set(user);
      }

      // Determine updated fields
      const updatedFields = Object.keys(request.updateData);

      // Send notification to user if requested
      if (request.notifyUser) {
        try {
          await this.notifications.info(
            'Your profile has been updated',
            `Updated: ${updatedFields.join(', ')}`
          );
        } catch (notificationError) {
          console.warn('Failed to send update notification:', notificationError);
        }
      }

      // Emit event for cross-facade coordination
      this.emitEvent({
        type: 'user-updated',
        user,
        updatedFields,
      });

      const result: UpdateUserResult = user;
      return result;
    } catch (error: unknown) {
      this.handleError(error);
      throw error;
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
  async deleteUser(userId: number, opts?: FacadeOpts): Promise<void> {
    if (!opts?.skipLoading) {
      this.setLoading(true);
    }
    this.setError(null);

    try {
      // Get user info before deletion for event
      const userToDelete = this._users().find((u) => u.id === userId);
      console.log('Deleting user:', userToDelete); // Debug log

      await this.deleteUserUC.execute({ userId });

      // Update local state
      this._users.update((users) => users.filter((u) => u.id !== userId));
      this._totalCount.update((count) => count - 1);

      // Clear selected user if it's the one being deleted
      if (this._selectedUser()?.id === userId) {
        this._selectedUser.set(null);
      }

      // Emit event for cross-facade coordination
      this.emitEvent({
        type: 'user-deleted',
        userId,
      });
    } catch (error: unknown) {
      this.handleError(error);
      throw error;
    } finally {
      if (!opts?.skipLoading) {
        this.setLoading(false);
      }
    }
  }
}
