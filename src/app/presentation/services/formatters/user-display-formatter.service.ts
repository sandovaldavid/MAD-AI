import { inject, Injectable } from '@angular/core';
import { UserUtilsFacade } from '@application/facades/users/user-utils.facade';

/**
 * User Display Formatting Service
 *
 * @description
 * Handles presentation-specific formatting and display of user information.
 * This service delegates to Application layer for formatting logic to maintain
 * Clean Architecture separation.
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 */
@Injectable({ providedIn: 'root' })
export class UserDisplayFormatterService {
  private readonly userUtilsFacade = inject(UserUtilsFacade);

  /**
   * Returns a display name for the user (username or full name).
   *
   * @param user - User entity
   * @returns Display name for UI purposes
   */
  getDisplayName(user: any): string {
    return this.userUtilsFacade.getDisplayName(user);
  }

  /**
   * Creates a formatted full name from first and last name
   *
   * @param firstName - User's first name
   * @param lastName - User's last name
   * @returns Formatted full name
   */
  getFullName(firstName: any, lastName: any): string {
    return this.userUtilsFacade.getFullName(firstName, lastName);
  }

  /**
   * Creates display variants for user information
   *
   * @param user - User entity
   * @returns Object with different display variants
   */
  getDisplayVariants(user: any): {
    displayName: string;
    fullName: string;
    username: string;
    formalName: string;
  } {
    const fullName = this.getFullName(user.firstName, user.lastName);

    return {
      displayName: this.getDisplayName(user),
      fullName: fullName,
      username: user.username.value,
      formalName: fullName.toUpperCase(),
    };
  }
}
