/**
 * @fileoverview Role Domain Events - Domain Layer
 *
 * @description Defines specific domain events for role operations
 * following Domain-Driven Design principles. These events represent business
 * facts that occurred in the role domain.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 *
 * @responsibility Role domain events
 * @architecture Domain Layer - Domain Events
 */

import { DomainEvent } from './domain-event.entity';
import { DomainEventType } from './domain-event.enum';
import { ISODateTime } from '../value-objects/iso-datetime.vo';

/**
 * Event representing a role modification action
 *
 * This event is published when a role is successfully modified.
 * It captures the business fact that a role's properties were changed.
 */
export class RoleModifiedEvent {
  private constructor(private readonly domainEvent: DomainEvent) {}

  /**
   * Create a new RoleModifiedEvent
   *
   * @param props - Properties for the role modification event
   * @returns A new RoleModifiedEvent instance
   *
   * @example
   * ```typescript
   * const event = RoleModifiedEvent.create({
   *   roleId: 123,
   *   modifiedBy: 456,
   *   changes: { name: 'New Name', accessLevel: 5 }
   * });
   * ```
   */
  static create(props: {
    roleId: number;
    modifiedBy: number;
    changes: Record<string, any>;
    previousValues?: Record<string, any>;
  }): RoleModifiedEvent {
    const eventId = `role-modified-${props.roleId}-${Date.now()}`;

    const domainEvent = DomainEvent.create({
      id: eventId,
      eventType: DomainEventType.ROLE_MODIFIED,
      aggregateId: props.roleId.toString(),
      aggregateType: 'Role',
      eventData: {
        changes: props.changes,
        previousValues: props.previousValues,
        timestamp: ISODateTime.now().value,
        eventType: 'ROLE_MODIFIED',
      },
      causedByUserId: props.modifiedBy.toString(),
    });

    return new RoleModifiedEvent(domainEvent);
  }

  /**
   * Get the underlying domain event
   */
  get event(): DomainEvent {
    return this.domainEvent;
  }

  /**
   * Get the changes made to the role
   */
  get changes(): Record<string, any> {
    return this.domainEvent.eventData['changes'] as Record<string, any>;
  }

  /**
   * Get the previous values of the modified properties
   */
  get previousValues(): Record<string, any> | undefined {
    return this.domainEvent.eventData['previousValues'] as Record<string, any>;
  }

  /**
   * Check if a specific property was modified
   */
  wasPropertyModified(property: string): boolean {
    return property in this.changes;
  }

  /**
   * Get the new value of a modified property
   */
  getNewValue(property: string): any {
    return this.changes[property];
  }

  /**
   * Get the previous value of a modified property
   */
  getPreviousValue(property: string): any {
    return this.previousValues?.[property];
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

  get causedByUserId(): string | undefined {
    return this.domainEvent.causedByUserId;
  }
}

/**
 * Event representing a role activation action
 *
 * This event is published when a role is successfully activated.
 * It captures the business fact that a role's active status was changed to true.
 */
export class RoleActivatedEvent {
  private constructor(private readonly domainEvent: DomainEvent) {}

  /**
   * Create a new RoleActivatedEvent
   *
   * @param props - Properties for the role activation event
   * @returns A new RoleActivatedEvent instance
   *
   * @example
   * ```typescript
   * const event = RoleActivatedEvent.create({
   *   roleId: 123,
   *   activatedBy: 456,
   *   previousState: false,
   *   newState: true
   * });
   * ```
   */
  static create(props: {
    roleId: number;
    activatedBy: number;
    previousState: boolean;
    newState: boolean;
  }): RoleActivatedEvent {
    const eventId = `role-activated-${props.roleId}-${Date.now()}`;

    const domainEvent = DomainEvent.create({
      id: eventId,
      eventType: DomainEventType.ROLE_ACTIVATED,
      aggregateId: props.roleId.toString(),
      aggregateType: 'Role',
      eventData: {
        previousState: props.previousState,
        newState: props.newState,
        timestamp: ISODateTime.now().value,
        eventType: 'ROLE_ACTIVATED',
      },
      causedByUserId: props.activatedBy.toString(),
    });

    return new RoleActivatedEvent(domainEvent);
  }

  /**
   * Get the underlying domain event
   */
  get event(): DomainEvent {
    return this.domainEvent;
  }

  /**
   * Get the previous active state
   */
  get previousState(): boolean {
    return this.domainEvent.eventData['previousState'] as boolean;
  }

  /**
   * Get the new active state
   */
  get newState(): boolean {
    return this.domainEvent.eventData['newState'] as boolean;
  }

  /**
   * Check if this was a successful activation
   */
  isSuccessfulActivation(): boolean {
    return !this.previousState && this.newState;
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

  get causedByUserId(): string | undefined {
    return this.domainEvent.causedByUserId;
  }
}

/**
 * Event representing a role deactivation action
 *
 * This event is published when a role is successfully deactivated.
 * It captures the business fact that a role's active status was changed to false.
 */
export class RoleDeactivatedEvent {
  private constructor(private readonly domainEvent: DomainEvent) {}

  /**
   * Create a new RoleDeactivatedEvent
   *
   * @param props - Properties for the role deactivation event
   * @returns A new RoleDeactivatedEvent instance
   *
   * @example
   * ```typescript
   * const event = RoleDeactivatedEvent.create({
   *   roleId: 123,
   *   deactivatedBy: 456,
   *   previousState: true,
   *   newState: false
   * });
   * ```
   */
  static create(props: {
    roleId: number;
    deactivatedBy: number;
    previousState: boolean;
    newState: boolean;
  }): RoleDeactivatedEvent {
    const eventId = `role-deactivated-${props.roleId}-${Date.now()}`;

    const domainEvent = DomainEvent.create({
      id: eventId,
      eventType: DomainEventType.ROLE_DEACTIVATED,
      aggregateId: props.roleId.toString(),
      aggregateType: 'Role',
      eventData: {
        previousState: props.previousState,
        newState: props.newState,
        timestamp: ISODateTime.now().value,
        eventType: 'ROLE_DEACTIVATED',
      },
      causedByUserId: props.deactivatedBy.toString(),
    });

    return new RoleDeactivatedEvent(domainEvent);
  }

  /**
   * Get the underlying domain event
   */
  get event(): DomainEvent {
    return this.domainEvent;
  }

  /**
   * Get the previous active state
   */
  get previousState(): boolean {
    return this.domainEvent.eventData['previousState'] as boolean;
  }

  /**
   * Get the new active state
   */
  get newState(): boolean {
    return this.domainEvent.eventData['newState'] as boolean;
  }

  /**
   * Check if this was a successful deactivation
   */
  isSuccessfulDeactivation(): boolean {
    return this.previousState && !this.newState;
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

  get causedByUserId(): string | undefined {
    return this.domainEvent.causedByUserId;
  }
}
