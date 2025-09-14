import { Injectable, inject } from '@angular/core';
import { NOTIFICATION_PORT } from '@di/tokens';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import type { NotificationPort } from '@domain/repositories/business/notification.repository';
import type { SubscribeToNotificationsRequest } from '@application/types/notifications.types';

/**
 * Subscribe to Notifications Use Case
 *
 * @description
 * Simple Application layer orchestrator for notification subscription.
 * Delegates directly to domain repository for reactive notifications.
 */
@Injectable({ providedIn: 'root' })
export class SubscribeToNotifications {
  private readonly notificationPort = inject<NotificationPort>(NOTIFICATION_PORT);

  /**
   * Execute notification subscription
   */
  async execute(request: SubscribeToNotificationsRequest): Promise<() => void> {
    if (!request.callback || typeof request.callback !== 'function') {
      throw new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Invalid callback',
        'Callback function is required for notification subscription'
      );
    }

    // Delegate to domain repository for subscription
    return this.notificationPort.onChange(request.callback);
  }
}
