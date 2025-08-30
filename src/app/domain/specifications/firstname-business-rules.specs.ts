import { FIRSTNAME_COMMON_NICKNAMES } from '../enums/firstname.enum';

/**
 * FirstName Business Rules Specifications
 *
 * @description
 * This specification contains business rules for firstname operations that are NOT
 * invariants of the FirstName value object but rather domain business policies.
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 */
export class FirstNameBusinessRules {
  /**
   * Generates phonetic code (Soundex) for firstname matching (business rule)
   *
   * @param name - The firstname to generate soundex for
   * @returns Soundex code for phonetic matching
   *
   * @example
   * ```typescript
   * const soundex1 = FirstNameBusinessRules.generateSoundex('Catherine');
   * const soundex2 = FirstNameBusinessRules.generateSoundex('Katherine');
   * console.log(soundex1 === soundex2); // true - phonetically similar
   * ```
   */
  static generateSoundex(name: string): string {
    const clean = name.toUpperCase().replace(/[^A-Z]/g, '');
    if (!clean) return '';
    let soundex = clean.charAt(0);
    const mapping: Record<string, string> = {
      BFPV: '1',
      CGJKQSXZ: '2',
      DT: '3',
      L: '4',
      MN: '5',
      R: '6',
    };
    for (let i = 1; i < clean.length; i++) {
      const char = clean.charAt(i);
      const code = Object.entries(mapping).find(([letters]) => letters.includes(char))?.[1] ?? '0';
      if (code !== '0' && code !== soundex.slice(-1)) soundex += code;
    }
    return (soundex + '0000').substring(0, 4);
  }

  /**
   * Checks if two firstnames are phonetically similar (business rule)
   *
   * @param name1 - First name
   * @param name2 - Second name
   * @returns True if names are phonetically similar
   *
   * @example
   * ```typescript
   * const similar = FirstNameBusinessRules.arePhoneticallySimilar('Catherine', 'Katherine');
   * console.log(similar); // true
   * ```
   */
  static arePhoneticallySimilar(name1: string, name2: string): boolean {
    return this.generateSoundex(name1) === this.generateSoundex(name2);
  }

  /**
   * Gets common nicknames for a given firstname (business rule)
   *
   * @param name - The firstname to get nicknames for
   * @returns Array of common nicknames
   *
   * @example
   * ```typescript
   * const nicknames = FirstNameBusinessRules.getNicknames('William');
   * console.log(nicknames); // ['Bill', 'Will', 'Billy', 'Willy']
   * ```
   */
  static getNicknames(name: string): string[] {
    return FIRSTNAME_COMMON_NICKNAMES[name.toLowerCase()] || [];
  }

  /**
   * Determines if firstname is compound (has spaces or hyphens) (business rule)
   *
   * @param name - The firstname to check
   * @returns True if firstname is compound
   *
   * @example
   * ```typescript
   * const isCompound1 = FirstNameBusinessRules.isCompound('Mary Jane');
   * console.log(isCompound1); // true
   *
   * const isCompound2 = FirstNameBusinessRules.isCompound('Anne-Marie');
   * console.log(isCompound2); // true
   * ```
   */
  static isCompound(name: string): boolean {
    return /[\s-]/.test(name);
  }

  /**
   * Gets firstname metadata for business analysis
   *
   * @param name - The firstname to analyze
   * @returns Complete firstname metadata
   */
  static getMetadata(name: string): {
    soundex: string;
    isCompound: boolean;
    hasAccents: boolean;
    hasApostrophe: boolean;
    nicknames: string[];
    initials: string;
  } {
    return {
      soundex: this.generateSoundex(name),
      isCompound: this.isCompound(name),
      hasAccents: /[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/i.test(name),
      hasApostrophe: name.includes("'"),
      nicknames: this.getNicknames(name),
      initials: name
        .split(/[\s\-']+/)
        .map((part) => part.charAt(0).toUpperCase())
        .join(''),
    };
  }
}
