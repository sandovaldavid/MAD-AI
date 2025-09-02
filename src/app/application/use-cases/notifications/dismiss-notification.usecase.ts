import { Injectable, inject } from '@angular/core';
import { NOTIFICATION_PORT, CLOCK_PORT, LOGGER_PORT, DOMAIN_EVENT_BUS_REPO } from '@di/tokens';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorTransformer } from '../../errors/application-error.transformer';
import { LogContext } from '@core/interfaces/logger.interface';
import { DomainEvent } from '@domain/events/domain-event.entity';
import { DomainEventType } from '@domain/events/domain-event.enum';
import { ISODateTime } from '@domain/value-objects/iso-datetime.vo';
import { ApplicationErrorCode } from '../../errors/error-codes.enum';
import { PublishEventContract } from '@domain/repositories/business/domain-event-bus.contract';
import type { NotificationPort } from '@domain/repositories/business/notification.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { IDomainEventBusRepository } from '@domain/repositories/business/domain-event-bus.repository';
import type { DismissNotificationRequest } from '../../types/notifications.types';

/**
 * Dismiss Notification Use Case
 *
 * @description
 * Application layer orchestrator that handles notification dismissal with validation,
 * audit logging, and error normalization. This use case follows the orchestration
 * pattern with comprehensive validation for notification dismissal operations.
 *
 * @responsibilities
 * - Validate application-level rules for notification dismissal
 * - Delegate to domain repository for the actual dismissal
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
export class DismissNotification {
  private readonly notificationPort = inject<NotificationPort>(NOTIFICATION_PORT);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly eventBus = inject<IDomainEventBusRepository>(DOMAIN_EVENT_BUS_REPO);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  /**
   * Execute notification dismissal orchestration with validation, logging and event publishing
   *
   * @param request - Application layer request for notification dismissal
   * @returns Promise resolving when dismissal is complete
   * @throws ApplicationError when validation fails or dismissal fails
   */
  async execute(request: DismissNotificationRequest): Promise<void> {
    const correlationId = `dismiss-notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      this.logger.info('Starting notification dismissal orchestration', {
        operation: 'dismiss_notification',
        correlationId,
        userId: request.requesterId?.toString(),
      } as LogContext);

      // Step 1: Validate application rules
      this.validateApplicationRules(request, correlationId);

      // Step 2: Delegate to domain repository for dismissal
      // The domain layer (service) handles existence validation and idempotency
      this.notificationPort.dismiss(request.notificationId);

      // Step 3: Handle side effects (logging, events, statistics)
      await this.handleNotificationDismissalSideEffects(request, correlationId);

      this.logger.info('Notification dismissal orchestration completed successfully', {
        operation: 'dismiss_notification',
        correlationId,
        userId: request.requesterId?.toString(),
      } as LogContext);
    } catch (error: unknown) {
      this.logger.error('Notification dismissal orchestration failed', {
        operation: 'dismiss_notification',
        correlationId,
        userId: request.requesterId?.toString(),
      } as LogContext);

      // Normalize errors for application layer
      throw this.errorTransformer.transform(error, {
        correlationId,
        userId: request.requesterId?.toString(),
      } as LogContext);
    }
  }

  /**
   * Validate application-level rules for notification dismissal
   *
   * @description
   * Validates request parameters and basic business rules specific to the application layer.
   * Domain validation is handled by the repository layer.
   *
   * @param request Application layer request to validate
   * @param correlationId Correlation ID for tracing
   * @throws ApplicationError when validation fails
   */
  private validateApplicationRules(
    request: DismissNotificationRequest,
    correlationId?: string
  ): void {
    this.logger.debug('Validating application rules for notification dismissal', {
      operation: 'dismiss_notification',
      correlationId,
      userId: request.requesterId?.toString(),
    } as LogContext);

    if (request.notificationId === undefined || request.notificationId === null) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'INVALID_NOTIFICATION_ID',
        'Notification ID is required for dismissal'
      );
    }

    if (typeof request.notificationId !== 'string' || request.notificationId.trim().length === 0) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'INVALID_NOTIFICATION_ID_FORMAT',
        'Notification ID must be a non-empty string'
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
   * Handle side effects of notification dismissal
   *
   * @description
   * Manages audit logging, domain event publishing, and other side effects
   * after successful notification dismissal. Uses high-precision timestamps
   * for accurate audit trails and publishes domain events for business process tracking.
   *
   * @param request The dismissal request with notification ID and requester
   * @param correlationId Correlation ID for tracing
   */
  private async handleNotificationDismissalSideEffects(
    request: DismissNotificationRequest,
    correlationId?: string
  ): Promise<void> {
    const timestampSeconds = this.clock.nowEpochSeconds();
    const timestamp = new Date(timestampSeconds * 1000); // Convert to milliseconds

    // Log comprehensive audit information using Core Logger
    this.logger.info(`Notification dismissed successfully at ${timestamp.toISOString()}`, {
      operation: 'dismiss_notification',
      correlationId,
      userId: request.requesterId?.toString(),
    } as LogContext);

    // Publish domain event for business process tracking
    try {
      const event = DomainEvent.create({
        id: `notification-dismissed-${Date.now()}`,
        eventType: DomainEventType.NOTIFICATION_DISMISSED,
        aggregateId: request.notificationId,
        aggregateType: 'Notification',
        eventData: {
          notificationId: request.notificationId,
          dismissedBy: request.requesterId?.toString(),
          dismissedAt: timestamp.toISOString(),
          correlationId,
        },
        occurredAt: ISODateTime.fromDate(timestamp),
      });

      const publishContract: PublishEventContract = {
        event,
      };

      await this.eventBus.publish(publishContract);

      this.logger.debug('Domain event published for notification dismissal', {
        operation: 'dismiss_notification',
        correlationId,
        eventId: event.id,
      } as LogContext);
    } catch (eventError) {
      // Log event publishing failure but don't fail the main operation
      this.logger.warn('Failed to publish domain event for notification dismissal', {
        operation: 'dismiss_notification',
        correlationId,
        error: eventError instanceof Error ? eventError.message : 'Unknown event error',
      } as LogContext);
    }
  }
}
