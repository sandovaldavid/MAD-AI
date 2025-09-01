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
import type { NotificationPort } from '@domain/repositories/business/notification.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { Notification } from '@domain/entities/notification.entity';
import type {
  GetNotificationsRequest,
  GetNotificationsResult,
} from '@application/types/notifications.types';

/**
 * Get Notifications Use Case
 *
 * @description
 * Application layer orchestrator that handles notification retrieval with validation,
 * audit logging, and error normalization. This use case follows the orchestration
 * pattern with comprehensive validation for notification retrieval operations.
 *
 * @responsibilities
 * - Validate application-level rules for notification retrieval
 * - Delegate to domain repository for the actual retrieval
 * - Handle audit logging and side effects
 * - Normalize errors for consistent application layer handling
 *
 * @architecture
 * - Application Layer orchestrator
 * - Uses domain repository through dependency injection
 * - Integrates with system clock for precise timestamping
 * - Follows 4-step orchestration pattern
 *
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class GetNotifications {
  private readonly notificationPort = inject<NotificationPort>(NOTIFICATION_PORT);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly eventBus = inject<IDomainEventBusRepository>(DOMAIN_EVENT_BUS_REPO);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  /**
   * Execute notification retrieval use case
   *
   * @description
   * Orchestrates the complete notification retrieval process following the 4-step Application Layer pattern:
   * 1. Validate application rules and authorization
   * 2. Delegate to Domain repository for data retrieval
   * 3. Transform and prepare response
   * 4. Handle side effects (logging, events, statistics)
   *
   * @param request Application-specific request containing requester information
   * @param correlationId Optional correlation ID for request tracing
   * @returns Promise resolving to notification retrieval result
   */
  async execute(
    request: GetNotificationsRequest,
    correlationId?: string
  ): Promise<GetNotificationsResult> {
    try {
      // Step 1: Validate application rules and authorization
      await this.validateApplicationRules(request, correlationId);

      // Step 2: Delegate to Domain repository for notification retrieval
      const allNotifications = await this.notificationPort.snapshot();

      // Filter notifications by user ID if specified
      const notifications = request.requesterId
        ? allNotifications.filter((n) => n.userId === request.requesterId?.toString())
        : allNotifications;

      // Step 3: Return notifications directly (transformation happens in Presentation Layer)
      const result: GetNotificationsResult = {
        notifications,
        totalCount: notifications.length,
      };

      // Step 4: Handle side effects (logging, events, statistics)
      await this.handleNotificationRetrievalSideEffects(notifications, request, correlationId);

      return result;
    } catch (error) {
      // Transform and re-throw using Application Error Transformer
      throw this.errorTransformer.transform(error, {
        operation: 'get_notifications',
        correlationId,
        userId: request.requesterId?.toString(),
      });
    }
  }

  /**
   * Validate application-level rules for notification retrieval
   *
   * @description
   * Validates request parameters and basic business rules specific to the application layer.
   * Domain validation is handled by the repository layer.
   *
   * @param request Application layer request to validate
   * @param correlationId Correlation ID for tracing
   * @throws ApplicationError when validation fails
   */
  private validateApplicationRules(request: GetNotificationsRequest, correlationId?: string): void {
    this.logger.debug('Validating application rules for notification retrieval', {
      operation: 'get_notifications',
      correlationId,
      userId: request.requesterId?.toString(),
    });

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
   * Handle side effects of notification retrieval
   *
   * @description
   * Manages audit logging, domain event publishing, and statistics after successful notification retrieval.
   * Uses high-precision timestamps for accurate audit trails and Core Logger for structured logging.
   *
   * @param notifications Retrieved notifications
   * @param request The get request with requester information
   * @param correlationId Correlation ID for tracing
   */
  private async handleNotificationRetrievalSideEffects(
    notifications: Notification[],
    request: GetNotificationsRequest,
    correlationId?: string
  ): Promise<void> {
    const timestamp = new Date(this.clock.nowEpochSeconds() * 1000);
    const totalNotifications = notifications.length;
    const unreadNotifications = notifications.filter((n) => !n.isRead).length;

    // Log comprehensive audit information using Core Logger
    this.logger.info(
      `Notifications retrieved successfully: ${totalNotifications} total, ${unreadNotifications} unread`,
      {
        operation: 'get_notifications',
        correlationId,
        userId: request.requesterId?.toString(),
      }
    );

    // Publish domain event for business process tracking
    try {
      const event = DomainEvent.create({
        id: `notifications-retrieved-${Date.now()}`,
        eventType: DomainEventType.NOTIFICATIONS_CLEARED, // Using existing event type for notification operations
        aggregateId: request.requesterId?.toString() || 'system',
        aggregateType: 'User',
        eventData: {
          operation: 'get_notifications',
          totalRetrieved: totalNotifications,
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

      this.logger.debug('Domain event published for notification retrieval', {
        operation: 'get_notifications',
        correlationId,
      });
    } catch {
      // Log event publishing failure but don't fail the main operation
      this.logger.warn('Failed to publish domain event for notification retrieval', {
        operation: 'get_notifications',
        correlationId,
      });
    }
  }
}
