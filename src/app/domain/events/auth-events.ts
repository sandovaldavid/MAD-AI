/**
 * @fileoverview Authentication Domain Events - Domain Layer
 *
 * @description Defines specific domain events for authentication operations
 * following Domain-Driven Design principles. These events represent business
 * facts that occurred in the authentication domain.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 *
 * @responsibility Authentication domain events
 * @architecture Domain Layer - Domain Events
 */

import { DomainEvent } from './domain-event.entity';
import { DomainEventType } from './domain-event.enum';
import { ISODateTime } from '../value-objects/iso-datetime.vo';

/**
 * Event representing a user logout action
 *
 * This event is published when a user successfully logs out of the system.
 * It captures the business fact that a user session was terminated by the user.
 */
export class UserLoggedOutEvent {
  private constructor(private readonly domainEvent: DomainEvent) {}

  /**
   * Create a new UserLoggedOutEvent
   *
   * @param props - Properties for the logout event
   * @returns A new UserLoggedOutEvent instance
   *
   * @example
   * ```typescript
   * const event = UserLoggedOutEvent.create({
   *   userId: 123,
   *   reason: 'user_requested',
   *   sessionId: 'session-456'
   * });
   * ```
   */
  static create(props: { userId: number; reason: string; sessionId?: string }): UserLoggedOutEvent {
    const eventId = `logout-${props.userId}-${Date.now()}`;

    const domainEvent = DomainEvent.create({
      id: eventId,
      eventType: DomainEventType.SESSION_TERMINATED,
      aggregateId: props.userId.toString(),
      aggregateType: 'User',
      eventData: {
        reason: props.reason,
        sessionId: props.sessionId,
        timestamp: ISODateTime.now().value,
        eventType: 'USER_LOGOUT',
      },
      causedByUserId: props.userId.toString(),
    });

    return new UserLoggedOutEvent(domainEvent);
  }

  /**
   * Get the underlying domain event
   */
  get event(): DomainEvent {
    return this.domainEvent;
  }

  /**
   * Get the logout reason
   */
  get logoutReason(): string {
    return this.domainEvent.eventData['reason'] as string;
  }

  /**
   * Get the session ID if available
   */
  get sessionId(): string | undefined {
    return this.domainEvent.eventData['sessionId'] as string;
  }

  /**
   * Check if this was a user-initiated logout
   */
  isUserInitiated(): boolean {
    return this.logoutReason === 'user_requested';
  }

  /**
   * Check if this was a system-initiated logout
   */
  isSystemInitiated(): boolean {
    return ['session_expired', 'security_violation', 'admin_action'].includes(this.logoutReason);
  }

  /**
   * Delegate other properties to the underlying domain event
   */
  get id(): string {
    return this.domainEvent.id;
  }

  get eventType(): DomainEventType {
    return this.domainEvent.eventType;
  }

  get aggregateId(): string {
    return this.domainEvent.aggregateId;
  }

  get aggregateType(): string {
    return this.domainEvent.aggregateType;
  }

  get occurredAt(): ISODateTime {
    return this.domainEvent.occurredAt;
  }

  get severity() {
    return this.domainEvent.severity;
  }

  get eventData(): Record<string, unknown> {
    return this.domainEvent.eventData;
  }

  get causedByUserId(): string | undefined {
    return this.domainEvent.causedByUserId;
  }
}
