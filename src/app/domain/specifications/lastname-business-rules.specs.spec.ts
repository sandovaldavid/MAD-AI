import { LastNameBusinessRules } from './lastname-business-rules.specs';

/**
 * LastName Business Rules Specifications Tests
 *
 * @description
 * Domain Layer tests for lastname business rules - pure unit tests without mocks
 * Testing business logic, validations, and edge cases following Clean Architecture principles
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 */
describe('LastNameBusinessRules - Domain Tests', () => {
  describe('extractMainPart - Business Rule', () => {
    it('should extract main surname from compound surname with particles', () => {
      // Given
      const surname = 'María de la Cruz';

      // When
      const result = LastNameBusinessRules.extractMainPart(surname);

      // Then
      expect(result).toBe('Cruz');
    });

    it('should return simple surname when no particles present', () => {
      // Given
      const surname = 'García';

      // When
      const result = LastNameBusinessRules.extractMainPart(surname);

      // Then
      expect(result).toBe('García');
    });

    it('should handle multiple particles correctly', () => {
      // Given
      const surname = 'Juan Carlos de los Santos';

      // When
      const result = LastNameBusinessRules.extractMainPart(surname);

      // Then
      expect(result).toBe('Santos');
    });

    it('should handle surname with only particles', () => {
      // Given
      const surname = 'de la';

      // When
      const result = LastNameBusinessRules.extractMainPart(surname);

      // Then
      expect(result).toBe('la'); // Returns last word when all are particles
    });

    it('should handle single word surname', () => {
      // Given
      const surname = 'Rodríguez';

      // When
      const result = LastNameBusinessRules.extractMainPart(surname);

      // Then
      expect(result).toBe('Rodríguez');
    });

    it('should handle empty string', () => {
      // Given
      const surname = '';

      // When
      const result = LastNameBusinessRules.extractMainPart(surname);

      // Then
      expect(result).toBe('');
    });

    it('should handle surname with mixed case particles', () => {
      // Given
      const surname = 'Ana DE LA Torre';

      // When
      const result = LastNameBusinessRules.extractMainPart(surname);

      // Then
      expect(result).toBe('Torre');
    });
  });

  describe('generateSoundex - Phonetic Matching Business Rule', () => {
    it('should generate correct soundex for simple surname', () => {
      // Given
      const surname = 'Smith';

      // When
      const result = LastNameBusinessRules.generateSoundex(surname);

      // Then
      expect(result).toBe('S530');
    });

    it('should generate same soundex for phonetically similar surnames', () => {
      // Given
      const surname1 = 'Smith';
      const surname2 = 'Smyth';

      // When
      const soundex1 = LastNameBusinessRules.generateSoundex(surname1);
      const soundex2 = LastNameBusinessRules.generateSoundex(surname2);

      // Then
      expect(soundex1).toBe(soundex2);
      expect(soundex1).toBe('S530');
    });

    it('should generate different soundex for phonetically different surnames', () => {
      // Given
      const surname1 = 'García';
      const surname2 = 'Rodríguez';

      // When
      const soundex1 = LastNameBusinessRules.generateSoundex(surname1);
      const soundex2 = LastNameBusinessRules.generateSoundex(surname2);

      // Then
      expect(soundex1).not.toBe(soundex2);
    });

    it('should handle empty string', () => {
      // Given
      const surname = '';

      // When
      const result = LastNameBusinessRules.generateSoundex(surname);

      // Then
      expect(result).toBe('');
    });

    it('should handle surname with special characters', () => {
      // Given
      const surname = "O'Brien";

      // When
      const result = LastNameBusinessRules.generateSoundex(surname);

      // Then
      expect(result).toMatch(/^O\d{3}$/);
      expect(result.length).toBe(4);
    });

    it('should handle surname with accents', () => {
      // Given
      const surname = 'Pérez';

      // When
      const result = LastNameBusinessRules.generateSoundex(surname);

      // Then
      expect(result).toMatch(/^P\d{3}$/);
      expect(result.length).toBe(4);
    });

    it('should always return 4-character soundex code', () => {
      // Given
      const surnames = ['Li', 'García', 'Rodríguez-Martínez', 'A'];

      surnames.forEach((surname) => {
        // When
        const result = LastNameBusinessRules.generateSoundex(surname);

        // Then
        expect(result.length).toBe(4);
        expect(result).toMatch(/^[A-Z]\d{3}$/);
      });
    });

    it('should ignore vowels except first letter', () => {
      // Given
      const surname = 'Alexander';

      // When
      const result = LastNameBusinessRules.generateSoundex(surname);

      // Then
      expect(result).toBe('A425'); // A-l-x-n-d-r -> A-4-2-5
    });

    it('should handle consecutive consonants with same code', () => {
      // Given
      const surname = 'Pfeiffer';

      // When
      const result = LastNameBusinessRules.generateSoundex(surname);

      // Then
      expect(result).toBe('P160'); // P-f-f-r -> P-1-6 (consecutive f's treated as one)
    });
  });

  describe('createSortKey - Alphabetical Ordering Business Rule', () => {
    it('should create lowercase sort key from main part', () => {
      // Given
      const surname = 'María de la Cruz';

      // When
      const result = LastNameBusinessRules.createSortKey(surname);

      // Then
      expect(result).toBe('cruz');
    });

    it('should handle simple surname', () => {
      // Given
      const surname = 'García';

      // When
      const result = LastNameBusinessRules.createSortKey(surname);

      // Then
      expect(result).toBe('garcía');
    });

    it('should handle mixed case surname', () => {
      // Given
      const surname = 'McDONALD';

      // When
      const result = LastNameBusinessRules.createSortKey(surname);

      // Then
      expect(result).toBe('mcdonald');
    });
  });

  describe('arePhoneticallySimilar - Phonetic Comparison Business Rule', () => {
    it('should return true for phonetically similar surnames', () => {
      // Given
      const surname1 = 'Smith';
      const surname2 = 'Smyth';

      // When
      const result = LastNameBusinessRules.arePhoneticallySimilar(surname1, surname2);

      // Then
      expect(result).toBe(true);
    });

    it('should return false for phonetically different surnames', () => {
      // Given
      const surname1 = 'García';
      const surname2 = 'Rodríguez';

      // When
      const result = LastNameBusinessRules.arePhoneticallySimilar(surname1, surname2);

      // Then
      expect(result).toBe(false);
    });

    it('should return true for identical surnames', () => {
      // Given
      const surname1 = 'López';
      const surname2 = 'López';

      // When
      const result = LastNameBusinessRules.arePhoneticallySimilar(surname1, surname2);

      // Then
      expect(result).toBe(true);
    });

    it('should handle case differences', () => {
      // Given
      const surname1 = 'garcia';
      const surname2 = 'GARCIA';

      // When
      const result = LastNameBusinessRules.arePhoneticallySimilar(surname1, surname2);

      // Then
      expect(result).toBe(true);
    });
  });

  describe('isCompound - Compound Surname Detection Business Rule', () => {
    it('should return true for surname with spaces', () => {
      // Given
      const surname = 'García López';

      // When
      const result = LastNameBusinessRules.isCompound(surname);

      // Then
      expect(result).toBe(true);
    });

    it('should return true for surname with hyphens', () => {
      // Given
      const surname = 'Rodríguez-Martínez';

      // When
      const result = LastNameBusinessRules.isCompound(surname);

      // Then
      expect(result).toBe(true);
    });

    it('should return true for surname with particles', () => {
      // Given
      const surname = 'María de la Cruz';

      // When
      const result = LastNameBusinessRules.isCompound(surname);

      // Then
      expect(result).toBe(true);
    });

    it('should return false for simple surname', () => {
      // Given
      const surname = 'García';

      // When
      const result = LastNameBusinessRules.isCompound(surname);

      // Then
      expect(result).toBe(false);
    });

    it('should return false for empty string', () => {
      // Given
      const surname = '';

      // When
      const result = LastNameBusinessRules.isCompound(surname);

      // Then
      expect(result).toBe(false);
    });
  });

  describe('hasParticle - Particle Detection Business Rule', () => {
    it('should return true when surname contains particles', () => {
      // Given
      const surname = 'María de la Cruz';

      // When
      const result = LastNameBusinessRules.hasParticle(surname);

      // Then
      expect(result).toBe(true);
    });

    it('should return false when surname has no particles', () => {
      // Given
      const surname = 'García López';

      // When
      const result = LastNameBusinessRules.hasParticle(surname);

      // Then
      expect(result).toBe(false);
    });

    it('should handle mixed case particles', () => {
      // Given
      const surname = 'Ana DE LA Torre';

      // When
      const result = LastNameBusinessRules.hasParticle(surname);

      // Then
      expect(result).toBe(true);
    });

    it('should return false for simple surname', () => {
      // Given
      const surname = 'Rodríguez';

      // When
      const result = LastNameBusinessRules.hasParticle(surname);

      // Then
      expect(result).toBe(false);
    });

    it('should handle multiple particles', () => {
      // Given
      const surname = 'Juan Carlos de los Santos';

      // When
      const result = LastNameBusinessRules.hasParticle(surname);

      // Then
      expect(result).toBe(true);
    });
  });

  describe('getMetadata - Complete Surname Analysis Business Rule', () => {
    it('should generate complete metadata for simple surname', () => {
      // Given
      const surname = 'García';

      // When
      const result = LastNameBusinessRules.getMetadata(surname);

      // Then
      expect(result.mainPart).toBe('García');
      expect(result.soundex).toBe('G620');
      expect(result.sortKey).toBe('garcía');
      expect(result.isCompound).toBe(false);
      expect(result.hasParticle).toBe(false);
      expect(result.hasAccents).toBe(true);
      expect(result.hasApostrophe).toBe(false);
    });

    it('should generate complete metadata for compound surname with particles', () => {
      // Given
      const surname = 'María de la Cruz';

      // When
      const result = LastNameBusinessRules.getMetadata(surname);

      // Then
      expect(result.mainPart).toBe('Cruz');
      expect(result.soundex).toBe('C620');
      expect(result.sortKey).toBe('cruz');
      expect(result.isCompound).toBe(true);
      expect(result.hasParticle).toBe(true);
      expect(result.hasAccents).toBe(true);
      expect(result.hasApostrophe).toBe(false);
    });

    it('should detect apostrophe in surname', () => {
      // Given
      const surname = "O'Brien";

      // When
      const result = LastNameBusinessRules.getMetadata(surname);

      // Then
      expect(result.mainPart).toBe("O'Brien");
      expect(result.hasApostrophe).toBe(true);
      expect(result.isCompound).toBe(false);
      expect(result.hasParticle).toBe(false);
    });

    it('should handle hyphenated surname', () => {
      // Given
      const surname = 'Rodríguez-Martínez';

      // When
      const result = LastNameBusinessRules.getMetadata(surname);

      // Then
      expect(result.mainPart).toBe('Rodríguez-Martínez');
      expect(result.isCompound).toBe(true);
      expect(result.hasParticle).toBe(false);
      expect(result.hasAccents).toBe(true);
      expect(result.hasApostrophe).toBe(false);
    });

    it('should handle surname without accents', () => {
      // Given
      const surname = 'Smith';

      // When
      const result = LastNameBusinessRules.getMetadata(surname);

      // Then
      expect(result.mainPart).toBe('Smith');
      expect(result.soundex).toBe('S530');
      expect(result.sortKey).toBe('smith');
      expect(result.isCompound).toBe(false);
      expect(result.hasParticle).toBe(false);
      expect(result.hasAccents).toBe(false);
      expect(result.hasApostrophe).toBe(false);
    });

    it('should handle complex surname with multiple characteristics', () => {
      // Given
      const surname = "José María de los Ángeles-O'Connor";

      // When
      const result = LastNameBusinessRules.getMetadata(surname);

      // Then
      expect(result.mainPart).toBe("Ángeles-O'Connor");
      expect(result.isCompound).toBe(true);
      expect(result.hasParticle).toBe(true);
      expect(result.hasAccents).toBe(true);
      expect(result.hasApostrophe).toBe(true);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle null-like inputs gracefully', () => {
      // Given
      const inputs = ['', ' ', '  '];

      inputs.forEach((input) => {
        // When & Then
        expect(() => LastNameBusinessRules.extractMainPart(input)).not.toThrow();
        expect(() => LastNameBusinessRules.generateSoundex(input)).not.toThrow();
        expect(() => LastNameBusinessRules.createSortKey(input)).not.toThrow();
        expect(() => LastNameBusinessRules.isCompound(input)).not.toThrow();
        expect(() => LastNameBusinessRules.hasParticle(input)).not.toThrow();
        expect(() => LastNameBusinessRules.getMetadata(input)).not.toThrow();
      });
    });

    it('should handle very long surnames', () => {
      // Given
      const longSurname = 'García'.repeat(20);

      // When
      const metadata = LastNameBusinessRules.getMetadata(longSurname);

      // Then
      expect(metadata.soundex.length).toBe(4);
      expect(metadata.mainPart).toBe(longSurname);
      expect(metadata.sortKey).toBe(longSurname.toLowerCase());
    });

    it('should handle surnames with numbers', () => {
      // Given
      const surname = 'García123';

      // When
      const result = LastNameBusinessRules.generateSoundex(surname);

      // Then
      expect(result).toMatch(/^G\d{3}$/);
      expect(result.length).toBe(4);
    });

    it('should handle single character surname', () => {
      // Given
      const surname = 'A';

      // When
      const metadata = LastNameBusinessRules.getMetadata(surname);

      // Then
      expect(metadata.mainPart).toBe('A');
      expect(metadata.soundex).toBe('A000');
      expect(metadata.sortKey).toBe('a');
      expect(metadata.isCompound).toBe(false);
    });
  });

  describe('Business Rule Consistency', () => {
    it('should maintain consistency between isCompound and hasParticle', () => {
      // Given
      const testCases = [
        'García',
        'García López',
        'María de la Cruz',
        'Rodríguez-Martínez',
        "O'Brien",
      ];

      testCases.forEach((surname) => {
        // When
        const metadata = LastNameBusinessRules.getMetadata(surname);

        // Then
        if (metadata.hasParticle) {
          expect(metadata.isCompound).toBe(true);
        }
        // Note: isCompound can be true without hasParticle (hyphens, spaces)
      });
    });

    it('should ensure soundex consistency for phonetic similarity', () => {
      // Given
      const phoneticPairs = [
        ['Smith', 'Smyth'],
        ['García', 'Garcia'], // With and without accent
        ['López', 'Lopez'],
      ];

      phoneticPairs.forEach(([surname1, surname2]) => {
        // When
        const areSimilar = LastNameBusinessRules.arePhoneticallySimilar(surname1, surname2);
        const soundex1 = LastNameBusinessRules.generateSoundex(surname1);
        const soundex2 = LastNameBusinessRules.generateSoundex(surname2);

        // Then
        expect(areSimilar).toBe(soundex1 === soundex2);
      });
    });

    it('should ensure extractMainPart is used consistently in createSortKey', () => {
      // Given
      const surnames = ['García', 'María de la Cruz', 'Rodríguez-Martínez'];

      surnames.forEach((surname) => {
        // When
        const mainPart = LastNameBusinessRules.extractMainPart(surname);
        const sortKey = LastNameBusinessRules.createSortKey(surname);

        // Then
        expect(sortKey).toBe(mainPart.toLowerCase());
      });
    });
  });
});
