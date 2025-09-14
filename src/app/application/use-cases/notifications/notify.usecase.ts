import { inject, Injectable } from '@angular/core';
import { NOTIFICATION_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import type { NotificationPort } from '@domain/repositories/business/notification.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { NewNotification, NotificationId } from '@domain/entities/notification.entity';
import { NotifyRequest } from '@application/types/notifications.types';

/**
 * Notify Use Case
 *
 * @description
 * Simple Application layer orchestrator for notification creation.
 * Delegates all business logic and validation to the Domain layer.
 *
 * @responsibilities
 * - Coordinate notification creation through Domain entity
 * - Handle basic error transformation
 * - Provide minimal logging
 *
 * @architecture
 * - Application Layer orchestrator (4-step pattern)
 * - Uses Domain repository through dependency injection
 * - Follows Clean Architecture principles
 */
@Injectable({ providedIn: 'root' })
export class Notify {
  private readonly notificationPort = inject<NotificationPort>(NOTIFICATION_PORT);
  private readonly logger = inject<Logger>(LOGGER_PORT);

  /**
   * Execute notification creation orchestration
   *
   * @param request - Notification request data
   * @returns NotificationId for the created notification
   * @throws ApplicationError when creation fails
   */
  async execute(request: NotifyRequest): Promise<NotificationId> {
    try {
      // Step 1: Convert to domain entity (validates automatically)
      const notification: NewNotification = {
        type: request.type,
        message: request.message,
        title: request.description,
        userId: request.userId?.toString(),
      };

      // Step 2: Delegate to domain repository (creates and validates)
      const notificationId = this.notificationPort.push(notification);

      // Step 3: Log success
      this.logger.info(`Notification created: ${notificationId}`);

      return notificationId;
    } catch (error: unknown) {
      // Step 4: Transform domain errors to application errors
      if (error instanceof Error) {
        throw new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          error.message,
          'Failed to create notification'
        );
      }
      throw ApplicationError.unexpectedError();
    }
  }
}
