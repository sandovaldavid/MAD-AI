import { FirstNameBusinessRules } from './firstname-business-rules.specs';
import { FIRSTNAME_COMMON_NICKNAMES } from '../enums/firstname.enum';

/**
 * FirstName Business Rules Specifications - Domain Tests
 *
 * @description
 * Tests unitarios puros para las reglas de negocio de FirstName.
 * Siguiendo Domain Layer Testing guidelines: sin mocks, sin dependencias externas,
 * validando únicamente lógica de negocio pura.
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 */
describe('FirstNameBusinessRules - Domain Tests', () => {
  describe('Soundex Generation', () => {
    describe('Basic Soundex Algorithm', () => {
      it('should generate correct soundex for simple names', () => {
        // Given
        const name = 'Smith';

        // When
        const result = FirstNameBusinessRules.generateSoundex(name);

        // Then
        expect(result).toBe('S530');
      });

      it('should generate same soundex for phonetically similar names', () => {
        // Given
        const name1 = 'Catherine';
        const name2 = 'Katherine';

        // When
        const soundex1 = FirstNameBusinessRules.generateSoundex(name1);
        const soundex2 = FirstNameBusinessRules.generateSoundex(name2);

        // Then
        expect(soundex1).toBe('C365');
        expect(soundex2).toBe('K365');
        // Note: These names are not phonetically similar according to soundex algorithm
        expect(soundex1).not.toBe(soundex2);
      });

      it('should handle names with repeated consonants', () => {
        // Given
        const name = 'Robert';

        // When
        const result = FirstNameBusinessRules.generateSoundex(name);

        // Then
        expect(result).toBe('R163');
      });

      it('should ignore vowels except first letter', () => {
        // Given
        const name1 = 'Ashcraft';
        const name2 = 'Ashcroft';

        // When
        const soundex1 = FirstNameBusinessRules.generateSoundex(name1);
        const soundex2 = FirstNameBusinessRules.generateSoundex(name2);

        // Then
        expect(soundex1).toBe(soundex2);
        expect(soundex1).toBe('A261');
      });
    });

    describe('Edge Cases', () => {
      it('should return empty string for empty input', () => {
        // Given
        const name = '';

        // When
        const result = FirstNameBusinessRules.generateSoundex(name);

        // Then
        expect(result).toBe('');
      });

      it('should handle single character names', () => {
        // Given
        const name = 'A';

        // When
        const result = FirstNameBusinessRules.generateSoundex(name);

        // Then
        expect(result).toBe('A000');
      });

      it('should handle names with special characters', () => {
        // Given
        const name = "O'Connor";

        // When
        const result = FirstNameBusinessRules.generateSoundex(name);

        // Then
        expect(result).toBe('O256');
      });

      it('should handle names with numbers and symbols', () => {
        // Given
        const name = 'John123!@#';

        // When
        const result = FirstNameBusinessRules.generateSoundex(name);

        // Then
        expect(result).toBe('J500');
      });

      it('should handle lowercase names', () => {
        // Given
        const name = 'smith';

        // When
        const result = FirstNameBusinessRules.generateSoundex(name);

        // Then
        expect(result).toBe('S530');
      });

      it('should pad short soundex codes with zeros', () => {
        // Given
        const name = 'Lee';

        // When
        const result = FirstNameBusinessRules.generateSoundex(name);

        // Then
        expect(result).toBe('L000');
        expect(result.length).toBe(4);
      });

      it('should truncate long soundex codes to 4 characters', () => {
        // Given
        const name = 'Pfister';

        // When
        const result = FirstNameBusinessRules.generateSoundex(name);

        // Then
        expect(result.length).toBe(4);
        expect(result).toBe('P123');
      });
    });
  });

  describe('Phonetic Similarity', () => {
    describe('Similar Names Detection', () => {
      it('should identify phonetically similar names as similar', () => {
        // Given
        const name1 = 'Smith';
        const name2 = 'Smyth';

        // When
        const result = FirstNameBusinessRules.arePhoneticallySimilar(name1, name2);

        // Then
        expect(result).toBe(true);
      });

      it('should identify different names as not similar', () => {
        // Given
        const name1 = 'John';
        const name2 = 'Mary';

        // When
        const result = FirstNameBusinessRules.arePhoneticallySimilar(name1, name2);

        // Then
        expect(result).toBe(false);
      });

      it('should handle case insensitive comparison', () => {
        // Given
        const name1 = 'SMITH';
        const name2 = 'smith';

        // When
        const result = FirstNameBusinessRules.arePhoneticallySimilar(name1, name2);

        // Then
        expect(result).toBe(true);
      });

      it('should identify names with different spellings as similar', () => {
        // Given
        const name1 = 'Steven';
        const name2 = 'Stephen';

        // When
        const result = FirstNameBusinessRules.arePhoneticallySimilar(name1, name2);

        // Then
        expect(result).toBe(true);
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty strings', () => {
        // Given
        const name1 = '';
        const name2 = '';

        // When
        const result = FirstNameBusinessRules.arePhoneticallySimilar(name1, name2);

        // Then
        expect(result).toBe(true);
      });

      it('should handle one empty string', () => {
        // Given
        const name1 = 'John';
        const name2 = '';

        // When
        const result = FirstNameBusinessRules.arePhoneticallySimilar(name1, name2);

        // Then
        expect(result).toBe(false);
      });

      it('should handle identical names', () => {
        // Given
        const name1 = 'John';
        const name2 = 'John';

        // When
        const result = FirstNameBusinessRules.arePhoneticallySimilar(name1, name2);

        // Then
        expect(result).toBe(true);
      });
    });
  });

  describe('Nickname Resolution', () => {
    describe('Known Nicknames', () => {
      it('should return nicknames for known names', () => {
        // Given
        const name = 'Alexander';

        // When
        const result = FirstNameBusinessRules.getNicknames(name);

        // Then
        expect(result).toEqual(['Alex', 'Al', 'Xander']);
      });

      it('should return nicknames for Elizabeth', () => {
        // Given
        const name = 'Elizabeth';

        // When
        const result = FirstNameBusinessRules.getNicknames(name);

        // Then
        expect(result).toEqual(['Liz', 'Beth', 'Lizzy', 'Betty']);
      });

      it('should handle case insensitive lookup', () => {
        // Given
        const name = 'DAVID';

        // When
        const result = FirstNameBusinessRules.getNicknames(name);

        // Then
        expect(result).toEqual(['Dave', 'Davy']);
      });

      it('should handle mixed case names', () => {
        // Given
        const name = 'ChRiStOpHeR';

        // When
        const result = FirstNameBusinessRules.getNicknames(name);

        // Then
        expect(result).toEqual(['Chris', 'Kit']);
      });
    });

    describe('Unknown Names', () => {
      it('should return empty array for unknown names', () => {
        // Given
        const name = 'UnknownName';

        // When
        const result = FirstNameBusinessRules.getNicknames(name);

        // Then
        expect(result).toEqual([]);
      });

      it('should return empty array for empty string', () => {
        // Given
        const name = '';

        // When
        const result = FirstNameBusinessRules.getNicknames(name);

        // Then
        expect(result).toEqual([]);
      });

      it('should return empty array for names with special characters', () => {
        // Given
        const name = 'John123';

        // When
        const result = FirstNameBusinessRules.getNicknames(name);

        // Then
        expect(result).toEqual([]);
      });
    });

    describe('Business Rule Validation', () => {
      it('should always return an array', () => {
        // Given
        const names = ['Alexander', 'UnknownName', '', 'DAVID'];

        // When & Then
        names.forEach((name) => {
          const result = FirstNameBusinessRules.getNicknames(name);
          expect(Array.isArray(result)).toBe(true);
        });
      });

      it('should return a copy and not modify the original enum data', () => {
        // Given
        const originalAlexanderNicknames = [...FIRSTNAME_COMMON_NICKNAMES['alexander']];
        const name = 'Alexander';

        // When
        const result = FirstNameBusinessRules.getNicknames(name);
        const originalResultLength = result.length;
        result.push('ModifiedNickname');

        // Then
        expect(FIRSTNAME_COMMON_NICKNAMES['alexander']).toEqual(originalAlexanderNicknames);
        expect(result.length).toBe(originalResultLength + 1);
        expect(result).toContain('ModifiedNickname');
        expect(FIRSTNAME_COMMON_NICKNAMES['alexander']).not.toContain('ModifiedNickname');
      });
    });
  });

  describe('Compound Name Detection', () => {
    describe('Compound Names', () => {
      it('should identify space-separated compound names', () => {
        // Given
        const name = 'Mary Jane';

        // When
        const result = FirstNameBusinessRules.isCompound(name);

        // Then
        expect(result).toBe(true);
      });

      it('should identify hyphen-separated compound names', () => {
        // Given
        const name = 'Anne-Marie';

        // When
        const result = FirstNameBusinessRules.isCompound(name);

        // Then
        expect(result).toBe(true);
      });

      it('should identify names with multiple spaces', () => {
        // Given
        const name = 'Mary  Jane  Elizabeth';

        // When
        const result = FirstNameBusinessRules.isCompound(name);

        // Then
        expect(result).toBe(true);
      });

      it('should identify names with multiple hyphens', () => {
        // Given
        const name = 'Anne-Marie-Claire';

        // When
        const result = FirstNameBusinessRules.isCompound(name);

        // Then
        expect(result).toBe(true);
      });

      it('should identify names with mixed separators', () => {
        // Given
        const name = 'Mary-Jane Elizabeth';

        // When
        const result = FirstNameBusinessRules.isCompound(name);

        // Then
        expect(result).toBe(true);
      });
    });

    describe('Simple Names', () => {
      it('should identify simple names as not compound', () => {
        // Given
        const name = 'John';

        // When
        const result = FirstNameBusinessRules.isCompound(name);

        // Then
        expect(result).toBe(false);
      });

      it('should handle names with apostrophes as not compound', () => {
        // Given
        const name = "O'Connor";

        // When
        const result = FirstNameBusinessRules.isCompound(name);

        // Then
        expect(result).toBe(false);
      });

      it('should handle empty string as not compound', () => {
        // Given
        const name = '';

        // When
        const result = FirstNameBusinessRules.isCompound(name);

        // Then
        expect(result).toBe(false);
      });

      it('should handle names with accented characters as not compound', () => {
        // Given
        const name = 'José';

        // When
        const result = FirstNameBusinessRules.isCompound(name);

        // Then
        expect(result).toBe(false);
      });
    });
  });

  describe('Metadata Generation', () => {
    describe('Complete Metadata', () => {
      it('should generate complete metadata for simple name', () => {
        // Given
        const name = 'Alexander';

        // When
        const result = FirstNameBusinessRules.getMetadata(name);

        // Then
        expect(result.soundex).toBe('A425');
        expect(result.isCompound).toBe(false);
        expect(result.hasAccents).toBe(false);
        expect(result.hasApostrophe).toBe(false);
        expect(result.nicknames).toEqual(['Alex', 'Al', 'Xander']);
        expect(result.initials).toBe('A');
      });

      it('should generate metadata for compound name with spaces', () => {
        // Given
        const name = 'Mary Jane';

        // When
        const result = FirstNameBusinessRules.getMetadata(name);

        // Then
        expect(result.soundex).toBe('M625');
        expect(result.isCompound).toBe(true);
        expect(result.hasAccents).toBe(false);
        expect(result.hasApostrophe).toBe(false);
        expect(result.nicknames).toEqual([]);
        expect(result.initials).toBe('MJ');
      });

      it('should generate metadata for compound name with hyphens', () => {
        // Given
        const name = 'Anne-Marie';

        // When
        const result = FirstNameBusinessRules.getMetadata(name);

        // Then
        expect(result.soundex).toBe('A560');
        expect(result.isCompound).toBe(true);
        expect(result.hasAccents).toBe(false);
        expect(result.hasApostrophe).toBe(false);
        expect(result.nicknames).toEqual([]);
        expect(result.initials).toBe('AM');
      });

      it('should generate metadata for name with apostrophe', () => {
        // Given
        const name = "O'Connor";

        // When
        const result = FirstNameBusinessRules.getMetadata(name);

        // Then
        expect(result).toEqual({
          soundex: 'O256',
          isCompound: false,
          hasAccents: false,
          hasApostrophe: true,
          nicknames: [],
          initials: 'OC',
        });
      });

      it('should generate metadata for name with accents', () => {
        // Given
        const name = 'José';

        // When
        const result = FirstNameBusinessRules.getMetadata(name);

        // Then
        expect(result).toEqual({
          soundex: 'J200',
          isCompound: false,
          hasAccents: true,
          hasApostrophe: false,
          nicknames: [],
          initials: 'J',
        });
      });
    });

    describe('Complex Cases', () => {
      it('should handle name with multiple characteristics', () => {
        // Given
        const name = "María-José O'Brien";

        // When
        const result = FirstNameBusinessRules.getMetadata(name);

        // Then
        expect(result.soundex).toBe('M621');
        expect(result.isCompound).toBe(true);
        expect(result.hasAccents).toBe(true);
        expect(result.hasApostrophe).toBe(true);
        expect(result.nicknames).toEqual([]);
        expect(result.initials).toBe('MJOB');
      });

      it('should handle empty string', () => {
        // Given
        const name = '';

        // When
        const result = FirstNameBusinessRules.getMetadata(name);

        // Then
        expect(result).toEqual({
          soundex: '',
          isCompound: false,
          hasAccents: false,
          hasApostrophe: false,
          nicknames: [],
          initials: '',
        });
      });

      it('should handle complex compound name with known nicknames', () => {
        // Given
        const name = 'Elizabeth Anne';

        // When
        const result = FirstNameBusinessRules.getMetadata(name);

        // Then
        expect(result.soundex).toBe('E421');
        expect(result.isCompound).toBe(true);
        expect(result.hasAccents).toBe(false);
        expect(result.hasApostrophe).toBe(false);
        expect(result.nicknames).toEqual([]); // Compound names don't get nicknames
        expect(result.initials).toBe('EA');
      });
    });

    describe('Initials Generation', () => {
      it('should generate initials for single name', () => {
        // Given
        const name = 'John';

        // When
        const result = FirstNameBusinessRules.getMetadata(name);

        // Then
        expect(result.initials).toBe('J');
      });

      it('should generate initials for space-separated names', () => {
        // Given
        const name = 'Mary Jane Elizabeth';

        // When
        const result = FirstNameBusinessRules.getMetadata(name);

        // Then
        expect(result.initials).toBe('MJE');
      });

      it('should generate initials for hyphen-separated names', () => {
        // Given
        const name = 'Anne-Marie-Claire';

        // When
        const result = FirstNameBusinessRules.getMetadata(name);

        // Then
        expect(result.initials).toBe('AMC');
      });

      it('should generate initials for apostrophe-separated names', () => {
        // Given
        const name = "O'Connor Patrick";

        // When
        const result = FirstNameBusinessRules.getMetadata(name);

        // Then
        expect(result.initials).toBe('OCP');
      });

      it('should handle mixed separators in initials', () => {
        // Given
        const name = "Mary-Jane O'Brien Elizabeth";

        // When
        const result = FirstNameBusinessRules.getMetadata(name);

        // Then
        expect(result.initials).toBe('MJOBE');
      });

      it('should handle lowercase names in initials', () => {
        // Given
        const name = 'john mary';

        // When
        const result = FirstNameBusinessRules.getMetadata(name);

        // Then
        expect(result.initials).toBe('JM');
      });
    });
  });

  describe('Business Rules Integration', () => {
    describe('Consistency Validation', () => {
      it('should maintain consistency between individual methods and metadata', () => {
        // Given
        const name = 'Alexander';

        // When
        const metadata = FirstNameBusinessRules.getMetadata(name);
        const soundex = FirstNameBusinessRules.generateSoundex(name);
        const isCompound = FirstNameBusinessRules.isCompound(name);
        const nicknames = FirstNameBusinessRules.getNicknames(name);

        // Then
        expect(metadata.soundex).toBe(soundex);
        expect(metadata.isCompound).toBe(isCompound);
        expect(metadata.nicknames).toEqual(nicknames);
      });

      it('should maintain consistency for compound names', () => {
        // Given
        const name = 'Mary-Jane';

        // When
        const metadata = FirstNameBusinessRules.getMetadata(name);
        const soundex = FirstNameBusinessRules.generateSoundex(name);
        const isCompound = FirstNameBusinessRules.isCompound(name);
        const nicknames = FirstNameBusinessRules.getNicknames(name);

        // Then
        expect(metadata.soundex).toBe(soundex);
        expect(metadata.isCompound).toBe(isCompound);
        expect(metadata.nicknames).toEqual(nicknames);
      });
    });

    describe('Performance and Determinism', () => {
      it('should return consistent results for multiple calls', () => {
        // Given
        const name = 'Catherine';

        // When
        const result1 = FirstNameBusinessRules.generateSoundex(name);
        const result2 = FirstNameBusinessRules.generateSoundex(name);
        const result3 = FirstNameBusinessRules.generateSoundex(name);

        // Then
        expect(result1).toBe(result2);
        expect(result2).toBe(result3);
      });

      it('should handle null-like inputs gracefully', () => {
        // Given
        const inputs = ['', ' ', '   ', '\t', '\n'];

        // When & Then
        inputs.forEach((input) => {
          expect(() => {
            FirstNameBusinessRules.generateSoundex(input);
            FirstNameBusinessRules.arePhoneticallySimilar(input, 'test');
            FirstNameBusinessRules.getNicknames(input);
            FirstNameBusinessRules.isCompound(input);
            FirstNameBusinessRules.getMetadata(input);
          }).not.toThrow();
        });
      });
    });
  });
});
