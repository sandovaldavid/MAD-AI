import { FirstName } from '../value-objects/firstname.vo';
import { BusinessRuleError } from '../errors/business-rule-error.entity';

/**
 * Specification: Compound first names must not exceed 2 parts
 */
export class FirstNameCompoundSpec {
  static isSatisfiedBy(firstName: FirstName): boolean {
    const parts = firstName.value.split(/\s|\-/).filter(Boolean);
    if (parts.length > 2) {
      throw new BusinessRuleError(
        'Compound first name must not exceed 2 parts',
        'FIRSTNAME_TOO_MANY_PARTS',
        { value: firstName.value, parts }
      );
    }
    return true;
  }
}
