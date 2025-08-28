/**
 * Domain Notification Entity for MAD-AI System
 *
 * @description
 * This entity represents the business concept of a notification within the domain layer.
 * It encapsulates the essential properties and business rules related to notifications
 * while remaining independent of presentation and infrastructure concerns.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 *
 * @example Creating a notification
 * ```typescript
 * const notification = Notification.create({
 *   type: 'success',
 *   message: 'Operation completed successfully',
 *   userId: 'user-123',
 *   channel: 'email'
 * });
 * ```
 *
 * @businessRules
 * - All notifications must have a type and message
 * - Notifications must be associated with a user or system-wide
 * - Notifications have a creation timestamp for auditing
 * - Notifications can have associated actions for user interaction
 * - Notifications can be marked as read/unread for state tracking
 *
 * @domainEvents
 * - NotificationCreated: When a new notification is generated
 * - NotificationRead: When a user marks a notification as read
 * - NotificationDismissed: When a notification is dismissed by user
 */

import { ValidationError } from '../errors/validation-error.entity';
import { ValidationErrorCode } from '../errors/validation-error-code.enum';
import { BusinessRuleError } from '../errors/business-rule-error.entity';
import type { FieldError } from '../errors/field-error.type';
import { ISODateTime } from '../value-objects/iso-datetime.vo';
import {
  NotificationType,
  NOTIFICATION_PRIORITY_LEVELS,
  NOTIFICATION_DEFAULT_DURATIONS,
} from '../enums/notification-type.enum';
import { NotificationChannel } from '../enums/notification-channel.enum';

/**
 * Unique identifier for notifications in the domain.
 */
export type NotificationId = string;

/**
 * @deprecated Use NotificationType enum from '../enums/notification-type.enum' instead
 */
export type NotificationTypeLegacy = 'success' | 'error' | 'warning' | 'info';

/**
 * @deprecated Use NotificationChannel enum from '../enums/notification-channel.enum' instead
 */
export type NotificationChannelLegacy = 'email' | 'inApp' | 'push' | 'sms';

/**
 * Notification action representing user interactions.
 */
export interface NotificationAction {
  /** Action identifier */
  readonly id: string;
  /** Human-readable label */
  readonly label: string;
  /** Action type */
  readonly type: 'primary' | 'secondary' | 'dismiss';
  /** Optional URL for navigation actions */
  readonly url?: string;
  /** Optional callback data for custom actions */
  readonly data?: Record<string, unknown>;
}

/**
 * Specification for creating new notifications.
 */
export interface NewNotification {
  /** Notification type */
  readonly type: NotificationType;
  /** Main message content */
  readonly message: string;
  /** Optional title */
  readonly title?: string;
  /** Target user ID (undefined for system-wide notifications) */
  readonly userId?: string;
  /** Preferred delivery channel */
  readonly channel?: NotificationChannel;
  /** Priority level (1=highest, 5=lowest) */
  readonly priority?: 1 | 2 | 3 | 4 | 5;
  /** Auto-dismiss duration in milliseconds (null for persistent) */
  readonly duration?: number | null;
  /** Available actions */
  readonly actions?: NotificationAction[];
  /** Associated metadata */
  readonly metadata?: Record<string, unknown>;
}

/**
 * Domain Notification Entity
 *
 * @description
 * Represents a business notification in the MAD-AI domain. This entity encapsulates
 * notification state, business rules, and behavior while remaining independent of
 * presentation and infrastructure concerns.
 *
 * @domainConcepts
 * - Notifications represent important information that needs user attention
 * - Notifications have lifecycle states (created, delivered, read, dismissed)
 * - Notifications can be targeted to specific users or broadcast system-wide
 * - Notifications support different delivery channels and priority levels
 * - Notifications can have associated actions for user interaction
 */
export class Notification {
  private constructor(
    private readonly _id: NotificationId,
    private readonly _type: NotificationType,
    private readonly _message: string,
    private readonly _userId: string | undefined,
    private readonly _channel: NotificationChannel,
    private readonly _priority: 1 | 2 | 3 | 4 | 5,
    private readonly _duration: number | null,
    private readonly _actions: readonly NotificationAction[],
    private readonly _metadata: Record<string, unknown>,
    private readonly _createdAt: ISODateTime,
    private readonly _title?: string,
    private _isRead: boolean = false,
    private _isDismissed: boolean = false,
    private _readAt?: ISODateTime,
    private _dismissedAt?: ISODateTime
  ) {}

