import { AccessToken, RefreshToken } from '@domain/value-objects/local-tokens.vo';
import { TOKEN_MASKING_CONFIG } from '@domain/enums/token-security.enum';

/**
 * Token Masking Service
 *
 * @description
 * Handles presentation-specific masking and display of token value objects.
 * This service contains logic that is NOT part of the VO invariants but
 * rather presentation/security formatting rules.
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 */
export class TokenMaskingService {
  /**
   * Masks an access token for safe display
   *
   * @param token - The access token to mask
   * @param prefix - Number of characters to show at start (default: 4)
   * @param suffix - Number of characters to show at end (default: 4)
   * @returns Masked token string for display
   *
   * @example
   * ```typescript
   * const token = AccessToken.create('very_long_secret_token_value');
   * const masked = TokenMaskingService.maskAccessToken(token);
   * console.log(masked); // "very****value"
   *
   * const customMasked = TokenMaskingService.maskAccessToken(token, 6, 2);
   * console.log(customMasked); // "very_l****ue"
   * ```
   */
  static maskAccessToken(
    token: AccessToken,
    prefix: number = TOKEN_MASKING_CONFIG.DEFAULT_PREFIX,
    suffix: number = TOKEN_MASKING_CONFIG.DEFAULT_SUFFIX
  ): string {
    return this.maskString(token.value, prefix, suffix);
  }

  /**
   * Masks a refresh token for safe display
   *
   * @param token - The refresh token to mask
   * @param prefix - Number of characters to show at start (default: 4)
   * @param suffix - Number of characters to show at end (default: 4)
   * @returns Masked token string for display
   *
   * @example
   * ```typescript
   * const refreshToken = RefreshToken.create('refresh_token_secret_value');
   * const masked = TokenMaskingService.maskRefreshToken(refreshToken);
   * console.log(masked); // "refr****alue"
   * ```
   */
  static maskRefreshToken(
    token: RefreshToken,
    prefix: number = TOKEN_MASKING_CONFIG.DEFAULT_PREFIX,
    suffix: number = TOKEN_MASKING_CONFIG.DEFAULT_SUFFIX
  ): string {
    return this.maskString(token.getValue(), prefix, suffix);
  }

  /**
   * Generic string masking utility
   *
   * @param value - The string to mask
   * @param prefix - Number of characters to show at start
   * @param suffix - Number of characters to show at end
   * @returns Masked string
   *
   * @example
   * ```typescript
   * const masked = TokenMaskingService.maskString('sensitive_data', 4, 2);
   * console.log(masked); // "sens****ta"
   * ```
   */
  static maskString(value: string, prefix: number, suffix: number): string {
    if (!value) return '****';

    // If token is too short to mask meaningfully, return a fixed mask
    if (value.length <= prefix + suffix) {
      const maskLength = Math.max(TOKEN_MASKING_CONFIG.FALLBACK_MASK_LENGTH, value.length);
      return '*'.repeat(maskLength);
    }

    const pre = value.slice(0, prefix);
    const suf = value.slice(-suffix);
    const middleLength = Math.max(
      TOKEN_MASKING_CONFIG.MIN_MASK_LENGTH,
      value.length - prefix - suffix
    );

    return `${pre}${'*'.repeat(middleLength)}${suf}`;
  }

  /**
   * Creates a masked version optimized for logging
   *
   * @param token - The access token to mask for logs
   * @returns Heavily masked token suitable for logs
   *
   * @example
   * ```typescript
   * const token = AccessToken.create('secret_token_value');
   * const logSafe = TokenMaskingService.maskForLogging(token);
   * console.log(logSafe); // "sec*************lue"
   * ```
   */
  static maskForLogging(token: AccessToken): string {
    // More conservative masking for logging
    return this.maskString(token.value, 3, 3);
  }

  /**
   * Creates a masked version optimized for audit trails
   *
   * @param token - The access token to mask for audit
   * @returns Masked token suitable for audit logs
   *
   * @example
   * ```typescript
   * const token = AccessToken.create('audit_token_value');
   * const auditSafe = TokenMaskingService.maskForAudit(token);
   * console.log(auditSafe); // "au***********lue"
   * ```
   */
  static maskForAudit(token: AccessToken): string {
    // Minimal exposure for audit purposes
    return this.maskString(token.value, 2, 3);
  }

  /**
   * Creates a masked version optimized for user display
   *
   * @param token - The access token to mask for user UI
   * @returns Masked token suitable for user interface
   *
   * @example
   * ```typescript
   * const token = AccessToken.create('user_display_token');
   * const userSafe = TokenMaskingService.maskForUserDisplay(token);
   * console.log(userSafe); // "user****oken"
   * ```
   */
  static maskForUserDisplay(token: AccessToken): string {
    // More readable for users
    return this.maskString(token.value, 4, 4);
  }

  /**
   * Creates a masked version based on context
   *
   * @param token - The access token to mask
   * @param context - Display context for appropriate masking
   * @returns Context-appropriate masked token
   *
   * @example
   * ```typescript
   * const token = AccessToken.create('context_token_example');
   * const logMask = TokenMaskingService.maskForContext(token, 'logging');
   * const userMask = TokenMaskingService.maskForContext(token, 'user-display');
   * ```
   */
  static maskForContext(
    token: AccessToken,
    context: 'logging' | 'audit' | 'user-display' | 'debug'
  ): string {
    switch (context) {
      case 'logging':
        return this.maskForLogging(token);
      case 'audit':
        return this.maskForAudit(token);
      case 'user-display':
        return this.maskForUserDisplay(token);
      case 'debug':
        // More visible for debugging (be careful in production)
        return this.maskString(token.value, 8, 6);
      default:
        return this.maskAccessToken(token);
    }
  }

  /**
   * Checks if a string appears to be a masked token
   *
   * @param value - String to check
   * @returns True if string appears to be masked
   *
   * @example
   * ```typescript
   * TokenMaskingService.isMaskedToken('abc****xyz'); // true
   * TokenMaskingService.isMaskedToken('plaintext'); // false
   * ```
   */
  static isMaskedToken(value: string): boolean {
    return /\*{3,}/.test(value);
  }

  /**
   * Gets masking statistics for analysis
   *
   * @param originalLength - Original token length
   * @param prefix - Prefix length shown
   * @param suffix - Suffix length shown
   * @returns Masking statistics
   */
  static getMaskingStats(
    originalLength: number,
    prefix: number,
    suffix: number
  ): {
    originalLength: number;
    visibleChars: number;
    maskedChars: number;
    maskingRatio: number;
  } {
    const visibleChars = Math.min(prefix + suffix, originalLength);
    const maskedChars = Math.max(0, originalLength - visibleChars);
    const maskingRatio = originalLength > 0 ? maskedChars / originalLength : 0;

    return {
      originalLength,
      visibleChars,
      maskedChars,
      maskingRatio,
    };
  }
}
