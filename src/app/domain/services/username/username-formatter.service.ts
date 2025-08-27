import { Username } from '@domain/value-objects/username.vo';

/**
 * Username Formatting Service
 *
 * @description
 * Handles presentation-specific formatting and display of username value objects.
 * This service contains logic that is NOT part of the VO invariants but
 * rather presentation/formatting rules.
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 */
export class UsernameFormatterService {
  /**
   * Creates a display version of the username for UI purposes
   *
   * @param username - The username to format for display
   * @returns Formatted display name
   *
   * @example
   * ```typescript
   * const username = Username.create('john_doe');
   * const displayName = UsernameFormatterService.toDisplayName(username);
   * console.log(displayName); // "John Doe"
   * ```
   */
  static toDisplayName(username: Username): string {
    return username.value
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Formats username for different display contexts
   *
   * @param username - The username to format
   * @param context - Display context
   * @returns Context-appropriate formatted username
   *
   * @example
   * ```typescript
   * const username = Username.create('john_doe');
   * const display = UsernameFormatterService.formatForContext(username, 'display');
   * const raw = UsernameFormatterService.formatForContext(username, 'raw');
   * ```
   */
  static formatForContext(username: Username, context: 'raw' | 'display' | 'mention'): string {
    switch (context) {
      case 'display':
        return this.toDisplayName(username);
      case 'mention':
        return `@${username.value}`;
      case 'raw':
      default:
        return username.value;
    }
  }

  /**
   * Creates display variants for UI purposes
   *
   * @param username - The username to create variants for
   * @returns Object with different display variants
   *
   * @example
   * ```typescript
   * const username = Username.create('john_doe');
   * const variants = UsernameFormatterService.getDisplayVariants(username);
   * console.log(variants.display); // "John Doe"
   * console.log(variants.mention); // "@john_doe"
   * ```
   */
  static getDisplayVariants(username: Username): {
    raw: string;
    display: string;
    mention: string;
    abbreviated: string;
  } {
    return {
      raw: username.value,
      display: this.toDisplayName(username),
      mention: `@${username.value}`,
      abbreviated:
        username.value.length > 15 ? `${username.value.substring(0, 12)}...` : username.value,
    };
  }

  /**
   * Formats username for search/matching purposes
   *
   * @param username - The username to format
   * @returns Search-optimized format
   */
  static formatForSearch(username: Username): string {
    return username.value.toLowerCase();
  }

  /**
   * Creates a user-friendly representation
   *
   * @param username - The username to format
   * @param includeAt - Whether to include @ symbol
   * @returns User-friendly format
   */
  static toUserFriendly(username: Username, includeAt: boolean = false): string {
    const formatted = this.toDisplayName(username);
    return includeAt ? `@${formatted}` : formatted;
  }
}
