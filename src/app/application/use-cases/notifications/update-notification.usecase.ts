import { Injectable, inject } from '@angular/core';
import { NOTIFICATION_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import type { NotificationPort } from '@domain/repositories/business/notification.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { UpdateNotificationRequest } from '@application/types/notifications.types';

/**
 * Update Notification Use Case
 *
 * @description
 * Simple Application layer orchestrator for notification updates.
 * Uses entity-first pattern - delegates all business logic to Domain entities.
 */
@Injectable({ providedIn: 'root' })
export class UpdateNotification {
  private readonly notificationPort = inject<NotificationPort>(NOTIFICATION_PORT);
  private readonly logger = inject<Logger>(LOGGER_PORT);

  /**
   * Execute notification update orchestration
   */
  async execute(request: UpdateNotificationRequest): Promise<void> {
    try {
      // Step 1: Retrieve notification entity from domain repository
      const notification = await this.notificationPort.findById(request.notificationId);
      if (!notification) {
        throw new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Notification not found',
          `Notification with ID '${request.notificationId}' does not exist`
        );
      }

      // Step 2: Execute business operations through domain entity methods
      if (request.updateData.message !== undefined) {
        notification.updateMessage(request.updateData.message);
      }
      if (request.updateData.type !== undefined) {
        notification.updateType(request.updateData.type);
      }
      if (request.updateData.title !== undefined) {
        notification.updateTitle(request.updateData.title);
      }
      if (request.updateData.channel !== undefined) {
        notification.updateChannel(request.updateData.channel);
      }
      if (request.updateData.isRead === true) {
        notification.markAsRead();
      }

      // Step 3: Persist updated entity
      await this.notificationPort.save(notification);

      // Step 4: Log success
      this.logger.info(`Notification ${request.notificationId} updated successfully`);
    } catch (error: unknown) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          error.message,
          'Failed to update notification'
        );
      }
      throw ApplicationError.unexpectedError();
    }
  }
}
