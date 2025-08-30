import { FirstName } from '../value-objects/firstname.vo';
import { BusinessRuleError } from '../errors/business-rule-error.entity';
import { User } from '../entities/user.entity';

/**
 * FirstName Compound Policy Specifications
 *
 * @description
 * This specification contains complex business rules for compound first names that are NOT
 * simple validations but rather domain business policies with cultural, regional, and
 * organizational considerations.
 *
 * Business Rules:
 * - Maximum compound name parts based on cultural context
 * - Regional naming conventions and restrictions
 * - Organizational naming policies for formal communications
 * - Integration with user roles and access levels
 * - Support for hyphenated and multi-word names
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 */
export class FirstNameCompoundPolicySpec {
  /**
   * Cultural contexts for compound name evaluation
   */
  static readonly CULTURAL_CONTEXTS = {
    LATIN_AMERICAN: 'latin_american',
    SPANISH: 'spanish',
    ANGLO_SAXON: 'anglo_saxon',
    EASTERN_EUROPEAN: 'eastern_european',
    ASIAN: 'asian',
    MIDDLE_EASTERN: 'middle_eastern',
  } as const;

  /**
   * Organizational contexts for name policies
   */
  static readonly ORGANIZATIONAL_CONTEXTS = {
    FORMAL_BUSINESS: 'formal_business',
    CASUAL_BUSINESS: 'casual_business',
    ACADEMIC: 'academic',
    GOVERNMENT: 'government',
    INTERNATIONAL: 'international',
  } as const;

  /**
   * Checks if compound first name satisfies complex business rules
   *
   * @param firstName - FirstName to validate
   * @param user - User context for business rules
   * @param culturalContext - Cultural naming context
   * @param organizationalContext - Organizational naming policies
   * @param additionalRules - Additional compound name rules
   * @returns True if all business rules are satisfied
   * @throws {BusinessRuleError} When business rules are violated
   */
  static isSatisfiedBy(
    firstName: FirstName,
    user: User,
    culturalContext: keyof typeof FirstNameCompoundPolicySpec.CULTURAL_CONTEXTS,
    organizationalContext: keyof typeof FirstNameCompoundPolicySpec.ORGANIZATIONAL_CONTEXTS,
    additionalRules?: {
      maxParts?: number;
      allowHyphenated?: boolean;
      requireFormalFormat?: boolean;
      regionSpecificRules?: Record<string, unknown>;
    }
  ): boolean {
    const nameParts = this.analyzeNameParts(firstName.value);

    // Business Rule 1: Cultural compound name limits
    this.validateCulturalCompoundLimits(nameParts, culturalContext, additionalRules);

    // Business Rule 2: Organizational naming policies
    this.validateOrganizationalPolicies(nameParts, organizationalContext, user, additionalRules);

    // Business Rule 3: Role-based name complexity
    this.validateRoleBasedComplexity(nameParts, user, organizationalContext);

    // Business Rule 4: Regional naming conventions
    if (additionalRules?.regionSpecificRules) {
      this.validateRegionalConventions(
        nameParts,
        culturalContext,
        additionalRules.regionSpecificRules
      );
    }

    // Business Rule 5: Formal vs informal name formats
    this.validateNameFormat(nameParts, organizationalContext, additionalRules);

    return true;
  }

  /**
   * Analyzes name parts including hyphenated components
   */
  private static analyzeNameParts(name: string): {
    parts: string[];
    hyphenatedParts: string[];
    totalParts: number;
    hasHyphens: boolean;
    separators: string[];
  } {
    const hyphenatedParts = name.split('-').filter(Boolean);
    const parts = name.split(/\s+/).filter(Boolean);
    const separators = name.match(/[-\s]+/g) || [];

    return {
      parts,
      hyphenatedParts,
      totalParts: Math.max(parts.length, hyphenatedParts.length),
      hasHyphens: name.includes('-'),
      separators,
    };
  }

  /**
   * Validates compound name limits based on cultural context
   */
  private static validateCulturalCompoundLimits(
    nameAnalysis: ReturnType<typeof FirstNameCompoundPolicySpec.analyzeNameParts>,
    culturalContext: string,
    rules?: { maxParts?: number }
  ): void {
    const maxParts = rules?.maxParts || this.getCulturalMaxParts(culturalContext);

    if (nameAnalysis.totalParts > maxParts) {
      throw new BusinessRuleError(
        `Compound first name exceeds cultural limit of ${maxParts} parts`,
        'CULTURAL_COMPOUND_LIMIT_EXCEEDED',
        {
          totalParts: nameAnalysis.totalParts,
          maxParts,
          culturalContext,
          nameParts: nameAnalysis.parts,
          businessRule: 'cultural_compound_limits',
        }
      );
    }
  }

