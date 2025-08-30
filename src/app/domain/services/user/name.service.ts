import { FirstName } from '@domain/value-objects/firstname.vo';
import { LastName } from '@domain/value-objects/lastname.vo';
import { BusinessRuleError } from '@domain/errors/business-rule-error.entity';

/**
 * Domain Service: Name normalization and validation
 *
 * Contains pure business logic for name validation and normalization.
 * Display formatting logic has been moved to Presentation layer.
 */
export class NameService {
  /**
   * Normalizes a full name from first and last name value objects
   *
   * @param first - First name value object
   * @param last - Last name value object
   * @returns Normalized full name string
   * @throws BusinessRuleError if names are invalid
   */
  static normalizeFullName(first: FirstName, last: LastName): string {
    if (!first || !last) {
      throw BusinessRuleError.invalidPreferencesUpdate({ first, last });
    }
    return `${first.value.trim()} ${last.value.trim()}`;
  }

  /**
   * Validates that first and last name are not identical
   *
   * @param first - First name value object
   * @param last - Last name value object
   * @returns true if validation passes
   * @throws BusinessRuleError if names are identical
   */
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
}
