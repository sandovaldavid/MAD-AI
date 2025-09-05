import { LastName } from '@domain/value-objects/lastname.vo';
import { SURNAME_PARTICLES } from '@domain/enums/surname-particles.enum';

/**
 * LastName Formatting Service
 *
 * @description
 * Handles presentation-specific formatting and display of lastname value objects.
 * This service contains logic that is NOT part of the VO invariants but
 * rather presentation/formatting rules.
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 */
export class LastNameFormatterService {
  /**
   * Abbreviates a lastname for display purposes
   *
   * @param lastname - The lastname to abbreviate
   * @param maxLength - Maximum length for abbreviation
   * @returns Abbreviated lastname
   *
   * @example
   * ```typescript
   * const lastname = LastName.create('García-Rodríguez');
   * const abbreviated = LastNameFormatterService.abbreviate(lastname, 10);
   * console.log(abbreviated); // "garcía-rod…"
   * ```
   */
  static abbreviate(lastname: LastName, maxLength: number): string {
    if (lastname.value.length <= maxLength) return lastname.value;

    const words = lastname.value.split(/\s+/);
    const result: string[] = [];
    let length = 0;

    for (const word of words) {
      const lw = word.toLowerCase();
      if (length + lw.length + 1 > maxLength) break;
      result.push(lw);
      length += lw.length + 1;
    }

    return result.join(' ') + (length < lastname.value.length ? '…' : '');
  }

  /**
   * Formats lastname in formal/uppercase style
   *
   * @param lastname - The lastname to format
   * @returns Formal formatted lastname
   *
   * @example
   * ```typescript
   * const lastname = LastName.create('García');
   * const formal = LastNameFormatterService.getFormalFormat(lastname);
   * console.log(formal); // "GARCÍA"
   * ```
   */
  static getFormalFormat(lastname: LastName): string {
    return lastname.value.toUpperCase();
  }

  /**
   * Gets the first initial of the main surname part
   *
   * @param lastname - The lastname to get initial from
   * @returns Initial letter in uppercase
   *
   * @example
   * ```typescript
   * const lastname = LastName.create('María de la Cruz');
   * const initial = LastNameFormatterService.getInitial(lastname);
   * console.log(initial); // "C"
   * ```
   */
  static getInitial(lastname: LastName): string {
    const words = lastname.value.split(/\s+/);
    for (let i = words.length - 1; i >= 0; i--) {
      if (!SURNAME_PARTICLES.includes(words[i].toLowerCase())) {
        return words[i].charAt(0).toUpperCase();
      }
    }
    return words[words.length - 1].charAt(0).toUpperCase();
  }

  /**
   * Formats lastname for different contexts
   *
   * @param lastname - The lastname to format
   * @param context - Display context
   * @returns Context-appropriate formatted lastname
   *
   * @example
   * ```typescript
   * const lastname = LastName.create('García-Rodríguez');
   * const formal = LastNameFormatterService.formatForContext(lastname, 'formal');
   * const abbreviated = LastNameFormatterService.formatForContext(lastname, 'abbreviated');
   * ```
   */
  static formatForContext(
    lastname: LastName,
    context: 'formal' | 'abbreviated' | 'initial' | 'display'
  ): string {
    switch (context) {
      case 'formal':
        return this.getFormalFormat(lastname);
      case 'abbreviated':
        return this.abbreviate(lastname, 10);
      case 'initial':
        return this.getInitial(lastname);
      case 'display':
      default:
        return lastname.value;
    }
  }

  /**
   * Creates display name variants for UI purposes
   *
   * @param lastname - The lastname to create variants for
   * @returns Object with different display variants
   *
   * @example
   * ```typescript
   * const lastname = LastName.create('García-Rodríguez');
   * const variants = LastNameFormatterService.getDisplayVariants(lastname);
   * console.log(variants.short); // "García-Rod…"
   * console.log(variants.initial); // "G"
   * ```
   */
  static getDisplayVariants(lastname: LastName): {
    full: string;
    short: string;
    abbreviated: string;
    initial: string;
    formal: string;
  } {
    return {
      full: lastname.value,
      short: this.abbreviate(lastname, 15),
      abbreviated: this.abbreviate(lastname, 10),
      initial: this.getInitial(lastname),
      formal: this.getFormalFormat(lastname),
    };
  }

  /**
   * Formats lastname with proper capitalization rules
   *
   * @param value - Raw lastname string
   * @returns Properly formatted lastname
   *
   * @example
   * ```typescript
   * const formatted = LastNameFormatterService.formatCapitalization('MARÍA DE LA CRUZ');
   * console.log(formatted); // "María de la Cruz"
   * ```
   */
  static formatCapitalization(value: string): string {
    if (!value || typeof value !== 'string') return '';

    return value
      .trim()
      .split(/\s+/)
      .map((word) => {
        const lw = word.toLowerCase();

        // Keep particles lowercase unless at start
        if (SURNAME_PARTICLES.includes(lw)) {
          return lw;
        }

        // Handle hyphenated surnames
        if (word.includes('-')) {
          return word
            .split('-')
            .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
            .join('-');
        }

        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }
}
