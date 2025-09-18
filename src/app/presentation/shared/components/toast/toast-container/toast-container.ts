import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationsFacade } from '@application/facades/notifications.facade';
import { NOTIFICATION_CONFIG, NotificationConfig } from '@app/di/tokens';
import { ToastItem, ToastViewModel } from '../toast-item/toast-item';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, ToastItem],
  templateUrl: './toast-container.html',
  styleUrls: ['./toast-container.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainer {
  private facade = inject(NotificationsFacade);
  private cfg = inject<NotificationConfig>(NOTIFICATION_CONFIG);
  // Define the notification types for template usage
  readonly NotificationType = {
    SUCCESS: 'success' as const,
    ERROR: 'error' as const,
    WARNING: 'warning' as const,
    INFO: 'info' as const,
  };
  // Transform Domain notifications to Presentation view models
  items = computed(() => {
    const notifications = this.facade.notifications();
    return notifications.map((notification) => this.toViewModel(notification));
  });

  cap = () =>
    typeof window !== 'undefined' && window.matchMedia?.('(max-width: 640px)').matches
      ? this.cfg.maxVisibleMobile
      : this.cfg.maxVisibleDesktop;

  // For now, all notifications use the same position configured in the service
  // In a more complex implementation, you could have different containers for different positions
  allItems = () => this.items().slice(0, this.cap());

  trackId = (_: number, t: ToastViewModel) => t.id;

  close(id: string) {
    this.facade.dismiss({ notificationId: id });
  }

  async onAction(_id: string, _which: 'primary' | 'secondary') {
    // Actions are not supported in the simplified notification model
    // This method is kept for interface compatibility but does nothing
    return;
  }

  pause(id: string) {
    // Pause functionality not implemented in simplified model
    console.log('Pause notification:', id);
  }
  resume(id: string) {
    // Resume functionality not implemented in simplified model
    console.log('Resume notification:', id);
  }

  private toViewModel(notification: any): ToastViewModel {
    return {
      id: notification.id,
      type: notification.type,
      message: notification.message,
      title: notification.title,
      description: notification.description,
      timestamp: notification.timestamp,
    };
  }
}