  /**
   * Factory method for creating Notification entities.
   *
   * @param props - Notification creation properties
   * @returns New Notification instance
   * @throws ValidationError if any business rule is violated
   *
   * @businessRules
   * - Message must not be empty
   * - Type must be valid notification type
   * - Priority must be between 1 and 5
   * - Duration must be positive if specified
   * - User ID must be valid if specified
   *
   * @example
   * ```typescript
   * const notification = Notification.create({
   *   type: 'success',
   *   message: 'Profile updated successfully',
   *   userId: 'user-123',
   *   channel: 'inApp',
   *   priority: 2,
   *   actions: [{
   *     id: 'view-profile',
   *     label: 'View Profile',
   *     type: 'primary',
   *     url: '/profile'
   *   }]
   * });
   * ```
   */
  static create(props: NewNotification & { id?: NotificationId }): Notification {
    const errors: FieldError[] = [];

    // Check for required fields
    const missingFields: string[] = [];
    if (!props.message?.trim()) {
      missingFields.push('message');
    }
    if (!props.type) {
      missingFields.push('type');
    }

    if (missingFields.length > 0) {
      throw ValidationError.forMissingRequiredFields(missingFields);
    }

    // Validate type format (since we already checked it exists above)
    const validTypes = Object.values(NotificationType);
    if (!validTypes.includes(props.type as NotificationType)) {
      errors.push({
        field: 'type',
        value: props.type,
        message: `Invalid notification type. Must be one of: ${validTypes.join(', ')}`,
        code: ValidationErrorCode.FIELD_FORMAT_INVALID,
      });
    }

    // Validate priority range
    const priority = props.priority ?? 3;
    if (priority < 1 || priority > 5 || !Number.isInteger(priority)) {
      errors.push({
        field: 'priority',
        value: priority,
        message: 'Priority must be an integer between 1 (highest) and 5 (lowest)',
        code: ValidationErrorCode.FIELD_OUT_OF_RANGE,
      });
    }

    // Validate duration
    if (props.duration !== null && props.duration !== undefined) {
      if (
        typeof props.duration !== 'number' ||
        props.duration <= 0 ||
        !Number.isInteger(props.duration)
      ) {
        errors.push({
          field: 'duration',
          value: props.duration,
          message: 'Duration must be a positive integer (milliseconds) if specified',
          code: ValidationErrorCode.FIELD_OUT_OF_RANGE,
        });
      }
    }

    if (errors.length > 0) {
      throw ValidationError.createFromFields(errors, ValidationErrorCode.VALIDATION_ERROR);
    }

    const id = props.id ?? Math.random().toString(36).substring(2);
    const createdAt = ISODateTime.create(new Date().toISOString())!;

    return new Notification(
      id,
      props.type,
      props.message.trim(),
      props.userId,
      props.channel ?? NotificationChannel.IN_APP,
      priority,
      props.duration ?? null,
      props.actions ?? [],
      props.metadata ?? {},
      createdAt,
      props.title?.trim(),
      false,
      false
    );
  }

  // --- Getters ---

  get id(): NotificationId {
    return this._id;
  }

  get type(): NotificationType {
    return this._type;
  }

  get message(): string {
    return this._message;
  }

  get title(): string | undefined {
    return this._title;
  }

  get userId(): string | undefined {
    return this._userId;
  }

  get channel(): NotificationChannel {
    return this._channel;
  }

  get priority(): 1 | 2 | 3 | 4 | 5 {
    return this._priority;
  }

  get duration(): number | null {
    return this._duration;
  }

  get actions(): readonly NotificationAction[] {
    return this._actions;
  }

  get metadata(): Record<string, unknown> {
    return { ...this._metadata };
  }

  get createdAt(): ISODateTime {
    return this._createdAt;
  }

  get isRead(): boolean {
    return this._isRead;
  }

  get isDismissed(): boolean {
    return this._isDismissed;
  }

  get readAt(): ISODateTime | undefined {
    return this._readAt;
  }

  get dismissedAt(): ISODateTime | undefined {
    return this._dismissedAt;
  }

  // --- Business Logic Methods ---

  /**
   * Marks the notification as read.
   *
   * @throws BusinessRuleError if notification is already dismissed
   *
   * @businessRules
   * - Cannot mark dismissed notifications as read
   * - Read timestamp is set to current time
   * - Operation is idempotent (safe to call multiple times)
   */
  markAsRead(): void {
    if (this._isDismissed) {
      throw BusinessRuleError.notificationAlreadyDismissed(this._id);
    }

    if (!this._isRead) {
      this._isRead = true;
      this._readAt = ISODateTime.create(new Date().toISOString())!;
    }
  }

