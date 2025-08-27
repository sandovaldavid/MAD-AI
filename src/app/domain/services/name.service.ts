import { FirstName } from '../value-objects/firstname.vo';
import { LastName } from '../value-objects/lastname.vo';
import { BusinessRuleError } from '../errors/business-rule-error.entity';

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
}
