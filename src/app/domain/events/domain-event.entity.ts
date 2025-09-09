/**
 * Pure Domain Events - Business Events Only
 *
 * These represent things that happened in the business domain,
 * without any concern for how they will be presented or delivered.
 */

import { ISODateTime } from '@domain/value-objects/iso-datetime.vo';
import { ValidationError } from '@domain/errors/validation-error.entity';
import { ValidationErrorCode } from '@domain/errors/validation-error-code.enum';
import type { FieldError } from '@domain/errors/field-error.type';
import { DomainEventType, DomainEventSeverity } from './domain-event.enum';

/**
 * Pure Domain Event - Represents a business event that occurred
 *
 * This is focused ONLY on what happened in the business domain,
 * without any concern for presentation, delivery, or UI.
 */
export class DomainEvent {
  private constructor(
    private readonly _id: string,
    private readonly _eventType: DomainEventType,
    private readonly _aggregateId: string,
    private readonly _aggregateType: string,
    private readonly _occurredAt: ISODateTime,
    private readonly _severity: DomainEventSeverity,
    private readonly _eventData: Record<string, unknown>,
    private readonly _causedByUserId?: string
  ) {}

  static create(props: {
    id: string;
    eventType: DomainEventType;
    aggregateId: string;
    aggregateType: string;
    eventData: Record<string, unknown>;
    causedByUserId?: string;
    occurredAt?: ISODateTime;
  }): DomainEvent {
    const errors: FieldError[] = [];

    if (!props.id || !props.id.trim()) {
      errors.push({
        field: 'id',
        value: props.id,
        message: 'Domain event ID is required',
        code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
      });
    }

    if (!props.aggregateId || !props.aggregateId.trim()) {
      errors.push({
        field: 'aggregateId',
        value: props.aggregateId,
        message: 'Aggregate ID is required',
        code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
      });
    }

    if (!props.aggregateType || !props.aggregateType.trim()) {
      errors.push({
        field: 'aggregateType',
        value: props.aggregateType,
        message: 'Aggregate type is required',
        code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
      });
    }

    if (errors.length > 0) {
      throw ValidationError.createFromFields(errors, ValidationErrorCode.VALIDATION_ERROR);
    }

    const occurredAt = props.occurredAt || ISODateTime.create(new Date().toISOString())!;
    const severity = DomainEvent.determineSeverity(props.eventType);

    let normalizedCausedByUserId: string | undefined;
    if (typeof props.causedByUserId === 'string') {
      const trimmed = props.causedByUserId.trim();
      normalizedCausedByUserId = trimmed.length > 0 ? trimmed : '';
    } else {
      normalizedCausedByUserId = undefined;
    }
    // Deep clone eventData to ensure immutability
    function deepClone<T>(obj: T): T {
      if (obj === null || typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) {
        return obj.map(deepClone) as T;
      }
      const cloned: Record<string, unknown> = {};
      for (const key in obj as Record<string, unknown>) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          cloned[key] = deepClone((obj as Record<string, unknown>)[key]);
        }
      }
      return cloned as T;
    }
    const eventDataClone = deepClone<Record<string, unknown>>(props.eventData || {});
    return new DomainEvent(
      props.id.trim(),
      props.eventType,
      props.aggregateId.trim(),
      props.aggregateType.trim(),
      occurredAt,
      severity,
      eventDataClone,
      normalizedCausedByUserId
    );
  }

  /**
   * Business logic: Determine event severity based on type
   */
  static determineSeverity(eventType: DomainEventType): DomainEventSeverity {
    switch (eventType) {
      case DomainEventType.SECURITY_VIOLATION_DETECTED:
      case DomainEventType.UNAUTHORIZED_ACCESS_ATTEMPTED:
        return DomainEventSeverity.CRITICAL;

      case DomainEventType.USER_AUTHENTICATION_FAILED:
      case DomainEventType.USER_ACCOUNT_DEACTIVATED:
      case DomainEventType.USER_PASSWORD_UPDATED:
        return DomainEventSeverity.HIGH;

      case DomainEventType.USER_ROLE_CHANGED:
      case DomainEventType.USER_PROFILE_MODIFIED:
      case DomainEventType.USER_ACCOUNT_ACTIVATED:
      case DomainEventType.USER_LOGGED_OUT:
      case DomainEventType.USER_SESSION_EXPIRED:
      case DomainEventType.NOTIFICATION_DISMISSED:
      case DomainEventType.NOTIFICATIONS_CLEARED:
        return DomainEventSeverity.MEDIUM;

      default:
        return DomainEventSeverity.LOW;
    }
  }

  /**
   * Business logic: Check if this is a security-related event
   */
  isSecurityEvent(): boolean {
    return [
      DomainEventType.SECURITY_VIOLATION_DETECTED,
      DomainEventType.UNAUTHORIZED_ACCESS_ATTEMPTED,
      DomainEventType.USER_AUTHENTICATION_FAILED,
      DomainEventType.USER_PASSWORD_UPDATED,
    ].includes(this._eventType);
  }

  /**
   * Business logic: Check if this is a user account event
   */
  isUserAccountEvent(): boolean {
    return [
      DomainEventType.USER_CREATED,
      DomainEventType.USER_AUTHENTICATED,
      DomainEventType.USER_PROFILE_MODIFIED,
      DomainEventType.USER_EMAIL_VERIFIED,
      DomainEventType.USER_ACCOUNT_ACTIVATED,
      DomainEventType.USER_ACCOUNT_DEACTIVATED,
      DomainEventType.USER_ROLE_CHANGED,
      DomainEventType.USER_LOGGED_OUT,
      DomainEventType.USER_SESSION_EXPIRED,
      DomainEventType.NOTIFICATION_DISMISSED,
      DomainEventType.NOTIFICATIONS_CLEARED,
    ].includes(this._eventType);
  }

  /**
   * Business logic: Check if event requires audit trail
   */
  requiresAuditTrail(): boolean {
    return [
      DomainEventType.SECURITY_VIOLATION_DETECTED,
      DomainEventType.UNAUTHORIZED_ACCESS_ATTEMPTED,
      DomainEventType.USER_ROLE_CHANGED,
      DomainEventType.USER_ACCOUNT_ACTIVATED,
      DomainEventType.USER_ACCOUNT_DEACTIVATED,
      DomainEventType.USER_PASSWORD_UPDATED,
      DomainEventType.USER_LOGGED_OUT,
      DomainEventType.USER_SESSION_EXPIRED,
    ].includes(this._eventType);
  }

  /**
   * Business logic: Check if event affects user permissions
   */
  affectsUserPermissions(): boolean {
    return [
      DomainEventType.USER_ROLE_CHANGED,
      DomainEventType.USER_ACCOUNT_ACTIVATED,
      DomainEventType.USER_ACCOUNT_DEACTIVATED,
    ].includes(this._eventType);
  }

  // Getters for domain data
  get id(): string {
    return this._id;
  }

  get eventType(): DomainEventType {
    return this._eventType;
  }

  get aggregateId(): string {
    return this._aggregateId;
  }

  get aggregateType(): string {
    return this._aggregateType;
  }

  get occurredAt(): ISODateTime {
    return this._occurredAt;
  }

  get severity(): DomainEventSeverity {
    return this._severity;
  }

  get eventData(): Record<string, unknown> {
    // Deep clone to prevent mutation of nested objects/arrays
    function deepClone<T>(obj: T): T {
      if (obj === null || typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) {
        return obj.map(deepClone) as T;
      }
      const cloned: Record<string, unknown> = {};
      for (const key in obj as Record<string, unknown>) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          cloned[key] = deepClone((obj as Record<string, unknown>)[key]);
        }
      }
      return cloned as T;
    }
    return deepClone<Record<string, unknown>>(this._eventData);
  }

  get causedByUserId(): string | undefined {
    return this._causedByUserId;
  }

  /**
   * Domain logic: Get event payload for specific aggregate type
   */
  getEventDataFor<T>(aggregateType: string): T | null {
    if (this._aggregateType !== aggregateType) {
      return null;
    }
    return this._eventData as T;
  }

  equals(other: DomainEvent): boolean {
    if (!other || !(other instanceof DomainEvent)) {
      return false;
    }
    return this._id === other._id;
  }

  toString(): string {
    return `DomainEvent(${this._id}, ${this._eventType}, ${this._aggregateType}:${this._aggregateId})`;
  }
}
