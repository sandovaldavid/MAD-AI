import { FirstName } from '@domain/value-objects/firstname.vo';
import { LastName } from '@domain/value-objects/lastname.vo';
import { BusinessRuleError } from '@domain/errors/business-rule-error.entity';
import { User } from '@domain/entities/user.entity';

/**
 * Domain Service: Name normalization and validation
 */
export class NameService {
  static normalizeFullName(first: FirstName, last: LastName): string {
    if (!first || !last) {
      throw BusinessRuleError.invalidPreferencesUpdate({ first, last });
    }
    return `${first.value.trim()} ${last.value.trim()}`;
  }

  static validateNamePair(first: FirstName, last: LastName): boolean {
    if (first.value === last.value) {
      throw new BusinessRuleError(
        'First and last name cannot be identical',
        'NAME_PAIR_IDENTICAL',
        { first: first.value, last: last.value }
      );
    }
    return true;
  }

  /**
   * Returns a display name for the user (username or full name).
   * @param user - User entity
   */
  static getDisplayName(user: User): string {
    return user.username.value || this.normalizeFullName(user.firstName, user.lastName);
  }
}
