import { inject, Injectable } from '@angular/core';
import { UserUtilsFacade } from '@application/facades/users/user-utils.facade';

/**
 * Username Formatting Service
 *
 * @description
 * Handles presentation-specific formatting and display of username value objects.
 * This service delegates to Application layer for formatting logic to maintain
 * Clean Architecture separation.
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 */
@Injectable({ providedIn: 'root' })
export class UsernameFormatterService {
  private readonly userUtilsFacade = inject(UserUtilsFacade);

  /**
   * Creates a display version of the username for UI purposes
   *
   * @param username - The username to format for display
   * @returns Formatted display name
   */
  toDisplayName(username: any): string {
    return this.userUtilsFacade.formatUsernameForDisplay(username);
  }

  /**
   * Formats username for different display contexts
   *
   * @param username - The username to format
   * @param context - Display context
   * @returns Context-appropriate formatted username
   */
  formatForContext(username: any, context: 'raw' | 'display' | 'mention'): string {
    return this.userUtilsFacade.formatUsernameForContext(username, context);
  }

  /**
   * Creates display variants for UI purposes
   *
   * @param username - The username to create variants for
   * @returns Object with different display variants
   */
  getDisplayVariants(username: any): {
    raw: string;
    display: string;
    mention: string;
    abbreviated: string;
  } {
    const raw = username.value;
    const display = this.toDisplayName(username);
    const mention = `@${raw}`;
    const abbreviated = raw.length > 15 ? `${raw.substring(0, 12)}...` : raw;

    return {
      raw,
      display,
      mention,
      abbreviated,
    };
  }

  /**
   * Formats username for search/matching purposes
   *
   * @param username - The username to format
   * @returns Search-optimized format
   */
  formatForSearch(username: any): string {
    return username.value.toLowerCase();
  }

  /**
   * Creates a user-friendly representation
   *
   * @param username - The username to format
   * @param includeAt - Whether to include @ symbol
   * @returns User-friendly format
   */
  toUserFriendly(username: any, includeAt = false): string {
    const formatted = this.toDisplayName(username);
    return includeAt ? `@${formatted}` : formatted;
  }
}
