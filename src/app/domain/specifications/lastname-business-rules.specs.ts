import { SURNAME_PARTICLES } from '../enums/surname-particles.enum';

/**
 * LastName Business Rules Specifications
 *
 * @description
 * This specification contains business rules for lastname operations that are NOT
 * invariants of the LastName value object but rather domain business policies.
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 */
export class LastNameBusinessRules {
  /**
   * Extracts the main surname part, excluding particles (business rule)
   *
   * @param surname - The complete surname string
   * @returns The main surname part without particles
   *
   * @example
   * ```typescript
   * const mainPart = LastNameBusinessRules.extractMainPart('María de la Cruz');
   * console.log(mainPart); // 'Cruz'
   *
   * const simpleSurname = LastNameBusinessRules.extractMainPart('García');
   * console.log(simpleSurname); // 'García'
   * ```
   */
  static extractMainPart(surname: string): string {
    const words = surname.split(/\s+/);
    for (let i = words.length - 1; i >= 0; i--) {
      if (!SURNAME_PARTICLES.includes(words[i].toLowerCase())) {
        return words[i];
      }
    }
    return words[words.length - 1];
  }

  /**
   * Generates phonetic code (Soundex) for surname matching (business rule)
   *
   * @param surname - The surname to generate soundex for
   * @returns Soundex code for phonetic matching
   *
   * @example
   * ```typescript
   * const soundex1 = LastNameBusinessRules.generateSoundex('Smith');
   * const soundex2 = LastNameBusinessRules.generateSoundex('Smyth');
   * console.log(soundex1 === soundex2); // true - phonetically similar
   * ```
   */
  static generateSoundex(surname: string): string {
    if (!surname) return '';
    const clean = surname.toUpperCase().replace(/[^A-Z]/g, '');
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
      let code = '0';
      for (const [letters, digit] of Object.entries(mapping)) {
        if (letters.includes(char)) {
          code = digit;
          break;
        }
      }
      if (code !== '0' && code !== soundex.slice(-1)) {
        soundex += code;
      }
    }
    return (soundex + '0000').substring(0, 4);
  }

  /**
   * Creates a sort key for alphabetical ordering (business rule)
   *
   * @param surname - The surname to create sort key for
   * @returns Normalized sort key
   *
   * @example
   * ```typescript
   * const sortKey = LastNameBusinessRules.createSortKey('María de la Cruz');
   * console.log(sortKey); // 'cruz'
   * ```
   */
  static createSortKey(surname: string): string {
    const main = this.extractMainPart(surname);
    return main.toLowerCase();
  }

  /**
   * Checks if two surnames are phonetically similar (business rule)
   *
   * @param surname1 - First surname
   * @param surname2 - Second surname
   * @returns True if surnames are phonetically similar
   */
  static arePhoneticallySimilar(surname1: string, surname2: string): boolean {
    return this.generateSoundex(surname1) === this.generateSoundex(surname2);
  }

  /**
   * Determines if surname is compound (has particles or hyphens) (business rule)
   *
   * @param surname - The surname to check
   * @returns True if surname is compound
   */
  static isCompound(surname: string): boolean {
    return /[\s\-]/.test(surname) || this.hasParticle(surname);
  }

  /**
   * Checks if surname contains particles (business rule)
   *
   * @param surname - The surname to check
   * @returns True if surname contains particles
   */
  static hasParticle(surname: string): boolean {
    const words = surname.toLowerCase().split(/\s+/);
    return words.some((w) => SURNAME_PARTICLES.includes(w));
  }

  /**
   * Gets surname metadata for business analysis
   *
   * @param surname - The surname to analyze
   * @returns Complete surname metadata
   */
  static getMetadata(surname: string): {
    mainPart: string;
    soundex: string;
    sortKey: string;
    isCompound: boolean;
    hasParticle: boolean;
    hasAccents: boolean;
    hasApostrophe: boolean;
  } {
    return {
      mainPart: this.extractMainPart(surname),
      soundex: this.generateSoundex(surname),
      sortKey: this.createSortKey(surname),
      isCompound: this.isCompound(surname),
      hasParticle: this.hasParticle(surname),
      hasAccents: /[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/i.test(surname),
      hasApostrophe: surname.includes("'"),
    };
  }
}
