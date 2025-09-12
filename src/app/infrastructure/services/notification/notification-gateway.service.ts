import { Injectable, signal, inject } from '@angular/core';
import { NOTIFICATION_CONFIG, NotificationConfig } from '@di/tokens';
import { NotificationPort } from '@/app/domain/repositories/business/notification.repository';
import {
  NewNotification,
  Notification,
  NotificationId,
} from '@domain/entities/notification.entity';
import { UINotificationPosition } from '@presentation/shared/components/toast/enums/ui-notification-position.enum';
import { NotificationType } from '@/app/domain/enums/notification-type.enum';

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
  private cfg = inject<NotificationConfig>(NOTIFICATION_CONFIG);
  private listSig = signal<Notification[]>([]);
  private subs = new Set<(list: Notification[]) => void>();
  private timers = new Map<NotificationId, ReturnType<typeof setTimeout>>();

  // Helpers
  private newId(): NotificationId {
    return Math.random().toString(36).slice(2);
  }

  private now(): number {
    return Date.now();
  }

  /**
   * Maps domain notification types to configuration keys
   * This bridges the gap between domain concepts and infrastructure config
   */
  private mapCategoryToConfigKey(category: NotificationType): keyof NotificationConfig['defaults'] {
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
        return 'info'; // fallback
    }
  }

  onChange(sub: (list: Notification[]) => void): () => void {
    this.subs.add(sub);
    sub(this.listSig());
    return () => this.subs.delete(sub);
  }

  snapshot(): Notification[] {
    return this.listSig();
  }

  push(n: NewNotification): NotificationId {
    // Use the domain entity factory method to create a valid notification
    const domainNotification = Notification.create(n);
    const id = domainNotification.id;

    // Map domain category to infrastructure configuration
    // Note: Configuration is handled by domain entity, no additional infra config needed

    // Duplicate checking removed in simplified notification system

    this.listSig.update((list) => [domainNotification, ...list]);
    this.emit();

    // Auto-dismiss timer removed in simplified notification system

    return id;
  }

  update(id: NotificationId, patch: Partial<NewNotification>): void {
    // Since domain entities are immutable, we need to recreate the notification
    // This is a simplified implementation - in a real system you might want to
    // store updates separately or use a different approach

    const existingNotification = this.listSig().find((n) => n.id === id);
    if (!existingNotification) return;

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
    } catch (error) {
      console.warn('Failed to update notification:', error);
    }
  }

  dismiss(id: NotificationId): void {
    this.listSig.update((list) => list.filter((n) => n.id !== id));

    // Clear timer
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }

    this.emit();
  }

  clear(): void {
    // Clear all timers
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();

    this.listSig.set([]);
    this.emit();
  }

  private emit(): void {
    const list = this.listSig();
    this.subs.forEach((sub) => sub(list));
  }

  /**
   * Gets default UI position based on device type
   * This is purely infrastructure concern
   */
  private defaultPosition(): UINotificationPosition {
    // Simple device detection - in a real app you might use a service
    const isMobile = window.innerWidth < 768;
    return isMobile ? this.cfg.defaults.position.mobile : this.cfg.defaults.position.desktop;
  }
}