  /**
   * Dismisses the notification.
   *
   * @businessRules
   * - Dismissed notifications cannot be undismissed
   * - Dismissal timestamp is set to current time
   * - Operation is idempotent (safe to call multiple times)
   */
  dismiss(): void {
    if (!this._isDismissed) {
      this._isDismissed = true;
      this._dismissedAt = ISODateTime.create(new Date().toISOString())!;
    }
  }

  /**
   * Checks if the notification is system-wide (not targeted to specific user).
   */
  isSystemWide(): boolean {
    return this._userId === undefined;
  }

  /**
   * Checks if the notification is targeted to a specific user.
   */
  isTargetedToUser(userId: string): boolean {
    return this._userId === userId;
  }

  /**
   * Checks if the notification is high priority (1-2).
   */
  isHighPriority(): boolean {
    return this._priority <= 2;
  }

  /**
   * Checks if the notification should auto-dismiss.
   */
  shouldAutoDismiss(): boolean {
    return this._duration !== null && this._duration > 0;
  }

  /**
   * Checks if the notification has actions available.
   */
  hasActions(): boolean {
    return this._actions.length > 0;
  }

  /**
   * Gets the primary action if available.
   */
  getPrimaryAction(): NotificationAction | undefined {
    return this._actions.find((action) => action.type === 'primary');
  }

  /**
   * Checks if the notification is still active (not dismissed).
   */
  isActive(): boolean {
    return !this._isDismissed;
  }

  /**
   * Gets the age of the notification in milliseconds.
   */
  getAge(): number {
    const now = new Date();
    const created = new Date(this._createdAt.value);
    return now.getTime() - created.getTime();
  }

  /**
   * Converts the notification to a plain object for serialization.
   */
  toPlainObject(): {
    id: string;
    type: NotificationType;
    message: string;
    title?: string;
    userId?: string;
    channel: NotificationChannel;
    priority: 1 | 2 | 3 | 4 | 5;
    duration: number | null;
    actions: NotificationAction[];
    metadata: Record<string, unknown>;
    createdAt: string;
    isRead: boolean;
    isDismissed: boolean;
    readAt?: string;
    dismissedAt?: string;
  } {
    return {
      id: this._id,
      type: this._type,
      message: this._message,
      title: this._title,
      userId: this._userId,
      channel: this._channel,
      priority: this._priority,
      duration: this._duration,
      actions: [...this._actions],
      metadata: { ...this._metadata },
      createdAt: this._createdAt.value,
      isRead: this._isRead,
      isDismissed: this._isDismissed,
      readAt: this._readAt?.value,
      dismissedAt: this._dismissedAt?.value,
    };
  }

  /**
   * Compares notifications for equality based on ID.
   */
  equals(other: Notification): boolean {
    return this._id === other._id;
  }

  /**
   * String representation of the notification.
   */
  toString(): string {
    const status = this._isDismissed ? 'dismissed' : this._isRead ? 'read' : 'unread';
    return `Notification(${this._id}, ${this._type}, ${status})`;
  }
}

/**
 * Checks if a notification is critical and requires immediate attention.
 */
export function isCritical(notification: Notification): boolean {
  return notification.type === 'error' && notification.isHighPriority();
}

/**
 * Checks if a notification should persist (not auto-dismiss).
 */
export function shouldPersist(notification: Notification): boolean {
  return notification.type === 'error' || !notification.shouldAutoDismiss();
}

/**
 * Checks if a notification is actionable (has user actions).
 */
export function isActionable(notification: Notification): boolean {
  return notification.hasActions() && notification.isActive();
}

/**
 * Checks if a notification is stale (older than specified duration).
 */
export function isStale(notification: Notification, maxAge: number = 86400000): boolean {
  return notification.getAge() > maxAge; // Default: 24 hours
}

/**
 * @deprecated Use NOTIFICATION_PRIORITY_LEVELS from '../enums/notification-type.enum' instead
 */
export const PRIORITY_LEVELS = NOTIFICATION_PRIORITY_LEVELS;

/**
 * @deprecated Use NOTIFICATION_DEFAULT_DURATIONS from '../enums/notification-type.enum' instead
 */
export const DEFAULT_DURATIONS = NOTIFICATION_DEFAULT_DURATIONS;
