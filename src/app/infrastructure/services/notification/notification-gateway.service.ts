import { Injectable, signal, inject } from '@angular/core';
import { NOTIFICATION_CONFIG, NotificationConfig, LOGGER_PORT } from '@di/tokens';
import { Logger } from '@core/interfaces/logger.interface';
import { InfrastructureError } from '@infrastructure/errors/infrastructure-error';
import { NotificationPort } from '@domain/repositories/business/notification.repository';
import {
  NewNotification,
  Notification,
  NotificationId,
} from '@domain/entities/notification.entity';
import { NotificationType } from '@domain/enums/notification-type.enum';

/**
 * Notification Gateway Service (Infrastructure Layer)
 *
 * Implements the NotificationPort interface from domain layer
 * and acts as an adapter between domain concepts and UI infrastructure.
 *
 * Responsibilities:
 * - Store notifications in memory
 * - Handle notification lifecycle (creation, updates, dismissal)
 * - Map domain notification categories to UI configuration
 * - Manage notification positioning and timing
 *
 * @fileoverview Infrastructure service for notification management
 * @module Infrastructure/Services
 * @since 1.0.0
 */
@Injectable({ providedIn: 'root' })
export class NotificationGatewayService implements NotificationPort {
  private readonly cfg = inject<NotificationConfig>(NOTIFICATION_CONFIG);
  private readonly logger = inject<Logger>(LOGGER_PORT);
  private readonly listSig = signal<Notification[]>([]);
  private readonly subs = new Set<(list: Notification[]) => void>();
  private readonly timers = new Map<NotificationId, ReturnType<typeof setTimeout>>();

  /**
   * Maps domain notification types to configuration keys
   * This bridges the gap between domain concepts and infrastructure config
   */
  private mapCategoryToConfigKey(category: NotificationType): keyof NotificationConfig['defaults'] {
    try {
      switch (category) {
        case 'success':
          return 'success';
        case 'info':
          return 'info';
        case 'warning':
          return 'warning';
        case 'error':
          return 'error';
        default:
          this.logger.warn(`Unknown notification type: ${category}, using default`, {
            operation: 'mapCategoryToConfigKey',
          });
          return 'info'; // fallback
      }
    } catch (error) {
      this.logger.error(`Failed to map notification category: ${category}`, {
        operation: 'mapCategoryToConfigKey',
      });
      throw new InfrastructureError(
        'Failed to map notification category to configuration',
        'NOTIFICATION_MAPPING_ERROR',
        'API',
        false,
        { category, originalError: error },
        undefined,
        error instanceof Error ? error : new Error('Unknown mapping error')
      );
    }
  }

  onChange(sub: (list: Notification[]) => void): () => void {
    this.logger.debug('Adding notification subscription', {
      operation: 'onChange',
    });

    try {
      this.subs.add(sub);
      sub(this.listSig());

      this.logger.debug(`Notification subscription added. Total subscribers: ${this.subs.size}`, {
        operation: 'onChange',
      });

      return () => {
        this.subs.delete(sub);
        this.logger.debug(
          `Notification subscription removed. Total subscribers: ${this.subs.size}`,
          {
            operation: 'onChange',
          }
        );
      };
    } catch (error) {
      this.logger.error('Failed to add notification subscription', {
        operation: 'onChange',
      });
      throw new InfrastructureError(
        'Failed to add notification subscription',
        'NOTIFICATION_SUBSCRIPTION_ERROR',
        'API',
        false,
        { originalError: error },
        undefined,
        error instanceof Error ? error : new Error('Unknown subscription error')
      );
    }
  }

  snapshot(): Notification[] {
    this.logger.debug(
      `Returning notification snapshot with ${this.listSig().length} notifications`,
      {
        operation: 'snapshot',
      }
    );
    return this.listSig();
  }

