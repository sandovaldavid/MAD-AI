import { Role } from './role.entity';
import { AccessLevel } from '@domain/value-objects';
import { ValidationError } from '@domain/errors/validation-error.entity';
import { DomainEventType } from '../events/domain-event.enum';

/**
 * Role Entity - Domain Layer Tests
 *
 * Tests for Role entity that contains business logic for organizational roles.
 * These are pure unit tests without any external dependencies or mocks.
 *
 * Business Rules Tested:
 * - Role creation with validation
 * - Role activation/deactivation with domain events
 * - Permission checks through specifications
 * - Domain event management
 * - Entity equality and string representation
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 */
describe('Role Entity - Domain Tests', () => {
  let validRole: Role;
  let deactivatedRole: Role;

  beforeEach(() => {
    // Setup test data - pure domain objects, no external dependencies
    validRole = Role.create({
      id: 1,
      name: 'DEVELOPER',
      accessLevel: 3,
      isActive: true,
      description: 'Developer role',
      userCount: 5,
    });

    deactivatedRole = Role.create({
      id: 2,
      name: 'TESTER',
      accessLevel: 2,
      isActive: false,
      description: 'Tester role',
      userCount: 3,
    });
  });

  describe('Role Creation and Validation', () => {
    describe('Valid Role Creation', () => {
      it('should create role with all valid properties', () => {
        const role = Role.create({
          id: 1,
          name: 'MANAGER',
          accessLevel: 4,
          isActive: true,
          description: 'Manager role',
          userCount: 10,
        });

        expect(role.id).toBe(1);
        expect(role.name).toBe('Manager');
        expect(role.getAccessLevel().getValue()).toBe(4);
        expect(role.isActive).toBe(true);
        expect(role.description).toBe('Manager role');
        expect(role.userCount).toBe(10);
      });

      it('should create role with minimum required properties', () => {
        const role = Role.create(
          {
            id: 1,
            name: 'USER',
          },
          true
        ); // Allow system role names

        expect(role.id).toBe(1);
        expect(role.name).toBe('User');
        expect(role.getAccessLevel().getValue()).toBe(5); // default
        expect(role.isActive).toBe(false); // default
        expect(role.description).toBe('No hay descripción para este rol');
        expect(role.userCount).toBe(0);
      });

      it('should handle null description correctly', () => {
        const role = Role.create(
          {
            id: 1,
            name: 'USER',
            description: null,
          },
          true
        ); // Allow system role names

        expect(role.description).toBe('No hay descripción para este rol');
      });
    });

    describe('ID Validation', () => {
      it('should reject non-integer id', () => {
        expect(() => {
          Role.create(
            {
              id: 1.5,
              name: 'USER',
            },
            true
          ); // Allow system role names
        }).toThrow();
      });

      it('should reject negative id', () => {
        expect(() => {
          Role.create(
            {
              id: -1,
              name: 'USER',
            },
            true
          ); // Allow system role names
        }).toThrow();
      });

      it('should reject zero id', () => {
        expect(() => {
          Role.create(
            {
              id: 0,
              name: 'USER',
            },
            true
          ); // Allow system role names
        }).toThrow();
      });

      it('should reject id exceeding MAX_SAFE_INTEGER', () => {
        expect(() => {
          Role.create(
            {
              id: Number.MAX_SAFE_INTEGER + 1,
              name: 'USER',
            },
            true
          ); // Allow system role names
        }).toThrow();
      });
    });

    describe('Name Validation', () => {
      it('should reject reserved role names', () => {
        expect(() => {
          Role.create({
            id: 1,
            name: 'ADMIN',
          });
        }).toThrow();
      });

      it('should reject invalid role name format', () => {
        expect(() => {
          Role.create({
            id: 1,
            name: '', // Empty name should be rejected by RoleName VO
          });
        }).toThrow();
      });

      it('should map field name correctly in validation errors', () => {
        try {
          Role.create({
            id: 1,
            name: 'ADMIN', // Reserved name
          });
          fail('Expected ValidationError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          const validationError = error as ValidationError;
          expect(validationError.errors[0].field).toBe('name');
        }
      });
    });

    describe('Access Level Validation', () => {
      it('should reject invalid access level', () => {
        expect(() => {
          Role.create(
            {
              id: 1,
              name: 'USER',
              accessLevel: 999, // Invalid access level
            },
            true
          ); // Allow system role names
        }).toThrow();
      });

      it('should use default access level when not provided', () => {
        const role = Role.create(
          {
            id: 1,
            name: 'USER',
          },
          true
        ); // Allow system role names

        expect(role.getAccessLevel().getValue()).toBe(5);
      });
    });

    describe('Multiple Validation Errors', () => {
      it('should collect multiple validation errors', () => {
        try {
          Role.create({
            id: -1, // Invalid ID
            name: 'ADMIN', // Reserved name
            accessLevel: 999, // Invalid access level
          });
          fail('Expected ValidationError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          const validationError = error as ValidationError;
          expect(validationError.errors.length).toBeGreaterThan(1);
        }
      });
    });
  });

  describe('Business Rules - Role Activation', () => {
    it('should activate inactive role and emit domain event', () => {
      // Given
      const inactiveRole = Role.create({
        id: 3,
        name: 'ANALYST',
        isActive: false,
      });

      // When
      inactiveRole.activate();

      // Then
      expect(inactiveRole.isActive).toBe(true);
      const events = inactiveRole.getDomainEvents();
      expect(events.length).toBe(1);
      expect(events[0].eventType).toBe(DomainEventType.ROLE_ACTIVATED);
      expect(events[0].aggregateId).toBe('3');
      expect(events[0].eventData['roleId']).toBe(3);
      expect(events[0].eventData['roleName']).toBe('Analyst');
    });

    it('should not emit event when role is already active', () => {
      // When
      validRole.activate(); // Already active

      // Then
      expect(validRole.isActive).toBe(true);
      expect(validRole.getDomainEvents().length).toBe(0);
    });

    it('should maintain role state after activation', () => {
      // Given
      const role = Role.create({
        id: 4,
        name: 'DESIGNER',
        accessLevel: 3,
        isActive: false,
      });

      // When
      role.activate();

      // Then
      expect(role.id).toBe(4);
      expect(role.name).toBe('Designer');
      expect(role.getAccessLevel().getValue()).toBe(3);
      expect(role.isActive).toBe(true);
    });
  });

  describe('Business Rules - Role Deactivation', () => {
    it('should deactivate active role and emit domain event', () => {
      // When
      validRole.deactivate();

      // Then
      expect(validRole.isActive).toBe(false);
      const events = validRole.getDomainEvents();
      expect(events.length).toBe(1);
      expect(events[0].eventType).toBe(DomainEventType.ROLE_DEACTIVATED);
      expect(events[0].aggregateId).toBe('1');
      expect(events[0].eventData['roleId']).toBe(1);
      expect(events[0].eventData['userCount']).toBe(5);
    });

    it('should not emit event when role is already inactive', () => {
      // When
      deactivatedRole.deactivate(); // Already inactive

      // Then
      expect(deactivatedRole.isActive).toBe(false);
      expect(deactivatedRole.getDomainEvents().length).toBe(0);
    });

    it('should include user count in deactivation event', () => {
      // Given
      const roleWithUsers = Role.create({
        id: 5,
        name: 'LEAD',
        userCount: 15,
        isActive: true,
      });

      // When
      roleWithUsers.deactivate();

      // Then
      const event = roleWithUsers.getDomainEvents()[0];
      expect(event.eventData['userCount']).toBe(15);
    });
  });

  describe('Permission Checks', () => {
    it('should delegate user management permission check', () => {
      // These tests verify that the methods exist and delegate correctly
      // The actual business logic is tested in the specifications
      expect(typeof validRole.canManageUsers()).toBe('boolean');
      expect(typeof validRole.canAccessAdmin()).toBe('boolean');
      expect(typeof validRole.canLeadProjects()).toBe('boolean');
    });

    it('should return permissions object', () => {
      const permissions = validRole.getPermissions();
      expect(permissions).toBeDefined();
      expect(typeof permissions).toBe('object');
    });

    it('should check if role is unique for team', () => {
      expect(typeof validRole.isUniqueForTeam()).toBe('boolean');
    });
  });

  describe('Domain Events Management', () => {
    it('should return copy of domain events array', () => {
      // When
      validRole.activate();

      // Then
      const events1 = validRole.getDomainEvents();
      const events2 = validRole.getDomainEvents();
      expect(events1).not.toBe(events2); // Different references
      expect(events1).toEqual(events2); // Same content
    });

    it('should clear domain events', () => {
      // Given - Create a fresh role to ensure no prior events
      const freshRole = Role.create({
        id: 99,
        name: 'FRESH-ROLE',
        isActive: false,
      });
      freshRole.activate(); // Generate an event
      expect(freshRole.getDomainEvents().length).toBe(1);

      // When
      freshRole.clearDomainEvents();

      // Then
      expect(freshRole.getDomainEvents().length).toBe(0);
    });

    it('should accumulate multiple domain events', () => {
      // When
      validRole.deactivate();
      validRole.activate();

      // Then
      const events = validRole.getDomainEvents();
      expect(events.length).toBe(2);
      expect(events[0].eventType).toBe(DomainEventType.ROLE_DEACTIVATED);
      expect(events[1].eventType).toBe(DomainEventType.ROLE_ACTIVATED);
    });
  });

  describe('Entity Properties and Getters', () => {
    it('should expose all required properties', () => {
      expect(validRole.id).toBe(1);
      expect(validRole.name).toBe('Developer');
      expect(validRole.isActive).toBe(true);
      expect(validRole.description).toBe('Developer role');
      expect(validRole.userCount).toBe(5);
    });

    it('should provide access level through getter method', () => {
      const accessLevel = validRole.getAccessLevel();
      expect(accessLevel).toBeInstanceOf(AccessLevel);
      expect(accessLevel.getValue()).toBe(3);
    });

    it('should handle undefined user count', () => {
      const role = Role.create({
        id: 6,
        name: 'INTERN',
      });

      expect(role.userCount).toBe(0);
    });
  });

  describe('Entity Equality', () => {
    it('should be equal to itself', () => {
      expect(validRole.equals(validRole)).toBe(true);
    });

    it('should be equal to role with same id', () => {
      const sameRole = Role.create({
        id: 1,
        name: 'DIFFERENT-NAME',
      });

      expect(validRole.equals(sameRole)).toBe(true);
    });

    it('should not be equal to role with different id', () => {
      const differentRole = Role.create({
        id: 999,
        name: 'DEVELOPER',
      });

      expect(validRole.equals(differentRole)).toBe(false);
    });

    it('should not be equal to null or undefined', () => {
      expect(validRole.equals(null as any)).toBe(false);
      expect(validRole.equals(undefined as any)).toBe(false);
    });
  });

  describe('String Representation', () => {
    it('should provide meaningful string representation', () => {
      const str = validRole.toString();
      expect(str).toContain('Role');
      expect(str).toContain('1');
      expect(str).toContain('Developer'); // Name is normalized to title case
      expect(str).toContain('L3');
      expect(str).toContain('active=true');
    });

    it('should include inactive status in string representation', () => {
      const str = deactivatedRole.toString();
      expect(str).toContain('active=false');
    });
  });

  describe('Domain Invariants and Edge Cases', () => {
    it('should maintain consistent state after multiple operations', () => {
      // Given
      const role = Role.create({
        id: 7,
        name: 'CONSISTENCY-TEST',
        isActive: false,
      });

      // When - Multiple operations
      role.activate();
      role.deactivate();
      role.activate();

      // Then - State should be consistent
      expect(role.isActive).toBe(true);
      expect(role.id).toBe(7);
      expect(role.name).toBe('Consistency Test');

      const events = role.getDomainEvents();
      expect(events.length).toBe(3);
      expect(events[0].eventType).toBe(DomainEventType.ROLE_ACTIVATED);
      expect(events[1].eventType).toBe(DomainEventType.ROLE_DEACTIVATED);
      expect(events[2].eventType).toBe(DomainEventType.ROLE_ACTIVATED);
    });

    it('should handle role with maximum user count', () => {
      const role = Role.create({
        id: 8,
        name: 'POPULAR-ROLE',
        userCount: Number.MAX_SAFE_INTEGER,
      });

      expect(role.userCount).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should handle role with very long description', () => {
      const longDescription = 'A'.repeat(1000);
      const role = Role.create({
        id: 9,
        name: 'LONG-DESC-ROLE',
        description: longDescription,
      });

      expect(role.description).toBe(longDescription);
    });
  });

  describe('Business Constants Validation', () => {
    it('should maintain business rules consistency', () => {
      // Test that business rules don't change unexpectedly
      const role1 = Role.create({ id: 10, name: 'CONSISTENT-ONE' });
      const role2 = Role.create({ id: 11, name: 'CONSISTENT-TWO' });

      expect(role1.getAccessLevel().getValue()).toBe(5); // Default
      expect(role2.getAccessLevel().getValue()).toBe(5); // Default
    });

    it('should handle boundary values correctly', () => {
      // Test with maximum valid ID
      const role = Role.create({
        id: Number.MAX_SAFE_INTEGER,
        name: 'MAX-ID-ROLE',
      });

      expect(role.id).toBe(Number.MAX_SAFE_INTEGER);
    });
  });
});
