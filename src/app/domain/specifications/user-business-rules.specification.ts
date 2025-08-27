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
    return !!user.username && !!user.email && !!user.firstName && !!user.lastName;
  }

  /**
   * Checks if the user can access the system.
   * @param user - User entity
   */
  static canAccess(user: User): boolean {
    return user.active && (user.isEmailConfirmed ?? false);
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
