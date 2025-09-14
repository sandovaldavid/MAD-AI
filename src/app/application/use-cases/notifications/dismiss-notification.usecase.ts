import { Injectable, inject } from '@angular/core';
import { NOTIFICATION_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import type { NotificationPort } from '@domain/repositories/business/notification.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { DismissNotificationRequest } from '@application/types/notifications.types';

/**
 * Dismiss Notification Use Case
 *
 * @description
 * Simple Application layer orchestrator for notification dismissal.
 * Delegates to domain repository for the actual dismissal operation.
 */
@Injectable({ providedIn: 'root' })
export class DismissNotification {
  private readonly notificationPort = inject<NotificationPort>(NOTIFICATION_PORT);
  private readonly logger = inject<Logger>(LOGGER_PORT);

  /**
   * Execute notification dismissal
   */
  async execute(request: DismissNotificationRequest): Promise<void> {
    try {
      // Step 1: Delegate to domain repository for dismissal
      this.notificationPort.dismiss(request.notificationId);

      // Step 2: Log success
      this.logger.info(`Notification ${request.notificationId} dismissed successfully`);
    } catch (error: unknown) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Failed to dismiss notification',
        'Unable to dismiss notification at this time'
      );
    }
  }
}
