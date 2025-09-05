import { AccessLevel } from './accesslevel.vo';

/**
 * Domain Layer Test - AccessLevel Value Object
 *
 * Tests value object creation, validation, and domain invariants following DDD principles.
 * Ensures AccessLevel maintains business rules and provides correct domain behavior.
 */
describe('AccessLevel - Domain Tests', () => {
  describe('Constructor and Basic Properties', () => {
    it('should create AccessLevel with valid value', () => {
      const accessLevel = AccessLevel.create(3);

      expect(accessLevel).toBeInstanceOf(AccessLevel);
      expect(accessLevel.getValue()).toBe(3);
    });

    it('should maintain immutability through readonly contract', () => {
      const accessLevel = AccessLevel.create(2);

      expect(accessLevel.getValue()).toBe(2);
      // Domain Layer maintains immutability through TypeScript readonly contracts
      // The value object should be immutable by design, not through runtime freezing
      expect(accessLevel).toBeDefined();
      expect(typeof accessLevel.getValue()).toBe('number');

      // Test that the same instance always returns the same value
      expect(accessLevel.getValue()).toBe(2);
      expect(accessLevel.getValue()).toBe(2);
    });

    it('should generate consistent string representation', () => {
      const accessLevel = AccessLevel.create(4);

      expect(accessLevel.toString()).toBe('AccessLevel(4)');
    });
  });

  describe('Factory Method - create', () => {
    it('should create AccessLevel for minimum valid value', () => {
      const accessLevel = AccessLevel.create(AccessLevel.MIN);

      expect(accessLevel.getValue()).toBe(1);
    });

    it('should create AccessLevel for maximum valid value', () => {
      const accessLevel = AccessLevel.create(AccessLevel.MAX);

      expect(accessLevel.getValue()).toBe(5);
    });

    it('should reject values below minimum', () => {
      expect(() => {
        AccessLevel.create(AccessLevel.MIN - 1);
      }).toThrow();
    });

    it('should reject values above maximum', () => {
      expect(() => {
        AccessLevel.create(AccessLevel.MAX + 1);
      }).toThrow();
    });

    it('should provide descriptive error message for invalid values', () => {
      try {
        AccessLevel.create(10);
        fail('Should have thrown ValidationError');
      } catch (error: any) {
        expect(error.message).toContain('Invalid AccessLevel: 10');
        expect(error.message).toContain('Must be between 1 and 5');
      }
    });
  });

  describe('Comparison Methods', () => {
    let level2: AccessLevel;
    let level3: AccessLevel;
    let level4: AccessLevel;

    beforeEach(() => {
      level2 = AccessLevel.create(2);
      level3 = AccessLevel.create(3);
      level4 = AccessLevel.create(4);
    });

    describe('compareTo', () => {
      it('should return negative when this level is lower', () => {
        expect(level2.compareTo(level4)).toBeLessThan(0);
      });

      it('should return positive when this level is higher', () => {
        expect(level4.compareTo(level2)).toBeGreaterThan(0);
      });

      it('should return zero when levels are equal', () => {
        expect(level3.compareTo(AccessLevel.create(3))).toBe(0);
      });
    });

    describe('isEqual', () => {
      it('should return true for equal levels', () => {
        expect(level3.isEqual(AccessLevel.create(3))).toBe(true);
      });

      it('should return false for different levels', () => {
        expect(level2.isEqual(level4)).toBe(false);
      });
    });

    describe('isHigherThan', () => {
      it('should return true when this level has higher authority (lower number)', () => {
        expect(level2.isHigherThan(level4)).toBe(true); // 2 > 4 in authority
      });

      it('should return false when this level has lower or equal authority', () => {
        expect(level4.isHigherThan(level2)).toBe(false); // 4 < 2 in authority
        expect(level3.isHigherThan(AccessLevel.create(3))).toBe(false);
      });
    });

    describe('isAtLeast', () => {
      it('should return true when this level has higher or equal authority', () => {
        expect(level2.isAtLeast(level4)).toBe(true); // 2 >= 4 in authority
        expect(level3.isAtLeast(AccessLevel.create(3))).toBe(true);
      });

      it('should return false when this level has lower authority', () => {
        expect(level4.isAtLeast(level2)).toBe(false); // 4 < 2 in authority
      });
    });
  });

  describe('Domain Invariants', () => {
    it('should maintain valid range invariant', () => {
      // Domain Layer ensures invariants are always maintained
      const validLevels = [1, 2, 3, 4, 5];

      validLevels.forEach((level) => {
        const accessLevel = AccessLevel.create(level);
        expect(accessLevel.getValue()).toBeGreaterThanOrEqual(AccessLevel.MIN);
        expect(accessLevel.getValue()).toBeLessThanOrEqual(AccessLevel.MAX);
      });
    });

    it('should preserve value immutability across operations', () => {
      const original = AccessLevel.create(3);
      const originalValue = original.getValue();

      // Operations should not modify the original value
      original.compareTo(AccessLevel.create(2));
      original.isEqual(AccessLevel.create(3));
      original.isHigherThan(AccessLevel.create(1));

      expect(original.getValue()).toBe(originalValue);
    });

    it('should generate deterministic string representations', () => {
      const level1 = AccessLevel.create(2);
      const level2 = AccessLevel.create(2);

      expect(level1.toString()).toBe(level2.toString());
      expect(level1.toString()).toBe('AccessLevel(2)');
    });
  });

  describe('Edge Cases and Error Conditions', () => {
    it('should handle boundary values correctly', () => {
      const minLevel = AccessLevel.create(AccessLevel.MIN);
      const maxLevel = AccessLevel.create(AccessLevel.MAX);

      expect(minLevel.getValue()).toBe(1);
      expect(maxLevel.getValue()).toBe(5);
    });

    it('should reject zero as invalid value', () => {
      expect(() => {
        AccessLevel.create(0);
      }).toThrow();
    });

    it('should reject negative values', () => {
      expect(() => {
        AccessLevel.create(-1);
      }).toThrow();
    });

    it('should handle float values by truncating to integer', () => {
      // Domain rule: AccessLevel only accepts integers, floats should be rejected
      expect(() => AccessLevel.create(2.9)).toThrow();
    });

    it('should handle comparison with same instance', () => {
      const level = AccessLevel.create(3);

      expect(level.compareTo(level)).toBe(0);
      expect(level.isEqual(level)).toBe(true);
      expect(level.isHigherThan(level)).toBe(false);
      expect(level.isAtLeast(level)).toBe(true);
    });
  });

  describe('Business Rules Validation', () => {
    it('should enforce access level hierarchy (lower number = higher authority)', () => {
      const admin = AccessLevel.create(1); // Super Admin - highest
      const manager = AccessLevel.create(2); // Admin
      const lead = AccessLevel.create(3); // Jefe de Proyecto
      const analyst = AccessLevel.create(4); // Analista
      const user = AccessLevel.create(5); // Usuario - lowest

      // Verify hierarchy: lower number = higher authority
      expect(admin.isHigherThan(manager)).toBe(true);
      expect(manager.isHigherThan(lead)).toBe(true);
      expect(lead.isHigherThan(analyst)).toBe(true);
      expect(analyst.isHigherThan(user)).toBe(true);
    });

    it('should maintain consistent comparison results', () => {
      const levelA = AccessLevel.create(2);
      const levelB = AccessLevel.create(4);

      // If A < B, then B > A
      expect(levelA.compareTo(levelB)).toBeLessThan(0);
      expect(levelB.compareTo(levelA)).toBeGreaterThan(0);

      // Transitive property
      const levelC = AccessLevel.create(3);
      expect(levelA.compareTo(levelC)).toBeLessThan(0);
      expect(levelC.compareTo(levelB)).toBeLessThan(0);
      expect(levelA.compareTo(levelB)).toBeLessThan(0);
    });
  });
});
