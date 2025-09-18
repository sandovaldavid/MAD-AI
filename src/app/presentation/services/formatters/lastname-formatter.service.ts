import { inject, Injectable } from '@angular/core';
import { UserUtilsFacade } from '@application/facades/users/user-utils.facade';

/**
 * LastName Formatting Service
 *
 * @description
 * Handles presentation-specific formatting and display of lastname value objects.
 * This service delegates to Application layer for formatting logic to maintain
 * Clean Architecture separation.
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 */
@Injectable({ providedIn: 'root' })
export class LastNameFormatterService {
  private readonly userUtilsFacade = inject(UserUtilsFacade);

  /**
   * Abbreviates a lastname for display purposes
   *
   * @param lastname - The lastname to abbreviate
   * @param maxLength - Maximum length for abbreviation
   * @returns Abbreviated lastname
   */
  abbreviate(lastname: any, maxLength: number): string {
    return this.userUtilsFacade.abbreviateLastName(lastname, maxLength);
  }

  /**
   * Formats lastname in formal/uppercase style
   *
   * @param lastname - The lastname to format
   * @returns Formal formatted lastname
   */
  getFormalFormat(lastname: any): string {
    return this.userUtilsFacade.formatLastNameForFormal(lastname);
  }

  /**
   * Gets the first initial of the main surname part
   *
   * @param lastname - The lastname to get initial from
   * @returns Initial letter in uppercase
   */
  getInitial(lastname: any): string {
    return this.userUtilsFacade.formatLastNameForInitial(lastname);
  }

  /**
   * Formats lastname for different contexts
   *
   * @param lastname - The lastname to format
   * @param context - Display context
   * @returns Context-appropriate formatted lastname
   */
  formatForContext(
    lastname: any,
    context: 'formal' | 'abbreviated' | 'initial' | 'display'
  ): string {
    return this.userUtilsFacade.formatLastNameForContext(lastname, context);
  }

  /**
   * Creates display name variants for UI purposes
   *
   * @param lastname - The lastname to create variants for
   * @returns Object with different display variants
   */
  getDisplayVariants(lastname: any): {
    full: string;
    short: string;
    abbreviated: string;
    initial: string;
    formal: string;
  } {
    return {
      full: this.userUtilsFacade.formatLastNameForDisplay(lastname),
      short: this.userUtilsFacade.abbreviateLastName(lastname, 15),
      abbreviated: this.userUtilsFacade.abbreviateLastName(lastname, 10),
      initial: this.userUtilsFacade.formatLastNameForInitial(lastname),
      formal: this.userUtilsFacade.formatLastNameForFormal(lastname),
    };
  }

  /**
   * Formats lastname with proper capitalization rules
   *
   * @param value - Raw lastname string
   * @returns Properly formatted lastname
   */
  formatCapitalization(value: string): string {
    if (!value || typeof value !== 'string') return '';

    return value
      .trim()
      .split(/\s+/)
      .map((word) => {
        const lw = word.toLowerCase();

        // Keep particles lowercase unless at start
        if (['de', 'la', 'del', 'los', 'las', 'y', 'e'].includes(lw)) {
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
