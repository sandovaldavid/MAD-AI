import { AccessToken } from '../value-objects/local-tokens.vo';
import { DEFAULT_REFRESH_THRESHOLD_SECONDS } from '../enums/token-security.enum';
import { BusinessRuleError } from '../errors/business-rule-error.entity';
import { TokenMaskingService } from '../services/token/token-masking.service';

/**
 * Token Expiration Specifications
 *
 * @description
 * This specification contains expiration-specific business rules for tokens that are NOT
 * invariants of the AccessToken value object but rather domain expiration policies.
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 */
export class TokenExpirationSpec {
  /**
   * Checks if a token is expired based on current epoch time (business rule)
   *
   * @param token - The access token to check
   * @param nowEpoch - Current epoch time in seconds
   * @returns True if token is expired
   *
   * @example
   * ```typescript
   * const expiredToken = AccessToken.create('token_value', Date.now()/1000 - 100);
   * const nowEpoch = Date.now() / 1000;
   * const isExpired = TokenExpirationSpec.isExpired(expiredToken, nowEpoch); // true
   * ```
   */
  static isExpired(token: AccessToken, nowEpoch: number): boolean {
    return token.expSeconds ? token.expSeconds <= nowEpoch : false;
  }

  /**
   * Checks if a token is currently valid (business rule)
   *
   * @param token - The access token to check
   * @param nowEpoch - Current epoch time in seconds
   * @returns True if token is valid (has value and not expired)
   *
   * @example
   * ```typescript
   * const validToken = AccessToken.create('token_value', Date.now()/1000 + 3600);
   * const nowEpoch = Date.now() / 1000;
   * const isValid = TokenExpirationSpec.isValid(validToken, nowEpoch); // true
   * ```
   */
  static isValid(token: AccessToken, nowEpoch: number): boolean {
    return !!token.value && (!token.expSeconds || token.expSeconds > nowEpoch);
  }

  /**
   * Calculates time remaining until token expiration (business rule)
   *
   * @param token - The access token to check
   * @param nowEpoch - Current epoch time in seconds
   * @returns Seconds until expiration (Infinity if no expiration)
   *
   * @example
   * ```typescript
   * const token = AccessToken.create('token_value', Date.now()/1000 + 3600);
   * const nowEpoch = Date.now() / 1000;
   * const timeLeft = TokenExpirationSpec.getTimeToExpiry(token, nowEpoch); // ~3600
   * ```
   */
  static getTimeToExpiry(token: AccessToken, nowEpoch: number): number {
    if (!token.expSeconds) return Infinity;
    return Math.max(0, token.expSeconds - nowEpoch);
  }

  /**
   * Determines if a token should be refreshed based on business rules
   *
   * @param token - The access token to check
   * @param nowEpoch - Current epoch time in seconds
   * @param threshold - Threshold in seconds for refresh (defaults to 5 minutes)
   * @returns True if token should be refreshed
   *
   * @example
   * ```typescript
   * const soonToExpire = AccessToken.create('token', Date.now()/1000 + 200);
   * const nowEpoch = Date.now() / 1000;
   * const shouldRefresh = TokenExpirationSpec.shouldRefresh(soonToExpire, nowEpoch); // true
   * ```
   */
  static shouldRefresh(
    token: AccessToken,
    nowEpoch: number,
    threshold: number = DEFAULT_REFRESH_THRESHOLD_SECONDS
  ): boolean {
    if (!token.expSeconds) return false;
    return this.getTimeToExpiry(token, nowEpoch) <= threshold;
  }

  /**
   * Validates that a token is not expired (business rule)
   *
   * @param token - The access token to validate
   * @param nowEpoch - Current epoch time in seconds
   * @throws {BusinessRuleError} When token is expired
   *
   * @example
   * ```typescript
   * const expiredToken = AccessToken.create('token', Date.now()/1000 - 100);
   * TokenExpirationSpec.assertNotExpired(expiredToken, Date.now()/1000);
   * // throws BusinessRuleError
   * ```
   */
  static assertNotExpired(token: AccessToken, nowEpoch: number): void {
    if (this.isExpired(token, nowEpoch)) {
      const expiredBy = nowEpoch - (token.expSeconds || 0);
      throw BusinessRuleError.tokenExpired(
        TokenMaskingService.maskAccessToken(token),
        Math.floor(expiredBy)
      );
    }
  }

  /**
   * Validates that a token is currently valid (business rule)
   *
   * @param token - The access token to validate
   * @param nowEpoch - Current epoch time in seconds
   * @throws {BusinessRuleError} When token is invalid
   */
  static assertValid(token: AccessToken, nowEpoch: number): void {
    if (!this.isValid(token, nowEpoch)) {
      if (this.isExpired(token, nowEpoch)) {
        this.assertNotExpired(token, nowEpoch); // Will throw expired error
      } else {
        throw BusinessRuleError.tokenInvalid(TokenMaskingService.maskAccessToken(token));
      }
    }
  }

  /**
   * Gets comprehensive expiration metadata for a token
   *
   * @param token - The access token to analyze
   * @param nowEpoch - Current epoch time in seconds
   * @returns Complete expiration analysis
   *
   * @example
   * ```typescript
   * const token = AccessToken.create('token_value', Date.now()/1000 + 3600);
   * const metadata = TokenExpirationSpec.getExpirationMetadata(token, Date.now()/1000);
   * console.log(metadata.isValid); // true
   * console.log(metadata.timeToExpiry); // ~3600
   * ```
   */
  static getExpirationMetadata(
    token: AccessToken,
    nowEpoch: number
  ): {
    isValid: boolean;
    isExpired: boolean;
    hasExpiration: boolean;
    timeToExpiry: number;
    shouldRefresh: boolean;
    expiresAt?: number;
  } {
    return {
      isValid: this.isValid(token, nowEpoch),
      isExpired: this.isExpired(token, nowEpoch),
      hasExpiration: !!token.expSeconds,
      timeToExpiry: this.getTimeToExpiry(token, nowEpoch),
      shouldRefresh: this.shouldRefresh(token, nowEpoch),
      expiresAt: token.expSeconds,
    };
  }

  /**
   * Checks if a token will expire within a specific timeframe (business rule)
   *
   * @param token - The access token to check
   * @param nowEpoch - Current epoch time in seconds
   * @param withinSeconds - Timeframe to check in seconds
   * @returns True if token expires within the timeframe
   */
  static expiresWithin(token: AccessToken, nowEpoch: number, withinSeconds: number): boolean {
    const timeToExpiry = this.getTimeToExpiry(token, nowEpoch);
    return timeToExpiry !== Infinity && timeToExpiry <= withinSeconds;
  }

  /**
   * Calculates expiration urgency level (business rule)
   *
   * @param token - The access token to analyze
   * @param nowEpoch - Current epoch time in seconds
   * @returns Urgency level based on time to expiry
   */
  static getExpirationUrgency(
    token: AccessToken,
    nowEpoch: number
  ): 'EXPIRED' | 'CRITICAL' | 'WARNING' | 'OK' {
    if (this.isExpired(token, nowEpoch)) return 'EXPIRED';

    const timeToExpiry = this.getTimeToExpiry(token, nowEpoch);
    if (timeToExpiry === Infinity) return 'OK';

    if (timeToExpiry <= 60) return 'CRITICAL'; // Less than 1 minute
    if (timeToExpiry <= 300) return 'WARNING'; // Less than 5 minutes
    return 'OK';
  }
}
