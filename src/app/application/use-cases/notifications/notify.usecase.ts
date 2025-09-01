import { inject, Injectable } from '@angular/core';
import { NOTIFICATION_PORT, CLOCK_PORT, LOGGER_PORT, DOMAIN_EVENT_BUS_REPO } from '@di/tokens';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import type { NotificationPort } from '@domain/repositories/business/notification.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { IDomainEventBusRepository } from '@domain/repositories/business/domain-event-bus.repository';
import type { NewNotification, NotificationId } from '@domain/entities/notification.entity';
import { NotifyRequest } from '@application/types/notifications.types';

/**
 * Notify Use Case
 *
 * @description
 * Application layer orchestrator that handles notification creation with validation,
 * audit logging, and error normalization. This use case follows the orchestration
 * pattern with comprehensive validation for notification operations.
 *
 * @responsibilities
 * - Validate application-level rules for notification creation
 * - Delegate to notification port for the actual notification
 * - Handle audit logging and side effects
 * - Normalize errors for consistent application layer handling
 *
 * @architecture
 * - Application Layer orchestrator
 * - Uses notification port through dependency injection
 * - Integrates with system clock for precise timestamping
 * - Follows 4-step orchestration pattern
 *
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class Notify {
  private readonly notificationPort = inject<NotificationPort>(NOTIFICATION_PORT);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly eventBus = inject<IDomainEventBusRepository>(DOMAIN_EVENT_BUS_REPO);
  private readonly errorTransformer = inject(ApplicationErrorTransformer);

  /**
   * Execute notification creation orchestration with validation, logging and event publishing
   *
   * @param request - Notification request data from Application layer
   * @returns NotificationId for the created notification
   * @throws ApplicationError when validation fails or notification fails
   */
  async execute(request: NotifyRequest): Promise<NotificationId> {
    const correlationId = `notify-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      this.logger.info('Starting notification creation orchestration', {
        operation: `notify - ${request.type}`,
        correlationId,
        userId: request.userId?.toString(),
      });

      // Step 1: Validate application rules
      this.validateApplicationRules(request, correlationId);

      // Step 2: Convert to domain entity and create notification
      const notificationId = this.createNotification(request, correlationId);

      // Step 3: Handle side effects (logging, events, statistics)
      await this.handleNotificationSideEffects(request, notificationId, correlationId);

      this.logger.info('Notification creation orchestration completed successfully', {
        operation: 'notify',
        correlationId,
        userId: request.userId?.toString(),
      });

      return notificationId;
    } catch (error: unknown) {
      this.logger.error('Notification creation orchestration failed', {
        operation: 'notify',
        correlationId,
        userId: request.userId?.toString(),
      });

      // Normalize errors for application layer
      throw this.errorTransformer.transform(error, {
        correlationId,
        userId: request.userId?.toString(),
      });
    }
  }

  /**
   * Create notification from request
   *
   * @description
   * Converts NotifyRequest to NewNotification and delegates to domain repository
   *
   * @param request Application layer request
   * @param correlationId Correlation ID for tracing
   * @returns NotificationId of created notification
   */
  private createNotification(request: NotifyRequest, correlationId?: string): NotificationId {
    this.logger.debug('Creating notification from request', {
      operation: 'notify',
      correlationId,
      userId: request.userId?.toString(),
    });

    // Convert NotifyRequest to NewNotification (domain entity)
    const notification: NewNotification = {
      type: request.type,
      message: request.message,
      title: request.description, // Map description to title
      userId: request.userId?.toString(), // Convert to string as expected by domain
    };

    // Delegate to domain repository
    return this.notificationPort.push(notification);
  }

  /**
   * Validate application-level rules for notification creation
   *
   * @description
   * Validates request parameters and basic business rules specific to the application layer.
   * Domain validation is handled by the notification port.
   *
   * @param request Application layer request to validate
   * @param correlationId Correlation ID for tracing
   * @throws ApplicationError when validation fails
   */
  private validateApplicationRules(request: NotifyRequest, correlationId?: string): void {
    this.logger.debug('Validating application rules for notification creation', {
      operation: `notify - ${request.type}`,
      correlationId,
    });

    if (!request) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'INVALID_NOTIFICATION_REQUEST',
        'Notification request is required'
      );
    }

    if (!request.message || typeof request.message !== 'string') {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'INVALID_NOTIFICATION_MESSAGE',
        'Notification message is required and must be a string'
      );
    }

    if (!request.type || typeof request.type !== 'string') {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'INVALID_NOTIFICATION_TYPE',
        'Notification type is required and must be a string'
      );
    }

    // Validate message length
    if (request.message.length > 500) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'NOTIFICATION_MESSAGE_TOO_LONG',
        'Notification message cannot exceed 500 characters'
      );
    }

    // Validate type is from allowed list
    const allowedTypes = ['info', 'success', 'warning', 'error', 'system'];
    if (!allowedTypes.includes(request.type.toLowerCase())) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'INVALID_NOTIFICATION_TYPE_VALUE',
        `Notification type must be one of: ${allowedTypes.join(', ')}`
      );
    }

    // Validate userId if provided
    if (request.userId !== undefined && request.userId !== null) {
      if (
        typeof request.userId !== 'number' ||
        !Number.isInteger(request.userId) ||
        request.userId <= 0
      ) {
        throw new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'INVALID_USER_ID',
          'User ID must be a positive integer when provided'
        );
      }
    }
  }

  /**
   * Handle side effects of notification creation
   *
   * @description
   * Manages audit logging and domain event publishing after successful notification creation.
   * Uses high-precision timestamps for accurate audit trails.
   *
   * @param request The notification request that was processed
   * @param notificationId The ID of the created notification
   * @param correlationId Correlation ID for tracing
   */
  private async handleNotificationSideEffects(
    request: NotifyRequest,
    notificationId: NotificationId,
    correlationId?: string
  ): Promise<void> {
    const timestamp = this.clock.nowEpochSeconds();

    this.logger.info(`Notification created successfully at ${timestamp}`, {
      operation: `notify \n Notification id: ${notificationId}`,
      correlationId,
      userId: request.userId?.toString(),
    });

    // TODO: Publish domain event for notification creation when domain events are properly defined
    // For now, we rely on structured logging for audit trails
    this.logger.debug('Notification side effects completed', {
      operation: 'notify',
      correlationId,
      userId: request.userId?.toString(),
    });
  }
}
