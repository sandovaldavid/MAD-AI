import { Injectable, inject } from '@angular/core';
import { NOTIFICATION_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import type { NotificationPort } from '@domain/repositories/business/notification.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { ClearNotificationsRequest } from '@application/types/notifications.types';

/**
 * Clear Notifications Use Case
 *
 * @description
 * Simple Application layer orchestrator for clearing all notifications.
 * Delegates to domain repository for the actual clearing operation.
 */
@Injectable({ providedIn: 'root' })
export class ClearNotifications {
  private readonly notificationPort = inject<NotificationPort>(NOTIFICATION_PORT);
  private readonly logger = inject<Logger>(LOGGER_PORT);

  /**
   * Execute notification clearing
   */
  async execute(request: ClearNotificationsRequest): Promise<void> {
    try {
      // Step 1: Get current count for logging
      const currentNotifications = this.notificationPort.snapshot();
      const totalCleared = currentNotifications.length;

      // Step 2: Delegate to domain repository for clearing
      this.notificationPort.clear();

      // Step 3: Log success
      this.logger.info(`All notifications cleared: ${totalCleared} notifications removed`);
    } catch (error: unknown) {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Failed to clear notifications',
        'Unable to clear notifications at this time'
      );
    }
  }
}
