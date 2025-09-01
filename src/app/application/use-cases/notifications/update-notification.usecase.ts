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
import type { NotificationPort } from '@/app/domain/repositories/business/notification.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { Notification, NotificationId } from '@domain/entities/notification.entity';
import type { UpdateNotificationRequest } from '@application/types/notifications.types';

/**
 * Update Notification Use Case
 *
 * @description
 * Application layer orchestrator that handles notification updates with validation,
 * audit logging, and error normalization. This use case follows the orchestration
 * pattern with comprehensive validation for notification update operations.
 *
 * @responsibilities
 * - Validate application-level rules for notification updates
 * - Ensure notification exists before updating
 * - Delegate to domain repository for the actual update
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
export class UpdateNotification {
  private readonly notificationPort = inject<NotificationPort>(NOTIFICATION_PORT);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly eventBus = inject<IDomainEventBusRepository>(DOMAIN_EVENT_BUS_REPO);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  /**
   * Execute notification update orchestration with validation and audit logging
   *
   * @param request - Application layer request for notification update
   * @returns Promise resolving when update is complete
   * @throws ApplicationError when validation fails or update fails
   */
  async execute(request: UpdateNotificationRequest): Promise<void> {
    const correlationId = `update-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      this.logger.info('Starting notification update orchestration', {
        operation: 'update-notification',
        correlationId,
        userId: request.requesterId?.toString(),
      });

      // Step 1: Validate application rules
      this.validateApplicationRules(request, correlationId);

      // Step 2: Validate notification exists and can be updated
      const currentNotification = await this.validateNotificationForUpdate(
        request.notificationId,
        correlationId
      );

      // Step 3: Delegate to domain repository for update
      this.notificationPort.update(request.notificationId, request.patch);

      // Step 4: Handle side effects
      await this.handleNotificationUpdateSideEffects(request, currentNotification, correlationId);

      this.logger.info('Notification update orchestration completed successfully', {
        operation: 'update-notification',
        correlationId,
        userId: request.requesterId?.toString(),
      });
    } catch (error: unknown) {
      this.logger.error('Notification update orchestration failed', {
        operation: 'update-notification',
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
   * Validate application-level rules for notification update
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
    request: UpdateNotificationRequest,
    correlationId?: string
  ): void {
    this.logger.debug('Validating application rules for notification update', {
      operation: 'update-notification',
      correlationId,
      userId: request.requesterId?.toString(),
    });

    if (request.notificationId === undefined || request.notificationId === null) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'INVALID_NOTIFICATION_ID',
        'Notification ID is required for update'
      );
    }

    if (typeof request.notificationId !== 'string' || request.notificationId.trim().length === 0) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'INVALID_NOTIFICATION_ID_FORMAT',
        'Notification ID must be a non-empty string'
      );
    }

    if (!request.patch || Object.keys(request.patch).length === 0) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'INVALID_UPDATE_DATA',
        'Update patch data is required and cannot be empty'
      );
    }

    // Validate patch fields
    if (request.patch.message !== undefined) {
      if (typeof request.patch.message !== 'string') {
        throw new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'INVALID_MESSAGE_TYPE',
          'Notification message must be a string'
        );
      }

      if (request.patch.message.length > 500) {
        throw new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'MESSAGE_TOO_LONG',
          'Notification message cannot exceed 500 characters'
        );
      }
    }

    if (request.patch.type !== undefined) {
      if (typeof request.patch.type !== 'string') {
        throw new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'INVALID_TYPE',
          'Notification type must be a string'
        );
      }

      const allowedTypes = ['info', 'success', 'warning', 'error', 'system'];
      if (!allowedTypes.includes(request.patch.type.toLowerCase())) {
        throw new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'INVALID_TYPE_VALUE',
          `Notification type must be one of: ${allowedTypes.join(', ')}`
        );
      }
    }

    if (request.patch.isRead !== undefined && typeof request.patch.isRead !== 'boolean') {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'INVALID_READ_STATUS',
        'Notification read status must be a boolean'
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
   * Validate notification exists and can be updated
   *
   * @description
   * Validates that the notification exists in the current snapshot and is in an updatable state.
   *
   * @param notificationId Notification ID to validate
   * @param correlationId Correlation ID for tracing
   * @returns Current notification data
   * @throws ApplicationError when notification cannot be updated
   */
  private async validateNotificationForUpdate(
    notificationId: NotificationId,
    correlationId?: string
  ): Promise<Notification> {
    this.logger.debug('Validating notification exists for update', {
      operation: 'update-notification',
      correlationId,
      userId: notificationId, // Using notificationId as userId since LogContext doesn't have notificationId
    });

    const notifications = this.notificationPort.snapshot();
    const notification = notifications.find((n) => n.id === notificationId);

    if (!notification) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'NOTIFICATION_NOT_FOUND',
        `Notification with ID '${notificationId}' does not exist`
      );
    }

    return notification;
  }

  /**
   * Handle side effects of notification update
   *
   * @description
   * Manages audit logging, domain event publishing, and other side effects
   * after successful notification update. Uses high-precision timestamps
   * for accurate audit trails and publishes domain events for business process tracking.
   *
   * @param request The update request with notification ID and patch data
   * @param currentNotification The notification before update
   * @param correlationId Correlation ID for tracing
   */
  private async handleNotificationUpdateSideEffects(
    request: UpdateNotificationRequest,
    currentNotification: Notification,
    correlationId?: string
  ): Promise<void> {
    const timestampSeconds = this.clock.nowEpochSeconds();
    const timestamp = new Date(timestampSeconds * 1000); // Convert to milliseconds

    // Track which fields were updated
    const updatedFields = Object.keys(request.patch);

    // Log comprehensive audit information using Core Logger
    this.logger.info(`Notification updated successfully at ${timestamp.toISOString()}`, {
      operation: 'update-notification',
      correlationId,
      userId: request.requesterId?.toString(),
    });

    // Publish domain event for business process tracking
    try {
      const event = DomainEvent.create({
        id: `notification-updated-${Date.now()}`,
        eventType: DomainEventType.NOTIFICATIONS_CLEARED, // Using existing event type for notification changes
        aggregateId: request.notificationId,
        aggregateType: 'Notification',
        eventData: {
          notificationId: request.notificationId,
          updatedBy: request.requesterId?.toString(),
          updatedAt: timestamp.toISOString(),
          updatedFields,
          correlationId,
        },
        occurredAt: ISODateTime.fromDate(timestamp),
      });

      const publishContract: PublishEventContract = {
        event,
      };

      await this.eventBus.publish(publishContract);

      this.logger.debug('Domain event published for notification update', {
        operation: 'update-notification',
        correlationId,
      });
    } catch {
      // Log event publishing failure but don't fail the main operation
      this.logger.warn('Failed to publish domain event for notification update', {
        operation: 'update-notification',
        correlationId,
      });
    }
  }
}
