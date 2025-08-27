import { AccessToken } from '../value-objects/local-tokens.vo';
import { TokenSecurityLevel, TokenType, TokenSecurityUtils } from '../enums/token-security.enum';
import { BusinessRuleError } from '../errors/business-rule-error.entity';
import { TokenMaskingService } from '../services/token/token-masking.service';

/**
 * Token Security Specifications
 *
 * @description
 * This specification contains security-specific rules for tokens that are NOT
 * invariants of the AccessToken value object but rather domain security policies.
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 */
export class TokenSecuritySpec {
  /**
   * Analyzes the security level of an access token
   */
  static getSecurityLevel(token: AccessToken): TokenSecurityLevel {
    const score = TokenSecurityUtils.calculateSecurityScore(token.value);
    return TokenSecurityUtils.getSecurityLevel(score);
  }

  /**
   * Detects the type/format of an access token
   */
  static detectTokenType(token: AccessToken): TokenType {
    return TokenSecurityUtils.detectTokenType(token.value);
  }

  /**
   * Validates that a token meets minimum security requirements (business rule)
   */
  static assertMinimumSecurity(
    token: AccessToken,
    minSecurityLevel: TokenSecurityLevel = TokenSecurityLevel.MEDIUM
  ): void {
    const actualLevel = this.getSecurityLevel(token);

    const levelHierarchy = {
      [TokenSecurityLevel.LOW]: 1,
      [TokenSecurityLevel.MEDIUM]: 2,
      [TokenSecurityLevel.HIGH]: 3,
    };

    if (levelHierarchy[actualLevel] < levelHierarchy[minSecurityLevel]) {
      throw BusinessRuleError.tokenSecurityInsufficient(
        actualLevel,
        minSecurityLevel,
        TokenMaskingService.maskAccessToken(token)
      );
    }
  }

  /**
   * Gets comprehensive security metadata for a token
   */
  static getSecurityMetadata(token: AccessToken): {
    securityLevel: TokenSecurityLevel;
    tokenType: TokenType;
    entropy: number;
    securityScore: number;
    length: number;
    characterDiversity: ReturnType<typeof TokenSecurityUtils.analyzeCharacterDiversity>;
  } {
    const entropy = TokenSecurityUtils.calculateEntropy(token.value);
    const securityScore = TokenSecurityUtils.calculateSecurityScore(token.value);
    const characterDiversity = TokenSecurityUtils.analyzeCharacterDiversity(token.value);

    return {
      securityLevel: this.getSecurityLevel(token),
      tokenType: this.detectTokenType(token),
      entropy,
      securityScore,
      length: token.value.length,
      characterDiversity,
    };
  }
}
