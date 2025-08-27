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

export enum DomainEventType {
  /** User account was created */
  USER_CREATED = 'USER_CREATED',
  /** User successfully authenticated */
  USER_AUTHENTICATED = 'USER_AUTHENTICATED',
  /** User authentication failed */
  USER_AUTHENTICATION_FAILED = 'USER_AUTHENTICATION_FAILED',
  /** User profile information was modified */
  USER_PROFILE_MODIFIED = 'USER_PROFILE_MODIFIED',
  /** User password was updated */
  USER_PASSWORD_UPDATED = 'USER_PASSWORD_UPDATED',
  /** User email address was verified */
  USER_EMAIL_VERIFIED = 'USER_EMAIL_VERIFIED',
  /** User account was activated */
  USER_ACCOUNT_ACTIVATED = 'USER_ACCOUNT_ACTIVATED',
  /** User account was deactivated */
  USER_ACCOUNT_DEACTIVATED = 'USER_ACCOUNT_DEACTIVATED',
  /** User role was changed */
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
  /** Role was created */
  ROLE_CREATED = 'ROLE_CREATED',
  /** Role was activated */
  ROLE_ACTIVATED = 'ROLE_ACTIVATED',
  /** Role was deactivated */
  ROLE_DEACTIVATED = 'ROLE_DEACTIVATED',
  /** Role was modified */
  ROLE_MODIFIED = 'ROLE_MODIFIED',
  /** Session was terminated by user logout */
  SESSION_TERMINATED = 'SESSION_TERMINATED',
  /** Session expired due to timeout */
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  /** Unauthorized access attempt detected */
  UNAUTHORIZED_ACCESS_ATTEMPTED = 'UNAUTHORIZED_ACCESS_ATTEMPTED',
  /** Security violation detected */
  SECURITY_VIOLATION_DETECTED = 'SECURITY_VIOLATION_DETECTED',
  USER_PREFERENCES_UPDATED = 'USER_PREFERENCES_UPDATED',
}

export enum DomainEventSeverity {
  /** Low impact business event */
  LOW = 'LOW',
  /** Medium impact business event */
  MEDIUM = 'MEDIUM',
  /** High impact business event */
  HIGH = 'HIGH',
  /** Critical business event requiring immediate attention */
  CRITICAL = 'CRITICAL',
}

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

    if (!props.id?.trim()) {
      errors.push({
        field: 'id',
        value: props.id,
        message: 'Domain event ID is required',
        code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
      });
    }

    if (!props.aggregateId?.trim()) {
      errors.push({
        field: 'aggregateId',
        value: props.aggregateId,
        message: 'Aggregate ID is required',
        code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
      });
    }

    if (!props.aggregateType?.trim()) {
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

    return new DomainEvent(
      props.id.trim(),
      props.eventType,
      props.aggregateId.trim(),
      props.aggregateType.trim(),
      occurredAt,
      severity,
      props.eventData || {},
      props.causedByUserId?.trim()
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
    return { ...this._eventData };
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
    return this._id === other._id;
  }

  toString(): string {
    return `DomainEvent(${this._id}, ${this._eventType}, ${this._aggregateType}:${this._aggregateId})`;
  }
}
