/**
 * Token Security Constants and Configuration for MAD-AI System
 *
 * @description
 * This enum centralizes all token security-related constants and business rules
 * that were previously hardcoded in the AccessToken Value Object. Following DDD
 * principles, business rules and constants are separated from value object invariants.
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 */

/**
 * Token security levels based on entropy and complexity analysis
 */
export enum TokenSecurityLevel {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

/**
 * Token type classifications based on format patterns
 */
export enum TokenType {
  JWT = 'JWT',
  OPAQUE = 'OPAQUE',
  API_KEY = 'API_KEY',
  RANDOM = 'RANDOM',
}

/**
 * Entropy thresholds for security scoring (business rule)
 */
export const TOKEN_ENTROPY_THRESHOLDS = {
  HIGH: 4.0,
  MEDIUM: 2.5,
  LOW: 1.5,
} as const;

/**
 * Length scoring thresholds (business rule)
 */
export const TOKEN_LENGTH_SCORING = {
  EXCELLENT_THRESHOLD: 64,
  GOOD_THRESHOLD: 32,
  EXCELLENT_SCORE: 2,
  GOOD_SCORE: 1,
} as const;

/**
 * Security scoring configuration (business rule)
 */
export const TOKEN_SECURITY_SCORING = {
  ENTROPY: {
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  },
  LENGTH: TOKEN_LENGTH_SCORING,
  CHAR_DIVERSITY: {
    SPECIAL_CHARS: 1,
    NUMBERS: 1,
    MIXED_CASE: 1,
  },
  THRESHOLDS: {
    HIGH_SCORE: 6,
    MEDIUM_SCORE: 4,
  },
} as const;

/**
 * Default token refresh threshold (business rule)
 */
export const DEFAULT_REFRESH_THRESHOLD_SECONDS = 300; // 5 minutes

/**
 * Token masking configuration for presentation
 */
export const TOKEN_MASKING_CONFIG = {
  DEFAULT_PREFIX: 4,
  DEFAULT_SUFFIX: 4,
  MIN_MASK_LENGTH: 4,
  FALLBACK_MASK_LENGTH: 8,
} as const;

/**
 * Token format detection patterns (business rule)
 */
export const TOKEN_FORMAT_PATTERNS = {
  JWT: /^[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+$/,
  API_KEY: /^prefix_[A-Za-z0-9]+$/,
  OPAQUE: /^[A-Za-z0-9+/=]+$/,
  SPECIAL_CHARS: /[_\-.]/,
  NUMBERS: /\d/,
  LOWERCASE: /[a-z]/,
  UPPERCASE: /[A-Z]/,
} as const;

/**
 * Token validation messages
 */
export const TOKEN_VALIDATION_MESSAGES = {
  ACCESS_TOKEN_REQUIRED: 'Access token is required',
  ACCESS_TOKEN_TOO_SHORT: 'Access token is too short',
  ACCESS_TOKEN_TOO_LONG: 'Access token is too long',
  REFRESH_TOKEN_REQUIRED: 'Refresh token is required',
  REFRESH_TOKEN_TOO_SHORT: 'Refresh token must be at least 20 characters',
  REFRESH_TOKEN_INVALID: 'Invalid refresh token format',
} as const;

/**
 * Utility functions for token operations
 */
export const TokenSecurityUtils = {
  /**
   * Calculates Shannon entropy for a token string
   */
  calculateEntropy(token: string): number {
    if (!token) return 0;

    const charCounts = new Map<string, number>();
    for (const char of token) {
      charCounts.set(char, (charCounts.get(char) || 0) + 1);
    }

    let entropy = 0;
    const length = token.length;

    for (const count of charCounts.values()) {
      const probability = count / length;
      entropy -= probability * Math.log2(probability);
    }

    return entropy;
  },

  /**
   * Detects token type based on format patterns
   */
  detectTokenType(token: string): TokenType {
    if (TOKEN_FORMAT_PATTERNS.JWT.test(token)) return TokenType.JWT;
    if (TOKEN_FORMAT_PATTERNS.API_KEY.test(token)) return TokenType.API_KEY;
    if (TOKEN_FORMAT_PATTERNS.OPAQUE.test(token) && token.length > 20) return TokenType.OPAQUE;
    return TokenType.RANDOM;
  },

  /**
   * Analyzes character diversity in token
   */
  analyzeCharacterDiversity(token: string): {
    hasSpecial: boolean;
    hasNumbers: boolean;
    hasLowercase: boolean;
    hasUppercase: boolean;
    hasMixedCase: boolean;
  } {
    return {
      hasSpecial: TOKEN_FORMAT_PATTERNS.SPECIAL_CHARS.test(token),
      hasNumbers: TOKEN_FORMAT_PATTERNS.NUMBERS.test(token),
      hasLowercase: TOKEN_FORMAT_PATTERNS.LOWERCASE.test(token),
      hasUppercase: TOKEN_FORMAT_PATTERNS.UPPERCASE.test(token),
      hasMixedCase:
        TOKEN_FORMAT_PATTERNS.LOWERCASE.test(token) && TOKEN_FORMAT_PATTERNS.UPPERCASE.test(token),
    };
  },

  /**
   * Calculates security score based on token properties
   */
  calculateSecurityScore(token: string): number {
    const entropy = this.calculateEntropy(token);
    const length = token.length;
    const diversity = this.analyzeCharacterDiversity(token);

    let score = 0;

    // Entropy scoring
    if (entropy >= TOKEN_ENTROPY_THRESHOLDS.HIGH) {
      score += TOKEN_SECURITY_SCORING.ENTROPY.HIGH;
    } else if (entropy >= TOKEN_ENTROPY_THRESHOLDS.MEDIUM) {
      score += TOKEN_SECURITY_SCORING.ENTROPY.MEDIUM;
    } else if (entropy >= TOKEN_ENTROPY_THRESHOLDS.LOW) {
      score += TOKEN_SECURITY_SCORING.ENTROPY.LOW;
    }

    // Length scoring
    if (length >= TOKEN_LENGTH_SCORING.EXCELLENT_THRESHOLD) {
      score += TOKEN_LENGTH_SCORING.EXCELLENT_SCORE;
    } else if (length >= TOKEN_LENGTH_SCORING.GOOD_THRESHOLD) {
      score += TOKEN_LENGTH_SCORING.GOOD_SCORE;
    }

    // Character diversity scoring
    if (diversity.hasSpecial) score += TOKEN_SECURITY_SCORING.CHAR_DIVERSITY.SPECIAL_CHARS;
    if (diversity.hasNumbers) score += TOKEN_SECURITY_SCORING.CHAR_DIVERSITY.NUMBERS;
    if (diversity.hasMixedCase) score += TOKEN_SECURITY_SCORING.CHAR_DIVERSITY.MIXED_CASE;

    return score;
  },

  /**
   * Determines security level based on calculated score
   */
  getSecurityLevel(score: number): TokenSecurityLevel {
    if (score >= TOKEN_SECURITY_SCORING.THRESHOLDS.HIGH_SCORE) return TokenSecurityLevel.HIGH;
    if (score >= TOKEN_SECURITY_SCORING.THRESHOLDS.MEDIUM_SCORE) return TokenSecurityLevel.MEDIUM;
    return TokenSecurityLevel.LOW;
  },
};
