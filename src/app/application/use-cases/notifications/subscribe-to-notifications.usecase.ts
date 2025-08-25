import { Injectable, inject } from '@angular/core';
import { NOTIFICATION_PORT, CLOCK_PORT } from '@di/tokens';
import type { NotificationPort } from '@domain/repositories/business/notification.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import { ApplicationError } from '../../errors/application-error';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { Notification } from '@domain/entities/notification.entity';

/**
 * Subscribe to Notifications Use Case
 *
 * @description
 * Application layer orchestrator that handles notification subscription with validation,
 * audit logging, and error normalization. This use case follows the orchestration
 * pattern adapted for reactive subscriptions with comprehensive validation.
 *
 * @responsibilities
 * - Validate application-level rules for notification subscriptions
 * - Delegate to domain repository for the actual subscription
 * - Handle audit logging and side effects
 * - Normalize errors for consistent application layer handling
 *
 * @architecture
 * - Application Layer orchestrator
 * - Uses domain repository through dependency injection
 * - Integrates with system clock for precise timestamping
 * - Follows adapted orchestration pattern for reactive operations
 *
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class SubscribeToNotifications {
  private readonly notificationPort = inject<NotificationPort>(NOTIFICATION_PORT);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  /**
   * Execute notification subscription orchestration with validation and audit logging
   *
   * @param callback - Function that receives notification updates
   * @param requesterId - ID of the user making the request (for audit logging)
   * @returns Function to unsubscribe from changes
   * @throws ApplicationError when validation fails or subscription fails
   */
  execute(callback: (notifications: Notification[]) => void, requesterId?: number): () => void {
    try {
      // Step 1: Validate application rules
      this.validateApplicationRules(callback, requesterId);

      // Step 2: Create wrapped callback for audit logging
      const wrappedCallback = this.createAuditedCallback(callback, requesterId);

      // Step 3: Delegate to domain repository for subscription
      const unsubscribe = this.notificationPort.onChange(wrappedCallback);

      // Step 4: Handle side effects (subscription started)
      this.handleSubscriptionStartSideEffects(requesterId);

      // Return wrapped unsubscribe function with audit logging
      return this.createAuditedUnsubscribe(unsubscribe, requesterId);
    } catch (error: unknown) {
      // Normalize errors for application layer
      throw new ApplicationError(
        'subscribe_to_notifications',
        this.errorTransformer.transformError(error),
        'NOTIFICATION_SUBSCRIPTION_FAILED'
      );
    }
  }

  /**
   * Validate application-level rules for notification subscription
   *
   * @description
   * Validates request parameters and basic business rules specific to the application layer.
   * Domain validation is handled by the repository layer.
   *
   * @param callback Callback function to validate
   * @param requesterId Requester ID to validate (optional)
   * @throws ApplicationError when validation fails
   */
  private validateApplicationRules(
    callback: (notifications: Notification[]) => void,
    requesterId?: number
  ): void {
    if (!callback || typeof callback !== 'function') {
      throw new ApplicationError(
        'subscribe_to_notifications',
        'INVALID_CALLBACK',
        'Callback function is required for notification subscription'
      );
    }

    // Validate requester ID if provided
    if (requesterId !== undefined && requesterId !== null) {
      if (typeof requesterId !== 'number' || !Number.isInteger(requesterId) || requesterId <= 0) {
        throw new ApplicationError(
          'subscribe_to_notifications',
          'INVALID_REQUESTER_ID_FORMAT',
          'Requester ID must be a positive integer when provided'
        );
      }
    }
  }

  /**
   * Create audited callback wrapper
   *
   * @description
   * Wraps the original callback with audit logging to track notification updates.
   *
   * @param originalCallback Original callback function
   * @param requesterId ID of the requester for audit purposes
   * @returns Wrapped callback with audit logging
   */
  private createAuditedCallback(
    originalCallback: (notifications: Notification[]) => void,
    requesterId?: number
  ): (notifications: Notification[]) => void {
    return (notifications: Notification[]) => {
      try {
        // Call original callback first
        originalCallback(notifications);

        // Then handle audit logging
        this.handleNotificationUpdateSideEffects(notifications, requesterId);
      } catch (error) {
        // Log callback errors but don't break the subscription
        const timestamp = this.clock.nowEpochSeconds();
        console.error(`[AUDIT] Notification subscription callback error`, {
          timestamp,
          requesterId,
          error: error instanceof Error ? error.message : 'Unknown error',
          operation: 'subscribe_to_notifications',
          feature: 'notifications',
          severity: 'HIGH',
        });
      }
    };
  }

  /**
   * Create audited unsubscribe function
   *
   * @description
   * Wraps the unsubscribe function with audit logging.
   *
   * @param originalUnsubscribe Original unsubscribe function
   * @param requesterId ID of the requester for audit purposes
   * @returns Wrapped unsubscribe function with audit logging
   */
  private createAuditedUnsubscribe(
    originalUnsubscribe: () => void,
    requesterId?: number
  ): () => void {
    return () => {
      originalUnsubscribe();
      this.handleUnsubscribeSideEffects(requesterId);
    };
  }

  /**
   * Handle side effects of subscription start
   *
   * @description
   * Manages audit logging when a new subscription is started.
   *
   * @param requesterId ID of user who started the subscription
   */
  private handleSubscriptionStartSideEffects(requesterId?: number): void {
    const timestamp = this.clock.nowEpochSeconds();

    console.log(`[AUDIT] Notification subscription started`, {
      timestamp,
      requesterId,
      operation: 'subscribe_to_notifications',
      feature: 'notifications',
      severity: 'LOW',
    });
  }

  /**
   * Handle side effects of notification updates
   *
   * @description
   * Manages audit logging for each notification update received by subscription.
   *
   * @param notifications Current notifications
   * @param requesterId ID of the subscriber
   */
  private handleNotificationUpdateSideEffects(
    notifications: Notification[],
    requesterId?: number
  ): void {
    const timestamp = this.clock.nowEpochSeconds();

    // Calculate notification statistics
    const totalNotifications = notifications.length;
    const unreadNotifications = notifications.filter((n) => !n.isRead).length;

    console.log(`[AUDIT] Notification subscription update`, {
      timestamp,
      requesterId,
      notificationStats: {
        total: totalNotifications,
        unread: unreadNotifications,
        read: totalNotifications - unreadNotifications,
      },
      operation: 'subscribe_to_notifications_update',
      feature: 'notifications',
      severity: 'LOW',
    });
  }

  /**
   * Handle side effects of unsubscribe
   *
   * @description
   * Manages audit logging when a subscription is terminated.
   *
   * @param requesterId ID of user who unsubscribed
   */
  private handleUnsubscribeSideEffects(requesterId?: number): void {
    const timestamp = this.clock.nowEpochSeconds();

    console.log(`[AUDIT] Notification subscription ended`, {
      timestamp,
      requesterId,
      operation: 'unsubscribe_from_notifications',
      feature: 'notifications',
      severity: 'LOW',
    });
  }
}
