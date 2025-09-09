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
import { NotificationType } from '../enums/notification-type.enum';
import { NotificationChannel } from '../enums/notification-channel.enum';

// Import specifications for business rule validation
import { DateTimeBusinessRules } from '../specifications/datetime-business-rules.specs';

// Import domain events
import { DomainEvent } from '../events/domain-event.entity';
import { DomainEventType } from '../events/domain-event.enum';

/**
 * Unique identifier for notifications in the domain.
 */
export type NotificationId = string;

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
  private readonly _domainEvents: DomainEvent[] = [];

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
    private _isRead = false,
    private _isDismissed = false,
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

    // Business Rule Validations using Specifications

    // 1. Business Hours Validation - Check if notification creation is within business hours
    try {
      const now = ISODateTime.now();
      // Business rule: Critical notifications can be sent outside business hours
      const isCriticalNotification = props.type === 'error' || priority <= 2;

      if (!isCriticalNotification && !DateTimeBusinessRules.isWithinBusinessHours(now, 8, 18)) {
        errors.push({
          field: 'notification',
          value: now.value,
          message: 'Non-critical notifications should be sent during business hours (8 AM - 6 PM)',
          code: ValidationErrorCode.PERMISSION_DENIED,
        });
      }
    } catch (error) {
      // If business hours validation fails, we don't block creation but log it
      console.warn('Business hours validation failed:', error);
    }

    // 2. Priority and Type Consistency Validation
    try {
      // Business rule: Error notifications should have high priority
      if (props.type === 'error' && priority > 3) {
        errors.push({
          field: 'priority',
          value: priority.toString(),
          message: 'Error notifications must have high priority (1-3)',
          code: ValidationErrorCode.INVALID_STATE,
        });
      }

      // Business rule: Success notifications should not have critical priority
      if (props.type === 'success' && priority <= 2) {
        errors.push({
          field: 'priority',
          value: priority.toString(),
          message: 'Success notifications should not have critical priority',
          code: ValidationErrorCode.INVALID_STATE,
        });
      }
    } catch {
      errors.push({
        field: 'notification',
        value: 'validation_failed',
        message: 'Priority and type consistency validation failed',
        code: ValidationErrorCode.VALIDATION_ERROR,
      });
    }

    // 3. Message Content Validation
    try {
      const message = props.message.trim();

      // Business rule: Messages should not be too short for important notifications
      if (priority <= 2 && message.length < 10) {
        errors.push({
          field: 'message',
          value: message,
          message:
            'High priority notifications should have descriptive messages (min 10 characters)',
          code: ValidationErrorCode.FIELD_TOO_SHORT,
        });
      }

      // Business rule: Messages should not contain inappropriate content
      const inappropriateWords = ['spam', 'test123', 'lorem ipsum'];
      const hasInappropriateContent = inappropriateWords.some((word) =>
        message.toLowerCase().includes(word.toLowerCase())
      );

      if (hasInappropriateContent) {
        errors.push({
          field: 'message',
          value: message,
          message: 'Notification message contains inappropriate content',
          code: ValidationErrorCode.PERMISSION_DENIED,
        });
      }
    } catch {
      errors.push({
        field: 'message',
        value: props.message,
        message: 'Message content validation failed',
        code: ValidationErrorCode.VALIDATION_ERROR,
      });
    }

    // 4. Channel and Type Compatibility Validation
    try {
      // Business rule: Error notifications should prefer in-app channel for immediate attention
      if (props.type === 'error' && props.channel === NotificationChannel.EMAIL) {
        errors.push({
          field: 'channel',
          value: props.channel,
          message: 'Error notifications should use in-app channel for immediate attention',
          code: ValidationErrorCode.INVALID_STATE,
        });
      }

      // Business rule: SMS should only be used for critical notifications
      if (props.channel === NotificationChannel.SMS && priority > 2) {
        errors.push({
          field: 'channel',
          value: props.channel,
          message: 'SMS channel should only be used for critical notifications',
          code: ValidationErrorCode.PERMISSION_DENIED,
        });
      }
    } catch {
      errors.push({
        field: 'channel',
        value: props.channel || 'default',
        message: 'Channel and type compatibility validation failed',
        code: ValidationErrorCode.VALIDATION_ERROR,
      });
    }

    // If any business rule validations failed, throw combined error
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

  // --- Domain Events ---

  /**
   * Adds a domain event to the notification.
   * Events will be published when the aggregate is persisted.
   *
   * @param event - Domain event to add
   * @private
   */
  private addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  /**
   * Gets all unpublished domain events from this aggregate.
   *
   * @returns Array of domain events
   */
  getDomainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  /**
   * Clears all domain events from this aggregate.
   * Should be called after events have been published.
   */
  clearDomainEvents(): void {
    this._domainEvents.length = 0;
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
   * Checks if the notification is expired based on business rules.
   *
   * @businessRules
   * - Uses DateTimeBusinessRules to determine if notification should be considered expired
   * - Considers notification type, priority, and business hours
   * - Critical notifications have different expiration rules
   */
  isExpired(): boolean {
    const now = ISODateTime.create(new Date().toISOString())!;

    // Critical notifications expire after 1 hour
    if (this.isHighPriority() && this._type === 'error') {
      const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
      return this.getAge() > oneHour;
    }

    // Regular notifications expire after 24 hours
    const twentyFourHours = 24 * 60 * 60 * 1000;
    if (this.getAge() > twentyFourHours) {
      return true;
    }

    // Check if current time is within business hours for non-critical notifications
    if (!this.isHighPriority()) {
      return !DateTimeBusinessRules.isWithinBusinessHours(now, 8, 18);
    }

    return false;
  }

  /**
   * Checks if the notification can be renewed based on business rules.
   *
   * @businessRules
   * - Only active notifications can be renewed
   * - Critical notifications cannot be renewed (must be handled immediately)
   * - Renewal is only allowed within business hours
   * - Maximum renewal limit based on notification type
   */
  canBeRenewed(): boolean {
    if (!this.isActive() || this.isHighPriority()) {
      return false;
    }

    const now = ISODateTime.create(new Date().toISOString())!;

    // Only allow renewal within business hours
    if (!DateTimeBusinessRules.isWithinBusinessHours(now, 8, 18)) {
      return false;
    }

    // Check renewal limits based on type
    const maxRenewals = this._type === 'warning' ? 2 : 1;
    const currentRenewals = (this._metadata['renewalCount'] as number) || 0;

    return currentRenewals < maxRenewals;
  }

  /**
   * Renews the notification if business rules allow it.
   *
   * @businessRules
   * - Validates renewal eligibility using business rules
   * - Updates renewal count in metadata
   * - Resets read status for renewed notifications
   * - Generates domain event for renewal
   */
  renew(): void {
    if (!this.canBeRenewed()) {
      throw new BusinessRuleError(
        'NOTIFICATION_CANNOT_BE_RENEWED',
        'Notification cannot be renewed: business rules violation'
      );
    }

    const currentRenewals = (this._metadata['renewalCount'] as number) || 0;
    const updatedMetadata = {
      ...this._metadata,
      renewalCount: currentRenewals + 1,
      lastRenewedAt: new Date().toISOString(),
    };

    // Update metadata by creating new instance with updated metadata
    Object.assign(this, { _metadata: updatedMetadata });

    // Reset read status for renewed notifications
    this._isRead = false;
    this._readAt = undefined;

    // Generate domain event
    this.addDomainEvent(
      DomainEvent.create({
        id: `notification-renewed-${this._id}-${Date.now()}`,
        aggregateId: this._id,
        aggregateType: 'Notification',
        eventType: DomainEventType.USER_PROFILE_MODIFIED, // Using existing event type for now
        eventData: {
          notificationId: this._id,
          renewedAt: new Date().toISOString(),
          renewalCount: currentRenewals + 1,
          source: 'Notification.renew',
          reason: 'Notification renewal due to business rules',
        },
      })
    );
  }

  /**
   * Validates the notification against current business rules.
   *
   * @businessRules
   * - Combines multiple specifications for comprehensive validation
   * - Validates timing, content, and business constraints
   * - Returns detailed validation results
   */
  validateBusinessRules(): {
    isValid: boolean;
    violations: string[];
    warnings: string[];
  } {
    const violations: string[] = [];
    const warnings: string[] = [];

    // Validate timing rules
    const now = ISODateTime.create(new Date().toISOString())!;
    if (!DateTimeBusinessRules.isWithinBusinessHours(now, 8, 18) && !this.isHighPriority()) {
      warnings.push('Notification created outside business hours');
    }

    // Validate priority and type consistency
    if (this._type === 'error' && this._priority > 2) {
      violations.push('Error notifications must have high priority (1-2)');
    }

    if (this._type === 'success' && this._priority < 4) {
      warnings.push('Success notifications typically have lower priority');
    }

    // Validate content rules
    if (this._message.length < 10 && this.isHighPriority()) {
      violations.push('High priority notifications must have detailed messages');
    }

    // Validate channel compatibility
    if (this._channel === 'sms' && this._type === 'info') {
      warnings.push('SMS channel should be reserved for critical notifications');
    }

    // Validate duration rules
    if (this._duration && this._duration < 3000 && this.isHighPriority()) {
      violations.push('High priority notifications should have longer display duration');
    }

    return {
      isValid: violations.length === 0,
      violations,
      warnings,
    };
  }

  /**
   * Gets recommendations for improving the notification based on business rules.
   *
   * @businessRules
   * - Analyzes notification properties against best practices
   * - Provides actionable recommendations for optimization
   * - Considers user experience and business impact
   */
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const validation = this.validateBusinessRules();

    // Add recommendations based on validation results
    validation.warnings.forEach((warning) => {
      if (warning.includes('business hours')) {
        recommendations.push(
          'Consider scheduling non-critical notifications during business hours'
        );
      }
      if (warning.includes('SMS')) {
        recommendations.push('Use in-app notifications for non-critical information');
      }
      if (warning.includes('Success notifications')) {
        recommendations.push('Consider lowering priority for success notifications');
      }
    });

    // Additional recommendations based on content analysis
    if (this._message.length > 200) {
      recommendations.push('Consider breaking long messages into multiple notifications');
    }

    if (this.hasActions() && this._actions.length > 3) {
      recommendations.push('Limit to 3 or fewer actions per notification for better UX');
    }

    if (!this._title && this._message.length > 50) {
      recommendations.push('Add a title for better message organization');
    }

    return recommendations;
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
  equals(other: Notification | null | undefined): boolean {
    if (!other) return false;
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
export function isStale(notification: Notification, maxAge = 86400000): boolean {
  return notification.getAge() > maxAge; // Default: 24 hours
}