  /**
   * Gets maximum compound parts based on cultural context
   */
  private static getCulturalMaxParts(culturalContext: string): number {
    const culturalLimits: Record<string, number> = {
      latin_american: 3, // María de los Ángeles
      spanish: 3, // María del Carmen
      anglo_saxon: 2, // Mary Elizabeth
      eastern_european: 2, // Anna Maria
      asian: 2, // Mei Ling
      middle_eastern: 2, // Fatima al-Zahra
    };

    return culturalLimits[culturalContext] || 2;
  }

  /**
   * Validates organizational naming policies
   */
  private static validateOrganizationalPolicies(
    nameAnalysis: ReturnType<typeof FirstNameCompoundPolicySpec.analyzeNameParts>,
    organizationalContext: string,
    user: User,
    rules?: { requireFormalFormat?: boolean }
  ): void {
    // Business rule: Formal business requires specific formats
    if (organizationalContext === 'FORMAL_BUSINESS' && rules?.requireFormalFormat) {
      this.validateFormalBusinessFormat(nameAnalysis, user);
    }

    // Business rule: Academic context may have different standards
    if (organizationalContext === 'ACADEMIC') {
      this.validateAcademicFormat(nameAnalysis);
    }

    // Business rule: Government context requires strict formats
    if (organizationalContext === 'GOVERNMENT') {
      this.validateGovernmentFormat(nameAnalysis);
    }
  }

  /**
   * Validates role-based name complexity
   */
  private static validateRoleBasedComplexity(
    nameAnalysis: ReturnType<typeof FirstNameCompoundPolicySpec.analyzeNameParts>,
    user: User,
    organizationalContext: string
  ): void {
    const userRole = user.getRole?.name;
    const accessLevel = user.getRole?.getAccessLevel?.()?.getValue() || 1;

    // Business rule: High-level executives may have simpler names for branding
    if (accessLevel >= 4 && organizationalContext === 'FORMAL_BUSINESS') {
      if (nameAnalysis.totalParts > 2) {
        throw new BusinessRuleError(
          'Executive names should be concise for branding purposes',
          'EXECUTIVE_NAME_SIMPLICITY',
          {
            totalParts: nameAnalysis.totalParts,
            maxAllowed: 2,
            userRole,
            accessLevel,
            businessRule: 'executive_name_complexity',
          }
        );
      }
    }

    // Business rule: Entry-level users may have more complex cultural names
    if (accessLevel <= 2 && nameAnalysis.totalParts > 3) {
      // Allow more complex names for entry-level users
      return;
    }
  }

  /**
   * Validates regional naming conventions
   */
  private static validateRegionalConventions(
    nameAnalysis: ReturnType<typeof FirstNameCompoundPolicySpec.analyzeNameParts>,
    culturalContext: string,
    regionRules: Record<string, unknown>
  ): void {
    // Business rule: Check region-specific naming patterns
    if (culturalContext === 'LATIN_AMERICAN' && regionRules['spanishCompoundRules']) {
      this.validateSpanishCompoundRules(nameAnalysis, regionRules['spanishCompoundRules']);
    }

    if (culturalContext === 'ANGLO_SAXON' && regionRules['englishHyphenationRules']) {
      this.validateEnglishHyphenationRules(nameAnalysis, regionRules['englishHyphenationRules']);
    }
  }

  /**
   * Validates name format based on organizational context
   */
  private static validateNameFormat(
    nameAnalysis: ReturnType<typeof FirstNameCompoundPolicySpec.analyzeNameParts>,
    organizationalContext: string,
    rules?: { allowHyphenated?: boolean }
  ): void {
    // Business rule: Check hyphenation policies
    if (!rules?.allowHyphenated && nameAnalysis.hasHyphens) {
      throw new BusinessRuleError(
        'Hyphenated names not allowed in this organizational context',
        'HYPHENATED_NAME_NOT_ALLOWED',
        {
          hasHyphens: nameAnalysis.hasHyphens,
          organizationalContext,
          businessRule: 'hyphenation_policy',
        }
      );
    }

    // Business rule: Formal contexts may require title case
    if (organizationalContext === 'FORMAL_BUSINESS') {
      this.validateTitleCaseFormat(nameAnalysis.parts);
    }
  }

