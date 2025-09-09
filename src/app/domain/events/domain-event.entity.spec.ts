import { DomainEvent } from './domain-event.entity';
import { DomainEventType, DomainEventSeverity } from './domain-event.enum';
import { ISODateTime } from '@domain/value-objects/iso-datetime.vo';
import { ValidationError } from '@domain/errors/validation-error.entity';

/**
 * Domain Layer Test - DomainEvent Entity
 *
 * Tests pure business logic without external dependencies.
 * Validates domain invariants, business rules, and event categorization.
 */
describe('DomainEvent - Domain Tests', () => {
  // Test data constants
  const validEventId = 'event-123';
  const validAggregateId = 'user-456';
  const validAggregateType = 'User';
  const validEventData = { userId: 'user-456', email: 'test@example.com' };
  const validCausedByUserId = 'user-789';

  describe('Business Rules - Event Severity Determination', () => {
    it('should determine CRITICAL severity for security violations', () => {
      const severity = DomainEvent.determineSeverity(DomainEventType.SECURITY_VIOLATION_DETECTED);
      expect(severity).toBe(DomainEventSeverity.CRITICAL);
    });

    it('should determine CRITICAL severity for unauthorized access attempts', () => {
      const severity = DomainEvent.determineSeverity(DomainEventType.UNAUTHORIZED_ACCESS_ATTEMPTED);
      expect(severity).toBe(DomainEventSeverity.CRITICAL);
    });

    it('should determine HIGH severity for authentication failures', () => {
      const severity = DomainEvent.determineSeverity(DomainEventType.USER_AUTHENTICATION_FAILED);
      expect(severity).toBe(DomainEventSeverity.HIGH);
    });

    it('should determine HIGH severity for account deactivation', () => {
      const severity = DomainEvent.determineSeverity(DomainEventType.USER_ACCOUNT_DEACTIVATED);
      expect(severity).toBe(DomainEventSeverity.HIGH);
    });

    it('should determine HIGH severity for password updates', () => {
      const severity = DomainEvent.determineSeverity(DomainEventType.USER_PASSWORD_UPDATED);
      expect(severity).toBe(DomainEventSeverity.HIGH);
    });

    it('should determine MEDIUM severity for role changes', () => {
      const severity = DomainEvent.determineSeverity(DomainEventType.USER_ROLE_CHANGED);
      expect(severity).toBe(DomainEventSeverity.MEDIUM);
    });

    it('should determine MEDIUM severity for profile modifications', () => {
      const severity = DomainEvent.determineSeverity(DomainEventType.USER_PROFILE_MODIFIED);
      expect(severity).toBe(DomainEventSeverity.MEDIUM);
    });

    it('should determine MEDIUM severity for account activation', () => {
      const severity = DomainEvent.determineSeverity(DomainEventType.USER_ACCOUNT_ACTIVATED);
      expect(severity).toBe(DomainEventSeverity.MEDIUM);
    });

    it('should determine MEDIUM severity for logout events', () => {
      const severity = DomainEvent.determineSeverity(DomainEventType.USER_LOGGED_OUT);
      expect(severity).toBe(DomainEventSeverity.MEDIUM);
    });

    it('should determine MEDIUM severity for session expiration', () => {
      const severity = DomainEvent.determineSeverity(DomainEventType.USER_SESSION_EXPIRED);
      expect(severity).toBe(DomainEventSeverity.MEDIUM);
    });

    it('should determine MEDIUM severity for notification dismissal', () => {
      const severity = DomainEvent.determineSeverity(DomainEventType.NOTIFICATION_DISMISSED);
      expect(severity).toBe(DomainEventSeverity.MEDIUM);
    });

    it('should determine MEDIUM severity for notifications clearing', () => {
      const severity = DomainEvent.determineSeverity(DomainEventType.NOTIFICATIONS_CLEARED);
      expect(severity).toBe(DomainEventSeverity.MEDIUM);
    });

    it('should determine LOW severity for other events', () => {
      const severity = DomainEvent.determineSeverity(DomainEventType.USER_CREATED);
      expect(severity).toBe(DomainEventSeverity.LOW);
    });
  });

  describe('Business Rules - Event Categorization', () => {
    it('should identify security-related events correctly', () => {
      const event = DomainEvent.create({
        id: validEventId,
        eventType: DomainEventType.SECURITY_VIOLATION_DETECTED,
        aggregateId: validAggregateId,
        aggregateType: validAggregateType,
        eventData: validEventData,
      });

      expect(event.isSecurityEvent()).toBe(true);
    });

    it('should identify non-security events correctly', () => {
      const event = DomainEvent.create({
        id: validEventId,
        eventType: DomainEventType.USER_CREATED,
        aggregateId: validAggregateId,
        aggregateType: validAggregateType,
        eventData: validEventData,
      });

      expect(event.isSecurityEvent()).toBe(false);
    });

    it('should identify user account events correctly', () => {
      const event = DomainEvent.create({
        id: validEventId,
        eventType: DomainEventType.USER_ROLE_CHANGED,
        aggregateId: validAggregateId,
        aggregateType: validAggregateType,
        eventData: validEventData,
      });

      expect(event.isUserAccountEvent()).toBe(true);
    });

    it('should identify non-user account events correctly', () => {
      const event = DomainEvent.create({
        id: validEventId,
        eventType: DomainEventType.SECURITY_VIOLATION_DETECTED,
        aggregateId: validAggregateId,
        aggregateType: validAggregateType,
        eventData: validEventData,
      });

      expect(event.isUserAccountEvent()).toBe(false);
    });

    it('should identify events requiring audit trail', () => {
      const event = DomainEvent.create({
        id: validEventId,
        eventType: DomainEventType.USER_ROLE_CHANGED,
        aggregateId: validAggregateId,
        aggregateType: validAggregateType,
        eventData: validEventData,
      });

      expect(event.requiresAuditTrail()).toBe(true);
    });

    it('should identify events not requiring audit trail', () => {
      const event = DomainEvent.create({
        id: validEventId,
        eventType: DomainEventType.USER_CREATED,
        aggregateId: validAggregateId,
        aggregateType: validAggregateType,
        eventData: validEventData,
      });

      expect(event.requiresAuditTrail()).toBe(false);
    });

    it('should identify events affecting user permissions', () => {
      const event = DomainEvent.create({
        id: validEventId,
        eventType: DomainEventType.USER_ROLE_CHANGED,
        aggregateId: validAggregateId,
        aggregateType: validAggregateType,
        eventData: validEventData,
      });

      expect(event.affectsUserPermissions()).toBe(true);
    });

    it('should identify events not affecting user permissions', () => {
      const event = DomainEvent.create({
        id: validEventId,
        eventType: DomainEventType.USER_CREATED,
        aggregateId: validAggregateId,
        aggregateType: validAggregateType,
        eventData: validEventData,
      });

      expect(event.affectsUserPermissions()).toBe(false);
    });
  });

  describe('Value Object Creation - DomainEvent Creation', () => {
    it('should create valid domain event with all required fields', () => {
      const event = DomainEvent.create({
        id: validEventId,
        eventType: DomainEventType.USER_CREATED,
        aggregateId: validAggregateId,
        aggregateType: validAggregateType,
        eventData: validEventData,
        causedByUserId: validCausedByUserId,
      });

      expect(event).toBeInstanceOf(DomainEvent);
      expect(event.id).toBe(validEventId);
      expect(event.eventType).toBe(DomainEventType.USER_CREATED);
      expect(event.aggregateId).toBe(validAggregateId);
      expect(event.aggregateType).toBe(validAggregateType);
      expect(event.causedByUserId).toBe(validCausedByUserId);
    });

    it('should create valid domain event with minimal required fields', () => {
      const event = DomainEvent.create({
        id: validEventId,
        eventType: DomainEventType.USER_CREATED,
        aggregateId: validAggregateId,
        aggregateType: validAggregateType,
        eventData: validEventData,
      });

      expect(event).toBeInstanceOf(DomainEvent);
      expect(event.causedByUserId).toBeUndefined();
    });

    it('should auto-generate occurredAt timestamp when not provided', () => {
      const event = DomainEvent.create({
        id: validEventId,
        eventType: DomainEventType.USER_CREATED,
        aggregateId: validAggregateId,
        aggregateType: validAggregateType,
        eventData: validEventData,
      });

      expect(event.occurredAt).toBeInstanceOf(ISODateTime);
    });

    it('should use provided occurredAt timestamp', () => {
      const customDateTime = ISODateTime.create('2024-01-15T10:30:00Z')!;
      const event = DomainEvent.create({
        id: validEventId,
        eventType: DomainEventType.USER_CREATED,
        aggregateId: validAggregateId,
        aggregateType: validAggregateType,
        eventData: validEventData,
        occurredAt: customDateTime,
      });

      expect(event.occurredAt).toBe(customDateTime);
    });

    it('should trim whitespace from string fields', () => {
      const event = DomainEvent.create({
        id: `  ${validEventId}  `,
        eventType: DomainEventType.USER_CREATED,
        aggregateId: `  ${validAggregateId}  `,
        aggregateType: `  ${validAggregateType}  `,
        eventData: validEventData,
        causedByUserId: `  ${validCausedByUserId}  `,
      });

      expect(event.id).toBe(validEventId);
      expect(event.aggregateId).toBe(validAggregateId);
      expect(event.aggregateType).toBe(validAggregateType);
      expect(event.causedByUserId).toBe(validCausedByUserId); // Should trim whitespace for consistency
    });

    it('should reject creation with empty id', () => {
      expect(() => {
        DomainEvent.create({
          id: '',
          eventType: DomainEventType.USER_CREATED,
          aggregateId: validAggregateId,
          aggregateType: validAggregateType,
          eventData: validEventData,
        });
      }).toThrow();
    });

    it('should reject creation with whitespace-only id', () => {
      expect(() => {
        DomainEvent.create({
          id: '   ',
          eventType: DomainEventType.USER_CREATED,
          aggregateId: validAggregateId,
          aggregateType: validAggregateType,
          eventData: validEventData,
        });
      }).toThrow();
    });

    it('should reject creation with null id', () => {
      try {
        DomainEvent.create({
          id: null as unknown as string,
          eventType: DomainEventType.USER_CREATED,
          aggregateId: validAggregateId,
          aggregateType: validAggregateType,
          eventData: validEventData,
        });
        fail('Expected ValidationError to be thrown');
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toContain('Domain event ID is required');
      }
    });

    it('should reject creation with empty aggregateId', () => {
      expect(() => {
        DomainEvent.create({
          id: validEventId,
          eventType: DomainEventType.USER_CREATED,
          aggregateId: '',
          aggregateType: validAggregateType,
          eventData: validEventData,
        });
      }).toThrow();
    });

    it('should reject creation with empty aggregateType', () => {
      expect(() => {
        DomainEvent.create({
          id: validEventId,
          eventType: DomainEventType.USER_CREATED,
          aggregateId: validAggregateId,
          aggregateType: '',
          eventData: validEventData,
        });
      }).toThrow();
    });

    it('should handle empty eventData gracefully', () => {
      const event = DomainEvent.create({
        id: validEventId,
        eventType: DomainEventType.USER_CREATED,
        aggregateId: validAggregateId,
        aggregateType: validAggregateType,
        eventData: {},
      });

      expect(event.eventData).toEqual({});
    });

    it('should handle null eventData gracefully', () => {
      const event = DomainEvent.create({
        id: validEventId,
        eventType: DomainEventType.USER_CREATED,
        aggregateId: validAggregateId,
        aggregateType: validAggregateType,
        eventData: null as unknown as Record<string, unknown>,
      });

      expect(event.eventData).toEqual({});
    });
  });

  describe('Domain Logic - Event Data Retrieval', () => {
    it('should return typed event data for matching aggregate type', () => {
      const event = DomainEvent.create({
        id: validEventId,
        eventType: DomainEventType.USER_CREATED,
        aggregateId: validAggregateId,
        aggregateType: validAggregateType,
        eventData: validEventData,
      });

      const userData = event.getEventDataFor<{ userId: string; email: string }>('User');
      expect(userData).toEqual(validEventData);
    });

    it('should return null for non-matching aggregate type', () => {
      const event = DomainEvent.create({
        id: validEventId,
        eventType: DomainEventType.USER_CREATED,
        aggregateId: validAggregateId,
        aggregateType: validAggregateType,
        eventData: validEventData,
      });

      const roleData = event.getEventDataFor<unknown>('Role');
      expect(roleData).toBeNull();
    });

    it('should return immutable copy of event data', () => {
      const event = DomainEvent.create({
        id: validEventId,
        eventType: DomainEventType.USER_CREATED,
        aggregateId: validAggregateId,
        aggregateType: validAggregateType,
        eventData: validEventData,
      });

      const retrievedData = event.eventData;
      retrievedData['modified'] = true;

      expect(event.eventData['modified']).toBeUndefined();
    });
  });

  describe('Entity Equality - Domain Invariants', () => {
    it('should return true for events with same id', () => {
      const event1 = DomainEvent.create({
        id: validEventId,
        eventType: DomainEventType.USER_CREATED,
        aggregateId: validAggregateId,
        aggregateType: validAggregateType,
        eventData: validEventData,
      });

      const event2 = DomainEvent.create({
        id: validEventId,
        eventType: DomainEventType.USER_ROLE_CHANGED,
        aggregateId: 'different-aggregate',
        aggregateType: 'DifferentType',
        eventData: { different: 'data' },
      });

      expect(event1.equals(event2)).toBe(true);
    });

    it('should return false for events with different ids', () => {
      const event1 = DomainEvent.create({
        id: validEventId,
        eventType: DomainEventType.USER_CREATED,
        aggregateId: validAggregateId,
        aggregateType: validAggregateType,
        eventData: validEventData,
      });

      const event2 = DomainEvent.create({
        id: 'different-id',
        eventType: DomainEventType.USER_CREATED,
        aggregateId: validAggregateId,
        aggregateType: validAggregateType,
        eventData: validEventData,
      });

      expect(event1.equals(event2)).toBe(false);
    });

    it('should handle null and undefined other event gracefully', () => {
      const event = DomainEvent.create({
        id: validEventId,
        eventType: DomainEventType.USER_CREATED,
        aggregateId: validAggregateId,
        aggregateType: validAggregateType,
        eventData: validEventData,
      });

      // Pass null and undefined directly to test edge case handling
      expect(event.equals(null as unknown as DomainEvent)).toBe(false);
      expect(event.equals(undefined as unknown as DomainEvent)).toBe(false);
    });
  });

  describe('String Representation - Domain Invariants', () => {
    it('should provide meaningful string representation', () => {
      const event = DomainEvent.create({
        id: validEventId,
        eventType: DomainEventType.USER_CREATED,
        aggregateId: validAggregateId,
        aggregateType: validAggregateType,
        eventData: validEventData,
      });

      const stringRep = event.toString();
      expect(stringRep).toContain(validEventId);
      expect(stringRep).toContain(DomainEventType.USER_CREATED);
      expect(stringRep).toContain(validAggregateType);
      expect(stringRep).toContain(validAggregateId);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle undefined causedByUserId', () => {
      const event = DomainEvent.create({
        id: validEventId,
        eventType: DomainEventType.USER_CREATED,
        aggregateId: validAggregateId,
        aggregateType: validAggregateType,
        eventData: validEventData,
        causedByUserId: undefined,
      });

      expect(event.causedByUserId).toBeUndefined();
    });

    it('should handle empty string causedByUserId', () => {
      const event = DomainEvent.create({
        id: validEventId,
        eventType: DomainEventType.USER_CREATED,
        aggregateId: validAggregateId,
        aggregateType: validAggregateType,
        eventData: validEventData,
        causedByUserId: '',
      });

      expect(event.causedByUserId).toBe('');
    });

    it('should handle whitespace-only causedByUserId', () => {
      const event = DomainEvent.create({
        id: validEventId,
        eventType: DomainEventType.USER_CREATED,
        aggregateId: validAggregateId,
        aggregateType: validAggregateType,
        eventData: validEventData,
        causedByUserId: '   ',
      });

      expect(event.causedByUserId).toBe(''); // Whitespace-only strings become empty after trim
    });

    it('should handle complex event data structures', () => {
      const complexData = {
        user: { id: 'user-123', name: 'John Doe' },
        metadata: { source: 'web', timestamp: '2024-01-15T10:30:00Z' },
        permissions: ['read', 'write', 'admin'],
        nested: { deep: { value: 42 } },
      };

      const event = DomainEvent.create({
        id: validEventId,
        eventType: DomainEventType.USER_CREATED,
        aggregateId: validAggregateId,
        aggregateType: validAggregateType,
        eventData: complexData,
      });

      expect(event.eventData).toEqual(complexData);
    });

    it('should maintain immutability of event data', () => {
      const originalData = { count: 5, items: ['a', 'b'] };
      const event = DomainEvent.create({
        id: validEventId,
        eventType: DomainEventType.USER_CREATED,
        aggregateId: validAggregateId,
        aggregateType: validAggregateType,
        eventData: originalData,
      });

      // Modify the original data
      originalData.count = 10;
      originalData.items.push('c');

      // Event data should remain unchanged
      expect(event.eventData['count']).toBe(5);
      expect(event.eventData['items']).toEqual(['a', 'b']);
    });
  });

  describe('Domain Invariants - Data Integrity', () => {
    it('should maintain consistent severity assignment', () => {
      const event = DomainEvent.create({
        id: validEventId,
        eventType: DomainEventType.SECURITY_VIOLATION_DETECTED,
        aggregateId: validAggregateId,
        aggregateType: validAggregateType,
        eventData: validEventData,
      });

      expect(event.severity).toBe(DomainEventSeverity.CRITICAL);
    });

    it('should ensure occurredAt is always ISODateTime instance', () => {
      const event = DomainEvent.create({
        id: validEventId,
        eventType: DomainEventType.USER_CREATED,
        aggregateId: validAggregateId,
        aggregateType: validAggregateType,
        eventData: validEventData,
      });

      expect(event.occurredAt).toBeInstanceOf(ISODateTime);
    });

    it('should ensure all required fields are immutable', () => {
      const event = DomainEvent.create({
        id: validEventId,
        eventType: DomainEventType.USER_CREATED,
        aggregateId: validAggregateId,
        aggregateType: validAggregateType,
        eventData: validEventData,
      });

      // Attempt to mutate public fields (should throw TypeError for read-only properties)
      expect(() => {
        (event as unknown as { id: string }).id = 'modified';
      }).toThrowError(TypeError);
      expect(() => {
        (event as unknown as { eventType: string }).eventType = 'MODIFIED_TYPE';
      }).toThrowError(TypeError);
      expect(() => {
        (event as unknown as { aggregateId: string }).aggregateId = 'modified-aggregate';
      }).toThrowError(TypeError);
      expect(() => {
        (event as unknown as { aggregateType: string }).aggregateType = 'ModifiedType';
      }).toThrowError(TypeError);

      // Verify values remain unchanged
      expect(event.id).toBe(validEventId);
      expect(event.eventType).toBe(DomainEventType.USER_CREATED);
      expect(event.aggregateId).toBe(validAggregateId);
      expect(event.aggregateType).toBe(validAggregateType);
    });
  });
});