  push(n: NewNotification): NotificationId {
    this.logger.debug('Creating new notification', {
      operation: 'push',
      correlationId: `notification-${Date.now()}`,
    });

    try {
      // Use the domain entity factory method to create a valid notification
      const domainNotification = Notification.create(n);
      const id = domainNotification.id;

      // Map domain category to infrastructure configuration
      // Note: Configuration is handled by domain entity, no additional infra config needed

      // Duplicate checking removed in simplified notification system

      this.listSig.update((list) => [domainNotification, ...list]);
      this.emit();

      this.logger.info(`Notification created successfully with ID: ${id}`, {
        operation: 'push',
        userId: n.userId?.toString(),
        correlationId: `notification-${id}`,
      });

      // Auto-dismiss timer removed in simplified notification system

      return id;
    } catch (error) {
      this.logger.error(
        `Failed to create notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          operation: 'push',
          userId: n.userId?.toString(),
        }
      );
      throw new InfrastructureError(
        'Failed to create notification',
        'NOTIFICATION_CREATE_ERROR',
        'API',
        true,
        { notificationData: n, originalError: error },
        undefined,
        error instanceof Error ? error : new Error('Unknown notification creation error')
      );
    }
  }

  update(id: NotificationId, patch: Partial<NewNotification>): void {
    this.logger.debug(`Updating notification: ${id}`, {
      operation: 'update',
      correlationId: `notification-update-${id}`,
    });

    // Since domain entities are immutable, we need to recreate the notification
    // This is a simplified implementation - in a real system you might want to
    // store updates separately or use a different approach

    const existingNotification = this.listSig().find((n) => n.id === id);
    if (!existingNotification) {
      this.logger.warn(`Notification not found for update: ${id}`, {
        operation: 'update',
        correlationId: `notification-update-${id}`,
      });
      return;
    }

    // Timer functionality removed in simplified notification system

    // For simplicity, we'll just recreate the notification with updated properties
    // In a real implementation, you might want to handle this differently
    try {
      const updatedNotificationData: NewNotification = {
        type: patch.type ?? existingNotification.type,
        message: patch.message ?? existingNotification.message,
        title: patch.title ?? existingNotification.title,
        userId: patch.userId ?? existingNotification.userId,
        channel: patch.channel ?? existingNotification.channel,
      };

      const updatedNotification = Notification.createWithId(updatedNotificationData, id);

      this.listSig.update((list) =>
        list.map((notif) => (notif.id === id ? updatedNotification : notif))
      );

      this.emit();

      this.logger.info(`Notification updated successfully: ${id}`, {
        operation: 'update',
        correlationId: `notification-update-${id}`,
      });
    } catch (error) {
      // Handle validation errors gracefully - warn instead of throwing
      console.warn('Failed to update notification:', error);
      this.logger.error(
        `Failed to update notification ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          operation: 'update',
          correlationId: `notification-update-${id}`,
        }
      );
    }
  }

  dismiss(id: NotificationId): void {
    this.logger.debug(`Dismissing notification: ${id}`, {
      operation: 'dismiss',
      correlationId: `notification-dismiss-${id}`,
    });

    try {
      const existingNotification = this.listSig().find((n) => n.id === id);
      if (!existingNotification) {
        this.logger.warn(`Notification not found for dismissal: ${id}`, {
          operation: 'dismiss',
          correlationId: `notification-dismiss-${id}`,
        });
        return;
      }

      this.listSig.update((list) => list.filter((n) => n.id !== id));

      // Clear timer
      const timer = this.timers.get(id);
      if (timer) {
        clearTimeout(timer);
        this.timers.delete(id);
      }

      this.emit();

      this.logger.info(`Notification dismissed successfully: ${id}`, {
        operation: 'dismiss',
        correlationId: `notification-dismiss-${id}`,
      });
    } catch (error) {
      this.logger.error(
        `Failed to dismiss notification ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          operation: 'dismiss',
          correlationId: `notification-dismiss-${id}`,
        }
      );
      throw new InfrastructureError(
        `Failed to dismiss notification ${id}`,
        'NOTIFICATION_DISMISS_ERROR',
        'API',
        true,
        { notificationId: id, originalError: error },
        undefined,
        error instanceof Error ? error : new Error('Unknown notification dismiss error')
      );
    }
  }

  clear(): void {
    this.logger.debug('Clearing all notifications', {
      operation: 'clear',
    });

    try {
      const currentCount = this.listSig().length;

      // Clear all timers
      this.timers.forEach((timer) => clearTimeout(timer));
      this.timers.clear();

      this.listSig.set([]);
      this.emit();

      this.logger.info(`Cleared ${currentCount} notifications successfully`, {
        operation: 'clear',
      });
    } catch (error) {
      this.logger.error(
        `Failed to clear notifications: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          operation: 'clear',
        }
      );
      throw new InfrastructureError(
        'Failed to clear notifications',
        'NOTIFICATION_CLEAR_ERROR',
        'API',
        true,
        { originalError: error },
        undefined,
        error instanceof Error ? error : new Error('Unknown notification clear error')
      );
    }
  }

  async findById(id: NotificationId): Promise<Notification | null> {
    this.logger.debug(`Finding notification by ID: ${id}`, {
      operation: 'findById',
      correlationId: `notification-find-${id}`,
    });

    try {
      const notification = this.listSig().find((n) => n.id === id);
      const found = notification || null;

      this.logger.debug(`Notification ${found ? 'found' : 'not found'}: ${id}`, {
        operation: 'findById',
        correlationId: `notification-find-${id}`,
      });

      return found;
    } catch (error) {
      this.logger.error(
        `Failed to find notification ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          operation: 'findById',
          correlationId: `notification-find-${id}`,
        }
      );
      throw new InfrastructureError(
        `Failed to find notification ${id}`,
        'NOTIFICATION_FIND_ERROR',
        'API',
        true,
        { notificationId: id, originalError: error },
        undefined,
        error instanceof Error ? error : new Error('Unknown notification find error')
      );
    }
  }

  async save(notification: Notification): Promise<void> {
    this.logger.debug(`Saving notification: ${notification.id}`, {
      operation: 'save',
      correlationId: `notification-save-${notification.id}`,
    });

    try {
      this.listSig.update((list) =>
        list.map((notif) => (notif.id === notification.id ? notification : notif))
      );
      this.emit();

      this.logger.info(`Notification saved successfully: ${notification.id}`, {
        operation: 'save',
        correlationId: `notification-save-${notification.id}`,
      });
    } catch (error) {
      this.logger.error(
        `Failed to save notification ${notification.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          operation: 'save',
          correlationId: `notification-save-${notification.id}`,
        }
      );
      throw new InfrastructureError(
        `Failed to save notification ${notification.id}`,
        'NOTIFICATION_SAVE_ERROR',
        'API',
        true,
        { notificationId: notification.id, originalError: error },
        undefined,
        error instanceof Error ? error : new Error('Unknown notification save error')
      );
    }
  }

  private emit(): void {
    try {
      const list = this.listSig();
      this.subs.forEach((sub) => sub(list));

      this.logger.debug(`Emitted notification list to ${this.subs.size} subscribers`, {
        operation: 'emit',
      });
    } catch (error) {
      this.logger.error(
        `Failed to emit notification list: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          operation: 'emit',
        }
      );
      throw new InfrastructureError(
        'Failed to emit notification list to subscribers',
        'NOTIFICATION_EMIT_ERROR',
        'API',
        true,
        { subscriberCount: this.subs.size, originalError: error },
        undefined,
        error instanceof Error ? error : new Error('Unknown notification emit error')
      );
    }
  }

  private defaultPosition(): string {
    // Return desktop position for wide screens, mobile position for narrow screens
    return window.innerWidth >= 768 ? 'top-right' : 'top';
  }
}
