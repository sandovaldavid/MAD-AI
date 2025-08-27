/**
 * Username Business Rules Specifications
 *
 * @description
 * This specification contains business rules for username operations that are NOT
 * invariants of the Username value object but rather domain business policies.
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 */
export class UsernameBusinessRules {
  /**
   * Reserved usernames that cannot be used by regular users (business rule)
   */
  private static readonly RESERVED_USERNAMES: readonly string[] = [
    'admin',
    'administrator',
    'root',
    'superuser',
    'moderator',
    'api',
    'www',
    'mail',
    'email',
    'support',
    'help',
    'info',
    'contact',
    'sales',
    'marketing',
    'noreply',
    'postmaster',
    'hostmaster',
    'webmaster',
    'abuse',
    'security',
    'privacy',
    'legal',
    'terms',
    'service',
    'system',
    'daemon',
    'guest',
    'anonymous',
    'user',
    'test',
    'demo',
    'example',
    'sample',
    'null',
    'undefined',
    'void',
    'nobody',
    'noone',
  ];

  /**
   * Checks if username is reserved (business rule)
   *
   * @param username - The username to check
   * @returns True if username is reserved
   *
   * @example
   * ```typescript
   * const isReserved = UsernameBusinessRules.isReserved('admin');
   * console.log(isReserved); // true
   * ```
   */
  static isReserved(username: string): boolean {
    return this.RESERVED_USERNAMES.includes(username.toLowerCase());
  }

  /**
   * Validates username against security policies (business rule)
   *
   * @param username - The username to validate
   * @returns Security validation result
   *
   * @example
   * ```typescript
   * const security = UsernameBusinessRules.validateSecurity('user123');
   * console.log(security.hasSequentialChars); // true
   * console.log(security.isSecure); // false
   * ```
   */
  static validateSecurity(username: string): {
    hasSequentialChars: boolean;
    hasRepeatedChars: boolean;
    isCommonPattern: boolean;
    isSecure: boolean;
  } {
    const hasSequentialChars =
      /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|123|234|345|456|567|678|789)/.test(
        username
      );
    const hasRepeatedChars = /(.)\\1{2,}/.test(username);
    const isCommonPattern = /^(user|test|temp|admin)\\d*$/.test(username);

    return {
      hasSequentialChars,
      hasRepeatedChars,
      isCommonPattern,
      isSecure:
        !hasSequentialChars && !hasRepeatedChars && !isCommonPattern && !this.isReserved(username),
    };
  }

  /**
   * Generates suggested username variations (business rule)
   *
   * @param baseUsername - Base username to create variations from
   * @param count - Number of suggestions to generate
   * @returns Array of suggested username variations
   *
   * @example
   * ```typescript
   * const suggestions = UsernameBusinessRules.getSuggestedVariations('john_doe', 3);
   * console.log(suggestions); // ['john_doe1', 'john_doe2', 'johndoe']
   * ```
   */
  static getSuggestedVariations(baseUsername: string, count: number = 5): string[] {
    const suggestions: string[] = [];
    const base = baseUsername.toLowerCase().trim();

    // Add numbered variations
    for (let i = 1; i <= Math.min(count, 3); i++) {
      suggestions.push(`${base}${i}`);
    }

    // Add variation without underscores
    if (base.includes('_')) {
      suggestions.push(base.replace(/_/g, ''));
    }

    // Add variation with current year
    if (suggestions.length < count) {
      suggestions.push(`${base}_${new Date().getFullYear()}`);
    }

    // Add common suffixes
    const suffixes = ['_user', '_dev', '_pro', '_official'];
    for (const suffix of suffixes) {
      if (suggestions.length >= count) break;
      if ((base + suffix).length <= 32) {
        // Max username length
        suggestions.push(base + suffix);
      }
    }

    return suggestions.slice(0, count);
  }

  /**
   * Analyzes username characteristics (business rule)
   *
   * @param username - The username to analyze
   * @returns Analysis metadata
   */
  static analyzeCharacteristics(username: string): {
    isAlphaOnly: boolean;
    hasNumbers: boolean;
    hasUnderscores: boolean;
    length: number;
    isReserved: boolean;
    securityCheck: ReturnType<typeof UsernameBusinessRules.validateSecurity>;
  } {
    return {
      isAlphaOnly: /^[a-z]+$/.test(username),
      hasNumbers: /\\d/.test(username),
      hasUnderscores: username.includes('_'),
      length: username.length,
      isReserved: this.isReserved(username),
      securityCheck: this.validateSecurity(username),
    };
  }

  /**
   * Suggests usernames based on full name (business rule)
   *
   * @param firstName - First name
   * @param lastName - Last name
   * @returns Array of username suggestions
   *
   * @example
   * ```typescript
   * const suggestions = UsernameBusinessRules.suggestFromName('John', 'Doe');
   * console.log(suggestions); // ['john_doe', 'johndoe', 'john_d', 'j_doe', etc.]
   * ```
   */
  static suggestFromName(firstName: string, lastName: string): string[] {
    const first = firstName.toLowerCase().trim();
    const last = lastName.toLowerCase().trim();

    if (!first || !last) return [];

    const suggestions: string[] = [];

    // Full names with underscore
    suggestions.push(`${first}_${last}`);

    // Concatenated
    suggestions.push(`${first}${last}`);

    // First name + last initial
    suggestions.push(`${first}_${last.charAt(0)}`);
    suggestions.push(`${first}${last.charAt(0)}`);

    // First initial + last name
    suggestions.push(`${first.charAt(0)}_${last}`);
    suggestions.push(`${first.charAt(0)}${last}`);

    // Filter valid suggestions (basic validation)
    return suggestions.filter(
      (s) => s.length >= 3 && s.length <= 32 && /^\\w+$/.test(s) && !this.isReserved(s)
    );
  }

  /**
   * Gets reserved usernames list (business rule)
   *
   * @returns Array of reserved usernames
   */
  static getReservedUsernames(): readonly string[] {
    return this.RESERVED_USERNAMES;
  }
}
