import { User } from '@domain/entities/user.entity';
import { FirstName } from '@domain/value-objects/firstname.vo';
import { LastName } from '@domain/value-objects/lastname.vo';

/**
 * User Display Formatting Service
 *
 * @description
 * Handles presentation-specific formatting and display of user information.
 * This service contains logic that is NOT part of the User entity invariants but
 * rather presentation/formatting rules.
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 */
export class UserDisplayFormatterService {
  /**
   * Returns a display name for the user (username or full name).
   *
   * @param user - User entity
   * @returns Display name for UI purposes
   *
   * @example
   * ```typescript
   * const user = User.create({...});
   * const displayName = UserDisplayFormatterService.getDisplayName(user);
   * console.log(displayName); // "john_doe" or "John Doe"
   * ```
   */
  static getDisplayName(user: User): string {
    return user.username.value || this.getFullName(user.firstName, user.lastName);
  }

  /**
   * Creates a formatted full name from first and last name
   *
   * @param firstName - User's first name
   * @param lastName - User's last name
   * @returns Formatted full name
   */
  static getFullName(firstName: FirstName, lastName: LastName): string {
    return `${firstName.value.trim()} ${lastName.value.trim()}`;
  }

  /**
   * Creates display variants for user information
   *
   * @param user - User entity
   * @returns Object with different display variants
   */
  static getDisplayVariants(user: User): {
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
