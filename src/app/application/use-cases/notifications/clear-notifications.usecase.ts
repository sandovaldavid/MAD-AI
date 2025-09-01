import { Injectable, inject } from '@angular/core';
import { NOTIFICATION_PORT, CLOCK_PORT, LOGGER_PORT, DOMAIN_EVENT_BUS_REPO } from '@di/tokens';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { Notification } from '@domain/entities/notification.entity';
import { DomainEvent } from '@domain/events/domain-event.entity';
import { DomainEventType } from '@domain/events/domain-event.enum';
import { ISODateTime } from '@domain/value-objects/iso-datetime.vo';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import { PublishEventContract } from '@domain/repositories/business/domain-event-bus.contract';
import type { NotificationPort } from '@domain/repositories/business/notification.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { IDomainEventBusRepository } from '@domain/repositories/business/domain-event-bus.repository';
import type { ClearNotificationsRequest } from '@application/types/notifications.types';

/**
 * Clear Notifications Use Case
 *
 * @description
 * Application layer orchestrator that handles clearing all notifications with validation,
 * audit logging, domain event publishing, and error normalization. This use case follows
 * the orchestration pattern with comprehensive validation for notification clearing operations.
 *
 * @responsibilities
 * - Validate application-level rules for notification clearing
 * - Delegate to domain repository for the actual clearing
 * - Publish domain events for business process tracking
 * - Handle audit logging and side effects using Core services
 * - Normalize errors for consistent application layer handling
 *
 * @architecture
 * - Application Layer orchestrator (30-40 lines max)
 * - Uses domain repository through dependency injection
 * - Integrates with Core Logger and Domain Event Bus
 * - Follows 4-step orchestration pattern
 *
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class ClearNotifications {
  private readonly notificationPort = inject<NotificationPort>(NOTIFICATION_PORT);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly eventBus = inject<IDomainEventBusRepository>(DOMAIN_EVENT_BUS_REPO);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  /**
   * Execute notification clearing orchestration with validation, logging and event publishing
   *
   * @param request - Application layer request for clearing notifications
   * @returns Promise resolving when clearing is complete
   * @throws ApplicationError when validation fails or clearing fails
   */
  async execute(request: ClearNotificationsRequest): Promise<void> {
    const correlationId = `clear-notifications-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      this.logger.info('Starting notification clearing orchestration', {
        operation: 'clear_notifications',
        correlationId,
        userId: request.requesterId?.toString(),
      });

      // Step 1: Validate application rules
      this.validateApplicationRules(request, correlationId);

      // Step 2: Get current notifications for audit logging before clearing
      const currentNotifications = this.notificationPort.snapshot();

      // Step 3: Delegate to domain repository for clearing
      this.notificationPort.clear();

      // Step 4: Handle side effects (logging, events, statistics)
      await this.handleNotificationClearingSideEffects(
        currentNotifications,
        request,
        correlationId
      );

      this.logger.info('Notification clearing orchestration completed successfully', {
        operation: 'clear_notifications',
        correlationId,
        userId: request.requesterId?.toString(),
      });
    } catch (error: unknown) {
      this.logger.error('Notification clearing orchestration failed', {
        operation: 'clear_notifications',
        correlationId,
        userId: request.requesterId?.toString(),
      });

      // Normalize errors for application layer
      throw this.errorTransformer.transform(error, {
        correlationId,
        userId: request.requesterId?.toString(),
      });
    }
  }

  /**
   * Validate application-level rules for notification clearing
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
    request: ClearNotificationsRequest,
    correlationId?: string
  ): void {
    this.logger.debug('Validating application rules for notification clearing', {
      operation: 'clear_notifications',
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
   * Handle side effects of notification clearing
   *
   * @description
   * Manages audit logging, domain event publishing, and statistics calculation
   * after successful notification clearing. Uses Core Logger and Domain Event Bus.
   *
   * @param clearedNotifications The notifications that were cleared
   * @param request The clear request with requester information
   * @param correlationId Correlation ID for tracing
   */
  private async handleNotificationClearingSideEffects(
    clearedNotifications: Notification[],
    request: ClearNotificationsRequest,
    correlationId?: string
  ): Promise<void> {
    const timestamp = new Date(this.clock.nowEpochSeconds() * 1000);
    const totalCleared = clearedNotifications.length;

    // Log comprehensive audit information using Core Logger
    this.logger.info(`All notifications cleared successfully: ${totalCleared} notifications`, {
      operation: 'clear_notifications',
      correlationId,
      userId: request.requesterId?.toString(),
    });

    // Publish domain event for business process tracking
    try {
      const event = DomainEvent.create({
        id: `notifications-cleared-${Date.now()}`,
        eventType: DomainEventType.NOTIFICATIONS_CLEARED,
        aggregateId: request.requesterId?.toString() || 'system',
        aggregateType: 'User',
        eventData: {
          operation: 'clear_notifications',
          totalCleared,
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

      this.logger.debug('Domain event published for notification clearing', {
        operation: 'clear_notifications',
        correlationId,
      });
    } catch {
      // Log event publishing failure but don't fail the main operation
      this.logger.warn('Failed to publish domain event for notification clearing', {
        operation: 'clear_notifications',
        correlationId,
      });
    }
  }
}
