import { User } from '../entities/user.entity';

/**
 * Specification for User business rules.
 * Encapsulates business logic for profile completeness, access eligibility, and email domain checking.
 */
export class UserBusinessRules {
  /**
   * Checks if the user profile is complete.
   * @param user - User entity
   */
  static hasCompleteProfile(user: User): boolean {
    // Basic fields must exist
    const hasBasicFields = !!user.username && !!user.email && !!user.firstName && !!user.lastName;

    // Users with pending status are considered incomplete
    if (user.status?.value === 'pending') {
      return false;
    }

    return hasBasicFields;
  }

  /**
   * Checks if the user can access the system.
   * @param user - User entity
   */
  static canAccess(user: User): boolean {
    // All users need confirmed email to be valid
    return user.isEmailConfirmed ?? false;
  }

  /**
   * Checks if the user's email is from a specific domain.
   * @param user - User entity
   * @param domain - Domain to check
   */
  static emailFrom(user: User, domain: string): boolean {
    return user.email.value.endsWith(`@${domain.toLowerCase()}`);
  }
}
