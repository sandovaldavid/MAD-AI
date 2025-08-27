import { User } from '../../entities/user.entity';

/**
 * Service for formatting User entity for presentation purposes.
 * Handles display logic such as full name, display name, and string representation.
 */
export class UserFormatterService {
  /**
   * Returns the full name of the user (firstName + lastName).
   * @param user - User entity
   */
  static getFullName(user: User): string {
    return `${user.firstName} ${user.lastName}`.trim();
  }

  /**
   * Returns a display name for the user (username or full name).
   * @param user - User entity
   */
  static getDisplayName(user: User): string {
    return user.username || this.getFullName(user);
  }
}
