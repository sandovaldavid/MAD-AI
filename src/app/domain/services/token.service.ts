import { BusinessRuleError } from '../errors/business-rule-error.entity';
import { TokenFormat } from '../enums/token-format.enum';

// Import token specifications for advanced business rules
import { TokenSecuritySpec } from '../specifications/token-security.specs';
import { TokenExpirationSpec } from '../specifications/token-expiration.specs';
import { AccessToken } from '../value-objects/local-tokens.vo';
import { TokenSecurityLevel } from '../enums/token-security.enum';

/**
 * Domain Service: Token Business Rules
 *
 * Pure domain service that defines business rules for tokens.
 * No technical implementation - delegates to infrastructure.
 *
 * @architecturalNotes
 * - Domain Layer: Pure business logic only
 * - Defines token business rules and validation
 * - NO technical implementation (JWT, crypto, etc.)
 * - NO external library dependencies
 */
export class TokenService {
  /**
   * Business Rule: Validate token format according to domain specifications
   * Domain rule: All tokens must follow the established format pattern
   */
  static validateTokenFormat(token: string): TokenFormat {
    // Domain invariant: Token must exist and be non-empty
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      throw new BusinessRuleError(
        'Token cannot be empty - violates domain invariant',
        'DOMAIN_INVARIANT_VIOLATION',
        { rule: 'token_non_empty', value: token }
      );
    }

    // Business rule: Access tokens must start with 'access_'
    if (token.startsWith('access_')) {
      return TokenFormat.JWT;
    }

    // Business rule: Refresh tokens must start with 'refresh_'
    if (token.startsWith('refresh_')) {
      return TokenFormat.JWT;
    }

    // Domain rule violation: Unknown token format
    throw new BusinessRuleError(
      'Token format violates domain specifications',
      'DOMAIN_RULE_VIOLATION',
      {
        rule: 'valid_token_format',
        formats: ['access_*', 'refresh_*'],
        provided: token.substring(0, 20) + '...',
      }
    );
  }

  /**
   * Business Rule: Validate token expiration policy
   * Domain rule: Tokens have maximum lifetimes based on type
   */
  static validateTokenExpiration(tokenType: 'access' | 'refresh', issuedAt: Date): boolean {
    const now = new Date();
    const ageInHours = (now.getTime() - issuedAt.getTime()) / (1000 * 60 * 60);

    // Business rule: Access tokens expire after 1 hour
    if (tokenType === 'access' && ageInHours > 1) {
      return false;
    }

    // Business rule: Refresh tokens expire after 24 hours
    if (tokenType === 'refresh' && ageInHours > 24) {
      return false;
    }

    return true;
  }

  /**
   * Business Rule: Determine if token needs refresh
   * Domain rule: Access tokens should be refreshed before expiration
   */
  static shouldRefreshToken(tokenType: 'access' | 'refresh', issuedAt: Date): boolean {
    const now = new Date();
    const ageInMinutes = (now.getTime() - issuedAt.getTime()) / (1000 * 60);

    // Business rule: Refresh access tokens after 45 minutes (15 min buffer)
    if (tokenType === 'access' && ageInMinutes > 45) {
      return true;
    }

    // Business rule: Refresh tokens don't auto-refresh (manual only)
    return false;
  }

  /**
   * Business Rule: Validate token security requirements
   * Domain rule: Tokens must meet minimum security standards
   */
  static validateTokenSecurity(token: string): void {
    // Domain rule: Minimum length for security
    if (token.length < 20) {
      throw new BusinessRuleError(
        'Token violates minimum security length requirement',
        'DOMAIN_SECURITY_VIOLATION',
        { rule: 'minimum_length', required: 20, actual: token.length }
      );
    }

    // Domain rule: Must contain timestamp for expiration tracking
    if (!token.includes('_')) {
      throw new BusinessRuleError(
        'Token format violates security requirements',
        'DOMAIN_SECURITY_VIOLATION',
        { rule: 'timestamp_required', token: token.substring(0, 10) + '...' }
      );
    }
  }

  /**
   * Business Rule: Advanced token security validation using specifications
   * Uses TokenSecuritySpec for complex security analysis
   */
  static validateAdvancedTokenSecurity(token: string): void {
    try {
      // Create AccessToken from string for specification validation
      const accessToken = AccessToken.create(token, Math.floor(Date.now() / 1000) + 3600);

      // Use TokenSecuritySpec for advanced security validation
      TokenSecuritySpec.assertMinimumSecurity(accessToken, TokenSecurityLevel.MEDIUM);
    } catch (error) {
      throw new BusinessRuleError(
        'Token fails advanced security validation',
        'DOMAIN_SECURITY_VIOLATION',
        {
          rule: 'advanced_security_check',
          error: error instanceof Error ? error.message : 'Unknown security error',
        }
      );
    }
  }

  /**
   * Business Rule: Advanced token expiration validation using specifications
   * Uses TokenExpirationSpec for complex expiration rules
   */
  static validateAdvancedTokenExpiration(token: string, issuedAt: Date): void {
    try {
      // Create AccessToken from string for specification validation
      const accessToken = AccessToken.create(token, Math.floor(Date.now() / 1000) + 3600); // 1 hour expiry
      const nowEpoch = Math.floor(Date.now() / 1000);

      // Use TokenExpirationSpec for expiration validation
      const isExpired = TokenExpirationSpec.isExpired(accessToken, nowEpoch);

      if (isExpired) {
        throw new BusinessRuleError(
          'Token has expired according to business rules',
          'DOMAIN_EXPIRATION_VIOLATION',
          { rule: 'token_expired', issuedAt }
        );
      }
    } catch (error) {
      if (error instanceof BusinessRuleError) {
        throw error;
      }

      throw new BusinessRuleError(
        'Token expiration validation failed',
        'DOMAIN_EXPIRATION_VIOLATION',
        {
          rule: 'expiration_check_failed',
          error: error instanceof Error ? error.message : 'Unknown expiration error',
        }
      );
    }
  }

  /**
   * Business Rule: Comprehensive token validation using all specifications
   * Combines security, expiration, and format validations
   */
  static validateTokenComprehensive(token: string, issuedAt: Date): void {
    // 1. Basic format validation
    this.validateTokenFormat(token);

    // 2. Basic security validation
    this.validateTokenSecurity(token);

    // 3. Advanced security validation using specifications
    this.validateAdvancedTokenSecurity(token);

    // 4. Advanced expiration validation using specifications
    this.validateAdvancedTokenExpiration(token, issuedAt);
  }
}
