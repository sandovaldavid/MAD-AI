import { Email } from '../value-objects/email.vo';
import { BusinessRuleError } from '../errors/business-rule-error.entity';

/**
 * Specification: Email domain must not be blacklisted
 */
export class EmailDomainBlacklistSpec {
  static isSatisfiedBy(email: Email, blacklist: string[]): boolean {
    const domain = email.getDomain().toLowerCase();
    if (blacklist.includes(domain)) {
      throw BusinessRuleError.emailDomainBlacklisted(domain);
    }
    return true;
  }
}
