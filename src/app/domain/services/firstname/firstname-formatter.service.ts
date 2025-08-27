import { FirstName } from '@domain/value-objects/firstname.vo';

/**
 * FirstName Formatting Service
 *
 * @description
 * Handles presentation-specific formatting and display of firstname value objects.
 * This service contains logic that is NOT part of the VO invariants but
 * rather presentation/formatting rules.
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 */
export class FirstNameFormatterService {
  /**
   * Gets the initials from a firstname
   *
   * @param firstname - The firstname to get initials from
   * @returns Initials string
   *
   * @example
   * ```typescript
   * const firstname = FirstName.create('Mary Jane');
   * const initials = FirstNameFormatterService.getInitials(firstname);
   * console.log(initials); // "MJ"
   * ```
   */
  static getInitials(firstname: FirstName): string {
    return firstname.value
      .split(/[\s\-']+/)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  /**
   * Shortens a firstname for display purposes
   *
   * @param firstname - The firstname to shorten
   * @param maxLength - Maximum length for shortened name
   * @returns Shortened firstname
   *
   * @example
   * ```typescript
   * const firstname = FirstName.create('Christopher');
   * const shortened = FirstNameFormatterService.getShortened(firstname, 6);
   * console.log(shortened); // "Chris"
   * ```
   */
  static getShortened(firstname: FirstName, maxLength: number = 10): string {
    if (firstname.value.length <= maxLength) return firstname.value;

    if (this.isCompound(firstname.value)) {
      const parts = firstname.value.split(/[\s\-]+/);
      if (parts.length > 1 && parts[0].length <= maxLength - 2) {
        return `${parts[0]} ${parts[1].charAt(0)}.`;
      }
    }

    return firstname.value.substring(0, maxLength - 1) + '…';
  }

  /**
   * Formats firstname for different contexts
   *
   * @param firstname - The firstname to format
   * @param context - Display context
   * @returns Context-appropriate formatted firstname
   *
   * @example
   * ```typescript
   * const firstname = FirstName.create('Mary Jane');
   * const initials = FirstNameFormatterService.formatForContext(firstname, 'initials');
   * const shortened = FirstNameFormatterService.formatForContext(firstname, 'short');
   * ```
   */
  static formatForContext(
    firstname: FirstName,
    context: 'full' | 'short' | 'initials' | 'display'
  ): string {
    switch (context) {
      case 'initials':
        return this.getInitials(firstname);
      case 'short':
        return this.getShortened(firstname, 10);
      case 'full':
      case 'display':
      default:
        return firstname.value;
    }
  }

  /**
   * Creates display name variants for UI purposes
   *
   * @param firstname - The firstname to create variants for
   * @returns Object with different display variants
   *
   * @example
   * ```typescript
   * const firstname = FirstName.create('Christopher');
   * const variants = FirstNameFormatterService.getDisplayVariants(firstname);
   * console.log(variants.short); // "Chris…"
   * console.log(variants.initials); // "C"
   * ```
   */
  static getDisplayVariants(firstname: FirstName): {
    full: string;
    short: string;
    initials: string;
    abbreviated: string;
  } {
    return {
      full: firstname.value,
      short: this.getShortened(firstname, 15),
      initials: this.getInitials(firstname),
      abbreviated: this.getShortened(firstname, 8),
    };
  }

  /**
   * Helper method to check if name is compound
   *
   * @private
   * @param name - Name to check
   * @returns True if name is compound
   */
  private static isCompound(name: string): boolean {
    return /[\s\-]/.test(name);
  }
}
