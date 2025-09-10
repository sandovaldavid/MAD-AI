import { AccessToken } from '../value-objects/local-tokens.vo';
import { TokenSecurityLevel, TokenType } from '../enums/token-security.enum';
import { TokenSecuritySpec } from './token-security.specs';

/**
 * Token Security Specifications Tests
 *
 * @description
 * Domain Layer tests for token security specifications.
 * Tests business rules, security validations, and metadata analysis
 * without external dependencies or mocks.
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 */
describe('TokenSecuritySpec - Domain Tests', () => {
  // Test data constants
  const WEAK_TOKEN = 'weaktoken123456789';
  const MEDIUM_TOKEN = 'MediumToken123456789';
  const STRONG_TOKEN = 'Str0ng_T0k3n_W1th_Sp3c14l_Ch4r5_ABC123';
  const JWT_TOKEN =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  const API_KEY_TOKEN = 'prefix_1234567890abcdefghijklmnopqrstuvwxyz';
  const OPAQUE_TOKEN = 'AbC123XyZ789OpQ456RsT';
  const SINGLE_CHAR_TOKEN = 'abcdefghij123456';
  const NUMERIC_TOKEN = '1234567890123456';
  const SPECIAL_CHARS_TOKEN = 'abc_def-ghi.jkl123';

  // Valid expiration time (year 2030 in seconds)
  const VALID_EXPIRATION = 1893456000;

  describe('Security Level Analysis', () => {
    describe('getSecurityLevel', () => {
      it('should return LOW security level for weak tokens', () => {
        // Given
        const token = AccessToken.create(WEAK_TOKEN, VALID_EXPIRATION);

        // When
        const securityLevel = TokenSecuritySpec.getSecurityLevel(token);

        // Then
        expect(securityLevel).toBe(TokenSecurityLevel.LOW);
      });

      it('should return MEDIUM security level for medium strength tokens', () => {
        // Given
        const token = AccessToken.create(MEDIUM_TOKEN, VALID_EXPIRATION);

        // When
        const securityLevel = TokenSecuritySpec.getSecurityLevel(token);

        // Then
        expect(securityLevel).toBe(TokenSecurityLevel.MEDIUM);
      });

      it('should return HIGH security level for strong tokens', () => {
        // Given
        const token = AccessToken.create(STRONG_TOKEN, VALID_EXPIRATION);

        // When
        const securityLevel = TokenSecuritySpec.getSecurityLevel(token);

        // Then
        expect(securityLevel).toBe(TokenSecurityLevel.HIGH);
      });

      it('should handle single character token', () => {
        // Given
        const token = AccessToken.create(SINGLE_CHAR_TOKEN, VALID_EXPIRATION);

        // When
        const securityLevel = TokenSecuritySpec.getSecurityLevel(token);

        // Then
        expect(securityLevel).toBe(TokenSecurityLevel.MEDIUM);
      });

      it('should handle numeric only tokens', () => {
        // Given
        const token = AccessToken.create(NUMERIC_TOKEN, VALID_EXPIRATION);

        // When
        const securityLevel = TokenSecuritySpec.getSecurityLevel(token);

        // Then
        expect(securityLevel).toBe(TokenSecurityLevel.LOW);
      });
    });
  });

  describe('Token Type Detection', () => {
    describe('detectTokenType', () => {
      it('should detect JWT token type', () => {
        // Given
        const token = AccessToken.create(JWT_TOKEN, VALID_EXPIRATION);

        // When
        const tokenType = TokenSecuritySpec.detectTokenType(token);

        // Then
        expect(tokenType).toBe(TokenType.JWT);
      });

      it('should detect API key token type', () => {
        // Given
        const token = AccessToken.create(API_KEY_TOKEN, VALID_EXPIRATION);

        // When
        const tokenType = TokenSecuritySpec.detectTokenType(token);

        // Then
        expect(tokenType).toBe(TokenType.API_KEY);
      });

      it('should detect OPAQUE token type for unrecognized patterns', () => {
        // Given
        const token = AccessToken.create(OPAQUE_TOKEN, VALID_EXPIRATION);

        // When
        const tokenType = TokenSecuritySpec.detectTokenType(token);

        // Then
        expect(tokenType).toBe(TokenType.OPAQUE);
      });

      it('should detect RANDOM token type for random patterns', () => {
        // Given
        const token = AccessToken.create(MEDIUM_TOKEN, VALID_EXPIRATION);

        // When
        const tokenType = TokenSecuritySpec.detectTokenType(token);

        // Then
        expect(tokenType).toBe(TokenType.RANDOM);
      });

      it('should handle special character tokens in type detection', () => {
        // Given
        const token = AccessToken.create(SPECIAL_CHARS_TOKEN, VALID_EXPIRATION);

        // When
        const tokenType = TokenSecuritySpec.detectTokenType(token);

        // Then
        expect(tokenType).toBe(TokenType.RANDOM);
      });
    });
  });

  describe('Minimum Security Validation', () => {
    describe('assertMinimumSecurity', () => {
      it('should pass when token meets minimum security level', () => {
        // Given
        const token = AccessToken.create(STRONG_TOKEN, VALID_EXPIRATION);

        // When & Then
        expect(() => {
          TokenSecuritySpec.assertMinimumSecurity(token, TokenSecurityLevel.MEDIUM);
        }).not.toThrow();
      });

      it('should pass when token exceeds minimum security level', () => {
        // Given
        const token = AccessToken.create(STRONG_TOKEN, VALID_EXPIRATION);

        // When & Then
        expect(() => {
          TokenSecuritySpec.assertMinimumSecurity(token, TokenSecurityLevel.LOW);
        }).not.toThrow();
      });

      it('should throw BusinessRuleError when token security is insufficient', () => {
        // Given
        const token = AccessToken.create(WEAK_TOKEN, VALID_EXPIRATION);

        // When & Then
        expect(() => {
          TokenSecuritySpec.assertMinimumSecurity(token, TokenSecurityLevel.HIGH);
        }).toThrow();
      });

      it('should use MEDIUM as default minimum security level', () => {
        // Given
        const weakToken = AccessToken.create(WEAK_TOKEN, VALID_EXPIRATION);
        const mediumToken = AccessToken.create(MEDIUM_TOKEN, VALID_EXPIRATION);

        // When & Then
        expect(() => {
          TokenSecuritySpec.assertMinimumSecurity(weakToken);
        }).toThrow();

        expect(() => {
          TokenSecuritySpec.assertMinimumSecurity(mediumToken);
        }).not.toThrow();
      });

      it('should include security levels in error message', () => {
        // Given
        const token = AccessToken.create(WEAK_TOKEN, VALID_EXPIRATION);

        // When & Then
        expect(() => {
          TokenSecuritySpec.assertMinimumSecurity(token, TokenSecurityLevel.HIGH);
        }).toThrow(jasmine.stringMatching(/LOW.*HIGH/));
      });

      it('should handle edge case where token exactly meets minimum level', () => {
        // Given
        const token = AccessToken.create(MEDIUM_TOKEN, VALID_EXPIRATION);

        // When & Then
        expect(() => {
          TokenSecuritySpec.assertMinimumSecurity(token, TokenSecurityLevel.MEDIUM);
        }).not.toThrow();
      });
    });
  });

  describe('Security Metadata Analysis', () => {
    describe('getSecurityMetadata', () => {
      it('should return comprehensive security metadata for strong token', () => {
        // Given
        const token = AccessToken.create(STRONG_TOKEN, VALID_EXPIRATION);

        // When
        const metadata = TokenSecuritySpec.getSecurityMetadata(token);

        // Then
        expect(metadata).toBeDefined();
        expect(metadata.securityLevel).toBe(TokenSecurityLevel.HIGH);
        expect(metadata.tokenType).toBeDefined();
        expect(metadata.entropy).toBeGreaterThan(0);
        expect(metadata.securityScore).toBeGreaterThan(0);
        expect(metadata.length).toBe(STRONG_TOKEN.length);
        expect(metadata.characterDiversity).toBeDefined();
      });

      it('should return metadata for JWT token', () => {
        // Given
        const token = AccessToken.create(JWT_TOKEN, VALID_EXPIRATION);

        // When
        const metadata = TokenSecuritySpec.getSecurityMetadata(token);

        // Then
        expect(metadata.tokenType).toBe(TokenType.JWT);
        expect(metadata.length).toBe(JWT_TOKEN.length);
        expect(metadata.entropy).toBeGreaterThan(0);
      });

      it('should calculate entropy correctly for different token types', () => {
        // Given
        const numericToken = AccessToken.create(NUMERIC_TOKEN, VALID_EXPIRATION);
        const mixedToken = AccessToken.create(MEDIUM_TOKEN, VALID_EXPIRATION);

        // When
        const numericMetadata = TokenSecuritySpec.getSecurityMetadata(numericToken);
        const mixedMetadata = TokenSecuritySpec.getSecurityMetadata(mixedToken);

        // Then
        expect(mixedMetadata.entropy).toBeGreaterThan(numericMetadata.entropy);
      });

      it('should analyze character diversity correctly', () => {
        // Given
        const token = AccessToken.create(STRONG_TOKEN, VALID_EXPIRATION);

        // When
        const metadata = TokenSecuritySpec.getSecurityMetadata(token);

        // Then
        expect(metadata.characterDiversity).toBeDefined();
        expect(metadata.characterDiversity.hasLowercase).toBeDefined();
        expect(metadata.characterDiversity.hasUppercase).toBeDefined();
        expect(metadata.characterDiversity.hasNumbers).toBeDefined();
        expect(metadata.characterDiversity.hasSpecial).toBeDefined();
      });

      it('should handle minimal length token in metadata analysis', () => {
        // Given
        const minimalToken = 'a'.repeat(16); // Minimum valid length
        const token = AccessToken.create(minimalToken, VALID_EXPIRATION);

        // When
        const metadata = TokenSecuritySpec.getSecurityMetadata(token);

        // Then
        expect(metadata.length).toBe(16);
        expect(metadata.entropy).toBeGreaterThanOrEqual(0);
        expect(metadata.securityScore).toBeGreaterThanOrEqual(0);
        expect(metadata.securityLevel).toBe(TokenSecurityLevel.LOW);
      });

      it('should provide consistent metadata across multiple calls', () => {
        // Given
        const token = AccessToken.create(MEDIUM_TOKEN, VALID_EXPIRATION);

        // When
        const metadata1 = TokenSecuritySpec.getSecurityMetadata(token);
        const metadata2 = TokenSecuritySpec.getSecurityMetadata(token);

        // Then
        expect(metadata1.securityLevel).toBe(metadata2.securityLevel);
        expect(metadata1.tokenType).toBe(metadata2.tokenType);
        expect(metadata1.entropy).toBe(metadata2.entropy);
        expect(metadata1.securityScore).toBe(metadata2.securityScore);
        expect(metadata1.length).toBe(metadata2.length);
      });
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle tokens with only special characters', () => {
      // Given
      const token = AccessToken.create(SPECIAL_CHARS_TOKEN, VALID_EXPIRATION);

      // When
      const securityLevel = TokenSecuritySpec.getSecurityLevel(token);
      const tokenType = TokenSecuritySpec.detectTokenType(token);
      const metadata = TokenSecuritySpec.getSecurityMetadata(token);

      // Then
      expect(securityLevel).toBeDefined();
      expect(tokenType).toBeDefined();
      expect(metadata).toBeDefined();
      expect(metadata.characterDiversity.hasSpecial).toBe(true);
    });

    it('should handle very long tokens', () => {
      // Given
      const longToken = 'a'.repeat(1000);
      const token = AccessToken.create(longToken, VALID_EXPIRATION);

      // When
      const metadata = TokenSecuritySpec.getSecurityMetadata(token);

      // Then
      expect(metadata.length).toBe(1000);
      expect(metadata.entropy).toBeGreaterThanOrEqual(0);
    });

    it('should handle tokens with mixed case alphanumeric characters', () => {
      // Given
      const mixedToken = 'MixedCase_Token_123456789';
      const token = AccessToken.create(mixedToken, VALID_EXPIRATION);

      // When
      const securityLevel = TokenSecuritySpec.getSecurityLevel(token);
      const metadata = TokenSecuritySpec.getSecurityMetadata(token);

      // Then
      expect(securityLevel).toBeDefined();
      expect(metadata.length).toBe(mixedToken.length);
    });

    it('should maintain security level hierarchy consistency', () => {
      // Given
      const lowToken = AccessToken.create(WEAK_TOKEN, VALID_EXPIRATION);
      const mediumToken = AccessToken.create(MEDIUM_TOKEN, VALID_EXPIRATION);
      const highToken = AccessToken.create(STRONG_TOKEN, VALID_EXPIRATION);

      // When
      const lowLevel = TokenSecuritySpec.getSecurityLevel(lowToken);
      const mediumLevel = TokenSecuritySpec.getSecurityLevel(mediumToken);
      const highLevel = TokenSecuritySpec.getSecurityLevel(highToken);

      // Then
      expect(lowLevel).toBe(TokenSecurityLevel.LOW);
      expect(mediumLevel).toBe(TokenSecurityLevel.MEDIUM);
      expect(highLevel).toBe(TokenSecurityLevel.HIGH);

      // Verify hierarchy in security assertions
      expect(() => {
        TokenSecuritySpec.assertMinimumSecurity(lowToken, TokenSecurityLevel.MEDIUM);
      }).toThrow();

      expect(() => {
        TokenSecuritySpec.assertMinimumSecurity(mediumToken, TokenSecurityLevel.LOW);
      }).not.toThrow();

      expect(() => {
        TokenSecuritySpec.assertMinimumSecurity(highToken, TokenSecurityLevel.MEDIUM);
      }).not.toThrow();
    });
  });

  describe('Business Rule Consistency', () => {
    it('should maintain consistent security assessment across all methods', () => {
      // Given
      const token = AccessToken.create(MEDIUM_TOKEN, VALID_EXPIRATION);

      // When
      const directSecurityLevel = TokenSecuritySpec.getSecurityLevel(token);
      const metadataSecurityLevel = TokenSecuritySpec.getSecurityMetadata(token).securityLevel;

      // Then
      expect(directSecurityLevel).toBe(metadataSecurityLevel);
    });

    it('should ensure security score correlates with security level', () => {
      // Given
      const weakToken = AccessToken.create(WEAK_TOKEN, VALID_EXPIRATION);
      const strongToken = AccessToken.create(STRONG_TOKEN, VALID_EXPIRATION);

      // When
      const weakMetadata = TokenSecuritySpec.getSecurityMetadata(weakToken);
      const strongMetadata = TokenSecuritySpec.getSecurityMetadata(strongToken);

      // Then
      expect(strongMetadata.securityScore).toBeGreaterThan(weakMetadata.securityScore);
      expect(strongMetadata.entropy).toBeGreaterThan(weakMetadata.entropy);
    });

    it('should validate that all security levels are testable', () => {
      // Given - Create tokens that should result in each security level
      const testTokens = [
        { token: WEAK_TOKEN, expectedLevel: TokenSecurityLevel.LOW },
        { token: MEDIUM_TOKEN, expectedLevel: TokenSecurityLevel.MEDIUM },
        { token: STRONG_TOKEN, expectedLevel: TokenSecurityLevel.HIGH },
      ];

      // When & Then
      testTokens.forEach(({ token: tokenValue, expectedLevel }) => {
        const token = AccessToken.create(tokenValue, VALID_EXPIRATION);
        const actualLevel = TokenSecuritySpec.getSecurityLevel(token);
        expect(actualLevel).toBe(expectedLevel);
      });
    });
  });
});
