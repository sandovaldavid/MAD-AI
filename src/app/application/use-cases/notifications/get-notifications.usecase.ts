import { Injectable, inject } from '@angular/core';
import { NOTIFICATION_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import type { NotificationPort } from '@domain/repositories/business/notification.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type {
  GetNotificationsRequest,
  GetNotificationsResult,
} from '@application/types/notifications.types';

/**
 * Get Notifications Use Case
 *
 * @description
 * Simple Application layer orchestrator for notification retrieval.
 * Delegates to domain repository and filters based on user request.
 */
@Injectable({ providedIn: 'root' })
export class GetNotifications {
  private readonly notificationPort = inject<NotificationPort>(NOTIFICATION_PORT);
  private readonly logger = inject<Logger>(LOGGER_PORT);

  /**
   * Execute notification retrieval
   */
  async execute(request: GetNotificationsRequest): Promise<GetNotificationsResult> {
    try {
      // Step 1: Get all notifications from domain repository
      const allNotifications = await this.notificationPort.snapshot();

      // Step 2: Filter by user if specified
      const notifications = request.requesterId
        ? allNotifications.filter((n) => n.userId === request.requesterId?.toString())
        : allNotifications;

      // Step 3: Return result
      const result: GetNotificationsResult = {
        notifications,
        totalCount: notifications.length,
      };

      this.logger.info(`Notifications retrieved: ${notifications.length} total`);
      return result;
    } catch {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Failed to retrieve notifications',
        'Unable to get notifications at this time'
      );
    }
  }
}
