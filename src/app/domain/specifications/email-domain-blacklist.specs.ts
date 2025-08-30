import { Email } from '../value-objects/email.vo';
import { BusinessRuleError } from '../errors/business-rule-error.entity';
import { User } from '../entities/user.entity';

/**
 * Email Domain Policy Specifications
 *
 * @description
 * This specification contains complex business rules for email domain policies that are NOT
 * simple validations but rather domain business policies with multiple criteria and context.
 *
 * Business Rules:
 * - Domain blacklisting based on user type and context
 * - Corporate domain whitelisting for enterprise users
 * - Regional domain restrictions based on business requirements
 * - Temporary domain blocks for security incidents
 * - Integration with external domain reputation services
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 */
export class EmailDomainPolicySpec {
  /**
   * Business context for domain evaluation
   */
  static readonly BUSINESS_CONTEXTS = {
    ENTERPRISE: 'enterprise',
    PERSONAL: 'personal',
    EDUCATION: 'education',
    GOVERNMENT: 'government',
  } as const;

  /**
   * Domain categories for business rules
   */
  static readonly DOMAIN_CATEGORIES = {
    CORPORATE: 'corporate',
    PERSONAL: 'personal',
    EDUCATIONAL: 'educational',
    GOVERNMENT: 'government',
    TEMPORARY_BLOCKED: 'temporary_blocked',
  } as const;

  /**
   * Checks if email domain satisfies complex business rules
   *
   * @param email - Email to validate
   * @param user - User context for business rules
   * @param businessContext - Business context (enterprise, personal, etc.)
   * @param additionalRules - Additional domain rules
   * @returns True if all business rules are satisfied
   * @throws {BusinessRuleError} When business rules are violated
   */
  static isSatisfiedBy(
    email: Email,
    user: User,
    businessContext: keyof typeof EmailDomainPolicySpec.BUSINESS_CONTEXTS,
    additionalRules?: {
      allowedDomains?: string[];
      blockedDomains?: string[];
      requireCorporateDomain?: boolean;
      regionRestrictions?: string[];
    }
  ): boolean {
    const domain = email.getDomain().toLowerCase();

    // Business Rule 1: Corporate domain requirement for enterprise context
    if (businessContext === 'ENTERPRISE' && additionalRules?.requireCorporateDomain) {
      this.validateCorporateDomainRequirement(domain, user, additionalRules);
    }

    // Business Rule 2: Domain blacklisting with context
    this.validateDomainBlacklist(domain, user, businessContext, additionalRules);

    // Business Rule 3: Regional restrictions
    if (additionalRules?.regionRestrictions) {
      this.validateRegionalRestrictions(domain, additionalRules.regionRestrictions);
    }

    // Business Rule 4: Domain category validation
    this.validateDomainCategory(domain, businessContext);

    // Business Rule 5: User-specific domain policies
    this.validateUserSpecificPolicies(domain, user, businessContext);

    return true;
  }

  /**
   * Validates corporate domain requirement for enterprise users
   */
  private static validateCorporateDomainRequirement(
    domain: string,
    user: User,
    rules: { allowedDomains?: string[]; requireCorporateDomain?: boolean }
  ): void {
    if (!rules.requireCorporateDomain) return;

    const allowedDomains = rules.allowedDomains || [];
    const isCorporateDomain = allowedDomains.some(
      (allowed) => domain === allowed.toLowerCase() || domain.endsWith('.' + allowed.toLowerCase())
    );

    if (!isCorporateDomain) {
      throw new BusinessRuleError(
        'Enterprise users must use corporate email domains',
        'CORPORATE_DOMAIN_REQUIRED',
        {
          domain,
          userId: user.id,
          allowedDomains,
          businessRule: 'corporate_domain_requirement',
        }
      );
    }
  }

  /**
   * Validates domain against blacklist with business context
   */
  private static validateDomainBlacklist(
    domain: string,
    user: User,
    businessContext: string,
    rules?: { blockedDomains?: string[] }
  ): void {
    const blockedDomains = rules?.blockedDomains || this.getDefaultBlockedDomains(businessContext);

    const isBlocked = blockedDomains.some(
      (blocked) => domain === blocked.toLowerCase() || domain.endsWith('.' + blocked.toLowerCase())
    );

    if (isBlocked) {
      throw BusinessRuleError.emailDomainBlacklisted(domain);
    }
  }

  /**
   * Validates regional domain restrictions
   */
  private static validateRegionalRestrictions(domain: string, regionRestrictions: string[]): void {
    // Business rule: Check if domain violates regional policies
    const domainRegion = this.identifyDomainRegion(domain);

    if (regionRestrictions.includes(domainRegion)) {
      throw new BusinessRuleError(
        'Domain violates regional business restrictions',
        'REGIONAL_DOMAIN_RESTRICTION',
        {
          domain,
          region: domainRegion,
          restrictedRegions: regionRestrictions,
          businessRule: 'regional_restrictions',
        }
      );
    }
  }

