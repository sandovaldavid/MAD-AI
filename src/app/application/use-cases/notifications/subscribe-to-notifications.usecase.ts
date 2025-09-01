import { Injectable, inject } from '@angular/core';
import { NOTIFICATION_PORT, CLOCK_PORT, LOGGER_PORT, DOMAIN_EVENT_BUS_REPO } from '@di/tokens';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import { DomainEvent } from '@domain/events/domain-event.entity';
import { DomainEventType } from '@domain/events/domain-event.enum';
import { ISODateTime } from '@domain/value-objects/iso-datetime.vo';
import { PublishEventContract } from '@domain/repositories/business/domain-event-bus.contract';
import type { IDomainEventBusRepository } from '@domain/repositories/business/domain-event-bus.repository';
import type { Notification } from '@domain/entities/notification.entity';
import type { SubscribeToNotificationsRequest } from '@application/types/notifications.types';
import type { NotificationPort } from '@/app/domain/repositories/business/notification.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Logger } from '@core/interfaces/logger.interface';

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
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly eventBus = inject<IDomainEventBusRepository>(DOMAIN_EVENT_BUS_REPO);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  /**
   * Execute notification subscription use case
   *
   * @description
   * Orchestrates the complete notification subscription process following the 4-step Application Layer pattern:
   * 1. Validate application rules and authorization
   * 2. Create audited callback wrapper for logging
   * 3. Delegate to Domain repository for subscription
   * 4. Handle side effects (logging, events, statistics)
   *
   * @param request Application-specific request containing callback and requester information
   * @param correlationId Optional correlation ID for request tracing
   * @returns Promise resolving to unsubscribe function
   */
  async execute(
    request: SubscribeToNotificationsRequest,
    correlationId?: string
  ): Promise<() => void> {
    try {
      // Step 1: Validate application rules and authorization
      await this.validateApplicationRules(request, correlationId);

      // Step 2: Create audited callback wrapper for logging
      const auditedCallback = this.createAuditedCallback(request, correlationId);

      // Step 3: Delegate to Domain repository for subscription
      const unsubscribe = this.notificationPort.onChange(auditedCallback);

      // Step 4: Handle side effects (logging, events, statistics)
      await this.handleSubscriptionStartSideEffects(request, correlationId);

      // Return audited unsubscribe function
      return this.createAuditedUnsubscribe(unsubscribe, request, correlationId);
    } catch (error) {
      // Transform and re-throw using Application Error Transformer
      throw this.errorTransformer.transform(error, {
        operation: 'subscribe_to_notifications',
        correlationId,
        userId: request.requesterId?.toString(),
      });
    }
  }

  /**
   * Validate application-level rules for notification subscription
   *
   * @description
   * Validates request parameters and basic business rules specific to the application layer.
   * Domain validation is handled by the repository layer.
   *
   * @param request Application request containing callback and requester information
   * @param correlationId Correlation ID for tracing
   * @throws ApplicationError when validation fails
   */
  private validateApplicationRules(
    request: SubscribeToNotificationsRequest,
    correlationId?: string
  ): void {
    this.logger.debug('Validating application rules for notification subscription', {
      operation: 'subscribe_to_notifications',
      correlationId,
      userId: request.requesterId?.toString(),
    });

    if (!request.callback || typeof request.callback !== 'function') {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'INVALID_CALLBACK',
        'Callback function is required for notification subscription'
      );
    }

    // Validate requester ID if provided
    if (request.requesterId !== undefined && request.requesterId !== null) {
      if (
        typeof request.requesterId !== 'number' ||
        !Number.isInteger(request.requesterId) ||
        request.requesterId <= 0
      ) {
        throw new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
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
   * @param request Application request containing callback and requester information
   * @param correlationId Correlation ID for tracing
   * @returns Wrapped callback with audit logging
   */
  private createAuditedCallback(
    request: SubscribeToNotificationsRequest,
    correlationId?: string
  ): (notifications: Notification[]) => void {
    return (notifications: Notification[]) => {
      try {
        // Call original callback first
        request.callback(notifications);

        // Then handle audit logging
        this.handleNotificationUpdateSideEffects(notifications, request, correlationId);
      } catch (error) {
        // Log callback errors but don't break the subscription
        this.logger.error('Notification subscription callback error', {
          operation: 'subscribe_to_notifications',
          correlationId,
          userId: request.requesterId?.toString(),
        });

        // Log the actual error separately for debugging
        console.error('Subscription callback error details:', error);
      }
    };
  }

  /**
   * Create audited unsubscribe function
   *
   * @description
   * Wraps the unsubscribe function with audit logging and domain events.
   *
   * @param originalUnsubscribe Original unsubscribe function
   * @param request Application request with requester information
   * @param correlationId Correlation ID for tracing
   * @returns Wrapped unsubscribe function with audit logging
   */
  private createAuditedUnsubscribe(
    originalUnsubscribe: () => void,
    request: SubscribeToNotificationsRequest,
    correlationId?: string
  ): () => void {
    return async () => {
      originalUnsubscribe();
      await this.handleUnsubscribeSideEffects(request, correlationId);
    };
  }

  /**
   * Handle side effects of subscription start
   *
   * @description
   * Manages audit logging and domain events when a new subscription is started.
   *
   * @param request Application request with requester information
   * @param correlationId Correlation ID for tracing
   */
  private async handleSubscriptionStartSideEffects(
    request: SubscribeToNotificationsRequest,
    correlationId?: string
  ): Promise<void> {
    const timestamp = new Date(this.clock.nowEpochSeconds() * 1000);

    // Log comprehensive audit information using Core Logger
    this.logger.info('Notification subscription started successfully', {
      operation: 'subscribe_to_notifications',
      correlationId,
      userId: request.requesterId?.toString(),
    });

    // Publish domain event for business process tracking
    try {
      const event = DomainEvent.create({
        id: `subscription-started-${Date.now()}`,
        eventType: DomainEventType.NOTIFICATIONS_CLEARED, // Using existing event type for notification operations
        aggregateId: request.requesterId?.toString() || 'system',
        aggregateType: 'User',
        eventData: {
          operation: 'subscription_started',
          requesterId: request.requesterId,
          correlationId,
        },
        causedByUserId: request.requesterId?.toString(),
        occurredAt: ISODateTime.create(timestamp.toISOString()),
      });

      const publishContract: PublishEventContract = {
        event,
      };

      await this.eventBus.publish(publishContract);

      this.logger.debug('Domain event published for subscription start', {
        operation: 'subscribe_to_notifications',
        correlationId,
      });
    } catch {
      // Log event publishing failure but don't fail the main operation
      this.logger.warn('Failed to publish domain event for subscription start', {
        operation: 'subscribe_to_notifications',
        correlationId,
      });
    }
  }

  /**
   * Handle side effects of notification updates
   *
   * @description
   * Manages audit logging for each notification update received by subscription.
   *
   * @param notifications Current notifications
   * @param request Application request with requester information
   * @param correlationId Correlation ID for tracing
   */
  private async handleNotificationUpdateSideEffects(
    notifications: Notification[],
    request: SubscribeToNotificationsRequest,
    correlationId?: string
  ): Promise<void> {
    const timestamp = new Date(this.clock.nowEpochSeconds() * 1000);
    const totalNotifications = notifications.length;
    const unreadNotifications = notifications.filter((n) => !n.isRead).length;

    // Log comprehensive audit information using Core Logger
    this.logger.debug(
      `Notification subscription update processed - Total: ${totalNotifications}, Unread: ${unreadNotifications}`,
      {
        operation: 'subscribe_to_notifications',
        correlationId,
        userId: request.requesterId?.toString(),
      }
    );

    // Publish domain event for business process tracking
    try {
      const event = DomainEvent.create({
        id: `subscription-update-${Date.now()}`,
        eventType: DomainEventType.NOTIFICATIONS_CLEARED, // Using existing event type for notification operations
        aggregateId: request.requesterId?.toString() || 'system',
        aggregateType: 'User',
        eventData: {
          operation: 'subscription_update',
          totalNotifications,
          unreadCount: unreadNotifications,
          requesterId: request.requesterId,
          correlationId,
        },
        causedByUserId: request.requesterId?.toString(),
        occurredAt: ISODateTime.create(timestamp.toISOString()),
      });

      const publishContract: PublishEventContract = {
        event,
      };

      await this.eventBus.publish(publishContract);

      this.logger.debug('Domain event published for subscription update', {
        operation: 'subscribe_to_notifications',
        correlationId,
      });
    } catch {
      // Log event publishing failure but don't fail the main operation
      this.logger.warn('Failed to publish domain event for subscription update', {
        operation: 'subscribe_to_notifications',
        correlationId,
      });
    }
  }

  /**
   * Handle side effects of unsubscribe
   *
   * @description
   * Manages audit logging and domain events when a subscription is terminated.
   *
   * @param request Application request with requester information
   * @param correlationId Correlation ID for tracing
   */
  private async handleUnsubscribeSideEffects(
    request: SubscribeToNotificationsRequest,
    correlationId?: string
  ): Promise<void> {
    const timestamp = new Date(this.clock.nowEpochSeconds() * 1000);

    // Log comprehensive audit information using Core Logger
    this.logger.info('Notification subscription ended', {
      operation: 'unsubscribe_from_notifications',
      correlationId,
      userId: request.requesterId?.toString(),
    });

    // Publish domain event for business process tracking
    try {
      const event = DomainEvent.create({
        id: `subscription-ended-${Date.now()}`,
        eventType: DomainEventType.NOTIFICATIONS_CLEARED, // Using existing event type for notification operations
        aggregateId: request.requesterId?.toString() || 'system',
        aggregateType: 'User',
        eventData: {
          operation: 'subscription_ended',
          requesterId: request.requesterId,
          correlationId,
        },
        causedByUserId: request.requesterId?.toString(),
        occurredAt: ISODateTime.create(timestamp.toISOString()),
      });

      const publishContract: PublishEventContract = {
        event,
      };

      await this.eventBus.publish(publishContract);

      this.logger.debug('Domain event published for subscription end', {
        operation: 'unsubscribe_from_notifications',
        correlationId,
      });
    } catch {
      // Log event publishing failure but don't fail the main operation
      this.logger.warn('Failed to publish domain event for subscription end', {
        operation: 'unsubscribe_from_notifications',
        correlationId,
      });
    }
  }
}
