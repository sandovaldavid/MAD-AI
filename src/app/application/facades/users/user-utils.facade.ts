/**
 * @fileoverview User Utilities Facade
 *
 * This file contains the UserUtilsFacade class, which handles utility operations
 * for user management including state management, error handling, and convenience
 * methods. It extends the BaseUserFacade to leverage shared state and dependencies
 * while focusing solely on utility functionality.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { Injectable } from '@angular/core';
import { BaseUserFacade } from './base-user.facade';

// Domain Imports
import type { User } from '@domain/entities/user.entity';

// Application Layer Imports
import type { FacadeOpts } from '@application/types/facade-opts';
import type { ListUsersRequest } from '@application/types/users.types';

/**
 * User Utilities Facade
 *
 * @description
 * Specialized facade handling utility operations for user management including
 * user selection, error state management, facade state reset, and data refresh
 * operations. This facade focuses exclusively on utility functions that support
 * the overall user management experience without handling core business operations.
 *
 * @responsibilities
 * - Manage user selection for detailed views and operations
 * - Handle error state management and cleanup
 * - Provide facade state reset and initialization
 * - Coordinate data refresh operations
 * - Emit utility events for cross-facade coordination
 * - Provide convenience methods for common state operations
 *
 * @architecture
 * - Extends BaseUserFacade for shared state and dependencies
 * - Follows Single Responsibility Principle for utility operations
 * - Uses reactive state management via inherited signals
 * - Provides stateless utility methods where appropriate
 * - Coordinates with other facade components for complete operations
 *
 * @patterns
 * - Facade Pattern: Simplifies utility operations interface
 * - Command Pattern: Each operation performs specific utility function
 * - Observer Pattern: Emits events for utility state changes
 * - Template Method: Uses base class methods for common operations
 * - Helper Pattern: Provides convenience methods for common tasks
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class UserUtilsFacade extends BaseUserFacade {
  // ============================================================================
  // User Selection Management
  // ============================================================================

  /**
   * Select a user for detailed view
   *
   * Sets the currently selected user for detailed operations such as editing,
   * viewing profile details, or performing user-specific actions. This method
   * updates the selectedUser state and emits an event for cross-facade coordination,
   * allowing other components to react to user selection changes.
   *
   * @param user User entity to select, or null to clear selection
   * @example
   * ```typescript
   * // Select a user for detailed view
   * userUtilsFacade.selectUser(someUser);
   *
   * // Clear user selection
   * userUtilsFacade.selectUser(null);
   *
   * // Select user and handle in component
   * userUtilsFacade.selectUser(user);
   * // Component can then react to selectedUser() signal changes
   * ```
   */
  selectUser(user: User | null): void {
    this._selectedUser.set(user);
    this.emitEvent({
      type: 'bulk-operation-completed',
      operation: 'user-selection',
      results: { selectedUser: user },
    });
  }

  /**
   * Clear user selection
   *
   * Convenience method to clear the currently selected user. This is equivalent
   * to calling selectUser(null) but provides a more explicit interface for
   * clearing selection state.
   *
   * @example
   * ```typescript
   * // Clear user selection explicitly
   * userUtilsFacade.clearSelection();
   * ```
   */
  clearSelection(): void {
    this.selectUser(null);
  }

  /**
   * Select user by ID
   *
   * Convenience method to select a user by their ID from the current user list.
   * If the user is not found in the current list, the selection is cleared.
   * This method is useful when you have a user ID from URL parameters or
   * other sources and need to select the corresponding user.
   *
   * @param userId ID of the user to select
   * @returns boolean indicating whether the user was found and selected
   *
   * @example
   * ```typescript
   * // Select user by ID from current list
   * const found = userUtilsFacade.selectUserById(123);
   * if (!found) {
   *   console.log('User not found in current list');
   * }
   * ```
   */
  selectUserById(userId: number): boolean {
    const user = this._users().find((u) => u.id === userId);
    if (user) {
      this.selectUser(user);
      return true;
    } else {
      this.clearSelection();
      return false;
    }
  }

  // ============================================================================
  // Error State Management
  // ============================================================================

  /**
   * Clear all error states
   *
   * Resets the current error state to null, clearing any error messages
   * that might be displayed to the user. This method is useful for dismissing
   * error notifications, resetting error state after successful operations,
   * or clearing errors when starting new operations.
   *
   * @example
   * ```typescript
   * // Clear any displayed errors after successful retry
   * try {
   *   await someUserOperation();
   * } catch (error) {
   *   // Handle error and show to user
   *   console.error('Operation failed:', error);
   *   // Later, when user acknowledges the error
   *   userUtilsFacade.clearError();
   * }
   *
   * // Clear errors before starting new operation
   * userUtilsFacade.clearError();
   * await userUtilsFacade.createUser(userData);
   * ```
   */
  clearError(): void {
    this.setError(null);
  }

  /**
   * Check if there is an active error
   *
   * Convenience method to check if the facade currently has an error state.
   * This method provides a simple boolean check for error presence without
   * needing to access the error signal directly.
   *
   * @returns boolean indicating whether there is an active error
   *
   * @example
   * ```typescript
   * // Check for errors before proceeding
   * if (userUtilsFacade.hasError()) {
   *   console.log('Please resolve errors before continuing');
   *   return;
   * }
   * ```
   */
  hasError(): boolean {
    return this._userError() !== null;
  }

  // ============================================================================
  // Facade State Management
  // ============================================================================

  /**
   * Reset all facade state to initial values
   *
   * Performs a complete reset of all internal state managed by the facade.
   * This includes clearing the users list, selected user, current filters,
   * loading states, error messages, and bulk operation results. This method
   * is useful for scenarios like user logout, component unmounting, or when
   * a complete state refresh is needed.
   *
   * @example
   * ```typescript
   * // Reset entire facade state after user logout
   * userUtilsFacade.reset();
   *
   * // Reset state when component unmounts
   * ngOnDestroy() {
   *   this.userUtilsFacade.reset();
   * }
   *
   * // Reset state before loading new data set
   * userUtilsFacade.reset();
   * await userListFacade.loadUsers();
   * ```
   */
  reset(): void {
    this._users.set([]);
    this._selectedUser.set(null);
    this.setLoading(false);
    this.setError(null);
    this._currentFilter.set(null);
    this._totalCount.set(0);
    this._lastBulkOperation.set({ type: null, result: null });
  }

  /**
   * Refresh the current user list
   *
   * Reloads the user list using the current filter criteria. This method is useful
   * for getting the latest data from the server without changing the current
   * filter or pagination settings. It maintains the current filter state while
   * fetching fresh data from the server.
   *
   * @param opts Optional facade configuration for the refresh operation
   * @returns Promise that resolves when the refresh is complete
   *
   * @example
   * ```typescript
   * // Refresh current user list with existing filters
   * await userUtilsFacade.refresh();
   *
   * // Refresh without showing loading indicator
   * await userUtilsFacade.refresh({ skipLoading: true });
   * ```
   */
  async refresh(opts?: FacadeOpts): Promise<void> {
    const currentFilter = this._currentFilter();
    const request: ListUsersRequest | undefined = currentFilter
      ? { filter: currentFilter, requesterId: this.getCurrentUserId() }
      : { requesterId: this.getCurrentUserId() };

    await this.listUsersUC
      .execute(request)
      .then((result) => {
        // Update local state with refreshed data
        this._users.set(result.users);
        this._totalCount.set(result.totalCount);

        // Emit refresh event
        this.emitEvent({
          type: 'bulk-operation-completed',
          operation: 'refresh-users',
          results: result,
        });
      })
      .catch((error) => {
        this.handleError(error);
        throw error;
      });
  }

  /**
   * Initialize facade with default data
   *
   * Loads initial user data when the facade is first used or when a complete
   * initialization is needed. This method clears any existing state and loads
   * a fresh set of user data with default parameters.
   *
   * @param opts Optional facade configuration for the initialization
   * @returns Promise that resolves when initialization is complete
   *
   * @example
   * ```typescript
   * // Initialize facade when component loads
   * ngOnInit() {
   *   await this.userUtilsFacade.initialize();
   * }
   * ```
   */
  async initialize(opts?: FacadeOpts): Promise<void> {
    this.reset();
    await this.refresh(opts);
  }

  // ============================================================================
  // Convenience Methods
  // ============================================================================

  /**
   * Get user count statistics
   *
   * Returns a summary of user count statistics including total users,
   * active users, and inactive users from the current user list.
   * This method provides quick access to user statistics without
   * needing to compute them manually.
   *
   * @returns Object containing user count statistics
   *
   * @example
   * ```typescript
   * // Get current user statistics
   * const stats = userUtilsFacade.getUserCountStats();
   * console.log(`Total: ${stats.total}, Active: ${stats.active}, Inactive: ${stats.inactive}`);
   * ```
   */
  getUserCountStats(): { total: number; active: number; inactive: number } {
    const users = this._users();
    const active = users.filter((u) => u.active).length;

    return {
      total: users.length,
      active,
      inactive: users.length - active,
    };
  }

  /**
   * Check if facade is in loading state
   *
   * Convenience method to check if any operation is currently in progress.
   * This method provides a simple boolean check for loading state without
   * needing to access the loading signal directly.
   *
   * @returns boolean indicating whether any operation is in progress
   *
   * @example
   * ```typescript
   * // Check loading state before starting new operation
   * if (userUtilsFacade.isLoading()) {
   *   console.log('Another operation is in progress');
   *   return;
   * }
   * ```
   */
  isLoading(): boolean {
    return this._loading();
  }

  // ============================================================================
  // User Display Formatting Methods
  // ============================================================================

  /**
   * Get display name for a user (username or full name)
   *
   * @param user User entity
   * @returns Display name for UI purposes
   */
  getDisplayName(user: User): string {
    return user.username.value || this.getFullName(user.firstName, user.lastName);
  }

  /**
   * Get formatted full name from first and last name
   *
   * @param firstName User's first name
   * @param lastName User's last name
   * @returns Formatted full name
   */
  getFullName(firstName: User['firstName'], lastName: User['lastName']): string {
    return `${firstName.value.trim()} ${lastName.value.trim()}`;
  }

  /**
   * Format username for display (convert underscores to spaces and capitalize)
   *
   * @param username Username value object
   * @returns Formatted display name
   */
  formatUsernameForDisplay(username: User['username']): string {
    return username.value
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Format username for different contexts
   *
   * @param username Username value object
   * @param context Display context
   * @returns Context-appropriate formatted username
   */
  formatUsernameForContext(
    username: User['username'],
    context: 'raw' | 'display' | 'mention'
  ): string {
    switch (context) {
      case 'display':
        return this.formatUsernameForDisplay(username);
      case 'mention':
        return `@${username.value}`;
      case 'raw':
      default:
        return username.value;
    }
  }

  /**
   * Format lastname for display
   *
   * @param lastName LastName value object
   * @returns Display formatted lastname
   */
  formatLastNameForDisplay(lastName: User['lastName']): string {
    return lastName?.value || '';
  }

  /**
   * Format lastname for formal display
   *
   * @param lastName LastName value object
   * @returns Formal formatted lastname (uppercase)
   */
  formatLastNameForFormal(lastName: User['lastName']): string {
    return lastName?.value?.toUpperCase() || '';
  }

  /**
   * Format lastname for initial display
   *
   * @param lastName LastName value object
   * @returns Initial letter of lastname
   */
  formatLastNameForInitial(lastName: User['lastName']): string {
    if (!lastName?.value) return '';
    const words = lastName.value.split(/\s+/);
    for (let i = words.length - 1; i >= 0; i--) {
      if (!['de', 'la', 'del', 'los', 'las', 'y', 'e'].includes(words[i].toLowerCase())) {
        return words[i].charAt(0).toUpperCase();
      }
    }
    return words[words.length - 1].charAt(0).toUpperCase();
  }

  /**
   * Format lastname for different contexts
   *
   * @param lastName LastName value object
   * @param context Display context
   * @returns Context-appropriate formatted lastname
   */
  formatLastNameForContext(
    lastName: User['lastName'],
    context: 'formal' | 'abbreviated' | 'initial' | 'display'
  ): string {
    switch (context) {
      case 'formal':
        return this.formatLastNameForFormal(lastName);
      case 'abbreviated':
        return this.abbreviateLastName(lastName, 10);
      case 'initial':
        return this.formatLastNameForInitial(lastName);
      case 'display':
      default:
        return this.formatLastNameForDisplay(lastName);
    }
  }

  /**
   * Abbreviate lastname for display
   *
   * @param lastName LastName value object
   * @param maxLength Maximum length for abbreviation
   * @returns Abbreviated lastname
   */
  abbreviateLastName(lastName: User['lastName'], maxLength: number): string {
    if (!lastName?.value || lastName.value.length <= maxLength) return lastName?.value || '';

    const words = lastName.value.split(/\s+/);
    const result: string[] = [];
    let length = 0;

    for (const word of words) {
      const lw = word.toLowerCase();
      if (length + lw.length + 1 > maxLength) break;
      result.push(lw);
      length += lw.length + 1;
    }

    return result.join(' ') + (length < lastName.value.length ? '…' : '');
  }
}