  /**
   * Validates domain category against business context
   */
  private static validateDomainCategory(domain: string, businessContext: string): void {
    const category = this.categorizeDomain(domain);

    // Business rule: Enterprise context should use corporate domains
    if (businessContext === 'ENTERPRISE' && category !== 'CORPORATE') {
      throw new BusinessRuleError(
        'Enterprise context requires corporate domain category',
        'DOMAIN_CATEGORY_MISMATCH',
        {
          domain,
          category,
          requiredCategory: 'CORPORATE',
          businessContext,
          businessRule: 'domain_category_validation',
        }
      );
    }

    // Business rule: Educational context should use educational domains
    if (businessContext === 'EDUCATION' && category !== 'EDUCATIONAL') {
      throw new BusinessRuleError(
        'Educational context requires educational domain category',
        'DOMAIN_CATEGORY_MISMATCH',
        {
          domain,
          category,
          requiredCategory: 'EDUCATIONAL',
          businessContext,
          businessRule: 'domain_category_validation',
        }
      );
    }
  }

  /**
   * Validates user-specific domain policies
   */
  private static validateUserSpecificPolicies(
    domain: string,
    user: User,
    businessContext: string
  ): void {
    // Business rule: High-privilege users may have additional domain restrictions
    if (user.getRole?.getAccessLevel?.()?.getValue() >= 4) {
      this.validateHighPrivilegeDomainPolicies(domain, user);
    }

    // Business rule: Users with specific roles may have domain preferences
    const userRole = user.getRole?.name;
    if (userRole) {
      this.validateRoleBasedDomainPolicies(domain, userRole, businessContext);
    }
  }

  /**
   * Gets default blocked domains based on business context
   */
  private static getDefaultBlockedDomains(businessContext: string): string[] {
    const commonBlocked = ['10minutemail.com', 'guerrillamail.com', 'temp-mail.org'];

    switch (businessContext) {
      case 'ENTERPRISE':
        return [...commonBlocked, 'gmail.com', 'yahoo.com', 'hotmail.com'];
      case 'EDUCATION':
        return [...commonBlocked, 'gmail.com', 'yahoo.com'];
      default:
        return commonBlocked;
    }
  }

  /**
   * Identifies the region of a domain based on TLD and domain patterns
   */
  private static identifyDomainRegion(domain: string): string {
    const tld = domain.split('.').pop()?.toLowerCase();

    const regionMap: Record<string, string> = {
      us: 'north_america',
      ca: 'north_america',
      mx: 'north_america',
      uk: 'europe',
      de: 'europe',
      fr: 'europe',
      es: 'europe',
      it: 'europe',
      br: 'south_america',
      ar: 'south_america',
      cl: 'south_america',
      cn: 'asia',
      jp: 'asia',
      kr: 'asia',
      in: 'asia',
      au: 'oceania',
      nz: 'oceania',
    };

    return regionMap[tld || ''] || 'unknown';
  }

  /**
   * Categorizes domain based on patterns and business rules
   */
  private static categorizeDomain(domain: string): string {
    // Corporate domains (business rule patterns)
    if (
      domain.includes('.corp') ||
      domain.includes('.internal') ||
      /\b(ibm|microsoft|google|amazon|apple|facebook|meta)\.com$/.test(domain)
    ) {
      return 'CORPORATE';
    }

    // Educational domains
    if (
      domain.includes('.edu') ||
      domain.includes('.ac.') ||
      domain.includes('university') ||
      domain.includes('college')
    ) {
      return 'EDUCATIONAL';
    }

    // Government domains
    if (
      domain.includes('.gov') ||
      domain.includes('.mil') ||
      domain.includes('government') ||
      domain.includes('state.')
    ) {
      return 'GOVERNMENT';
    }

    // Personal domains (default)
    return 'PERSONAL';
  }

  /**
   * Validates domain policies for high-privilege users
   */
  private static validateHighPrivilegeDomainPolicies(domain: string, user: User): void {
    // Business rule: High-privilege users must use corporate domains
    const isCorporateDomain = this.categorizeDomain(domain) === 'CORPORATE';

    if (!isCorporateDomain) {
      throw new BusinessRuleError(
        'High-privilege users must use corporate email domains',
        'HIGH_PRIVILEGE_CORPORATE_DOMAIN_REQUIRED',
        {
          domain,
          userId: user.id,
          accessLevel: user.getRole?.getAccessLevel?.()?.getValue(),
          businessRule: 'high_privilege_domain_policy',
        }
      );
    }
  }

  /**
   * Validates role-based domain policies
   */
  private static validateRoleBasedDomainPolicies(
    domain: string,
    userRole: string,
    businessContext: string
  ): void {
    // Business rule: Administrators should use corporate domains
    if (userRole.toLowerCase().includes('admin') && this.categorizeDomain(domain) !== 'CORPORATE') {
      throw new BusinessRuleError(
        'Administrator roles require corporate email domains',
        'ADMIN_CORPORATE_DOMAIN_REQUIRED',
        {
          domain,
          userRole,
          businessContext,
          businessRule: 'role_based_domain_policy',
        }
      );
    }
  }
}