  /**
   * Validates formal business name format
   */
  private static validateFormalBusinessFormat(
    nameAnalysis: ReturnType<typeof FirstNameCompoundPolicySpec.analyzeNameParts>,
    user: User
  ): void {
    // Business rule: First part should be properly capitalized
    const firstPart = nameAnalysis.parts[0];
    if (firstPart && !/^[A-Z][a-z]+$/.test(firstPart)) {
      throw new BusinessRuleError(
        'First name part must be properly capitalized for formal business use',
        'FORMAL_BUSINESS_CAPITALIZATION',
        {
          firstPart,
          userId: user.id,
          businessRule: 'formal_business_format',
        }
      );
    }
  }

  /**
   * Validates academic name format
   */
  private static validateAcademicFormat(
    nameAnalysis: ReturnType<typeof FirstNameCompoundPolicySpec.analyzeNameParts>
  ): void {
    // Business rule: Academic names may allow more complex formats
    // but should maintain readability
    if (nameAnalysis.totalParts > 4) {
      throw new BusinessRuleError(
        'Academic names should not exceed 4 parts for readability',
        'ACADEMIC_NAME_READABILITY',
        {
          totalParts: nameAnalysis.totalParts,
          maxAllowed: 4,
          businessRule: 'academic_format',
        }
      );
    }
  }

  /**
   * Validates government name format
   */
  private static validateGovernmentFormat(
    nameAnalysis: ReturnType<typeof FirstNameCompoundPolicySpec.analyzeNameParts>
  ): void {
    // Business rule: Government names require strict formatting
    if (nameAnalysis.hasHyphens && nameAnalysis.parts.length > 2) {
      throw new BusinessRuleError(
        'Government names cannot combine hyphens with multiple parts',
        'GOVERNMENT_NAME_FORMAT',
        {
          hasHyphens: nameAnalysis.hasHyphens,
          partsCount: nameAnalysis.parts.length,
          businessRule: 'government_format',
        }
      );
    }
  }

  /**
   * Validates Spanish compound name rules
   */
  private static validateSpanishCompoundRules(
    nameAnalysis: ReturnType<typeof FirstNameCompoundPolicySpec.analyzeNameParts>,
    spanishRules: unknown
  ): void {
    // Business rule: Spanish names may have specific particle patterns
    const hasSpanishParticles = nameAnalysis.parts.some((part) =>
      ['de', 'del', 'la', 'las', 'los'].includes(part.toLowerCase())
    );

    if (
      hasSpanishParticles &&
      (spanishRules as { restrictParticles?: boolean }).restrictParticles
    ) {
      throw new BusinessRuleError(
        'Spanish name particles restricted in this context',
        'SPANISH_PARTICLE_RESTRICTION',
        {
          hasParticles: hasSpanishParticles,
          particles: ['de', 'del', 'la', 'las', 'los'],
          businessRule: 'spanish_compound_rules',
        }
      );
    }
  }

  /**
   * Validates English hyphenation rules
   */
  private static validateEnglishHyphenationRules(
    nameAnalysis: ReturnType<typeof FirstNameCompoundPolicySpec.analyzeNameParts>,
    englishRules: unknown
  ): void {
    // Business rule: English names have specific hyphenation patterns
    if (
      nameAnalysis.hasHyphens &&
      (englishRules as { restrictDoubleHyphens?: boolean }).restrictDoubleHyphens
    ) {
      const hyphenCount = (nameAnalysis.hyphenatedParts.join('').match(/-/g) || []).length;
      if (hyphenCount > 1) {
        throw new BusinessRuleError(
          'English names cannot have multiple hyphens',
          'ENGLISH_HYPHENATION_RESTRICTION',
          {
            hyphenCount,
            maxAllowed: 1,
            businessRule: 'english_hyphenation_rules',
          }
        );
      }
    }
  }

  /**
   * Validates title case format
   */
  private static validateTitleCaseFormat(parts: string[]): void {
    // Business rule: Each part should be title case
    const invalidParts = parts.filter((part) => !/^[A-Z][a-z]*$/.test(part));

    if (invalidParts.length > 0) {
      throw new BusinessRuleError(
        'All name parts must be in title case for formal contexts',
        'TITLE_CASE_FORMAT',
        {
          invalidParts,
          allParts: parts,
          businessRule: 'title_case_format',
        }
      );
    }
  }
}
