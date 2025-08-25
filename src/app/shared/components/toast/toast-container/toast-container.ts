import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationsFacade } from '@application/facades/notifications.facade';
import { NOTIFICATION_CONFIG, NotificationConfig } from '@app/di/tokens';
import { ToastItem } from '../toast-item/toast-item';

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
  items = this.facade.notifications;

  cap = () =>
    typeof window !== 'undefined' && window.matchMedia?.('(max-width: 640px)').matches
      ? this.cfg.maxVisibleMobile
      : this.cfg.maxVisibleDesktop;

  // For now, all notifications use the same position configured in the service
  // In a more complex implementation, you could have different containers for different positions
  allItems = () => this.items().slice(0, this.cap());

  trackId = (_: any, t: any) => t.id;

  close(id: string) {
    this.facade.dismiss({ notificationId: id });
  }

  async onAction(id: string, which: 'primary' | 'secondary') {
    const item = this.items().find((x: any) => x.id === id);

    // For the domain model, actions are in the actions array
    // This is a simplified mapping - in a real implementation you'd have
    // better logic to determine which action to use
    const primaryAction = item?.actions?.[0];
    const secondaryAction = item?.actions?.[1];

    const act = which === 'primary' ? primaryAction : secondaryAction;
    if (!act) return;

    try {
      // Handle different action types
      if (act.type === 'dismiss') {
        this.close(id);
      } else if (act.url) {
        // Handle navigation actions - you'd implement routing here
        console.log('Navigate to:', act.url);
        this.close(id);
      } else if (act.data) {
        // Handle custom actions - you'd implement action handlers here
        console.log('Execute action:', act, act.data);
        this.close(id);
      }
    } catch (error) {
      console.error('Action execution failed:', error);
    }
  }

  pause(id: string) {
    (this.facade as any).port?.pause?.(id);
  }
  resume(id: string) {
    (this.facade as any).port?.resume?.(id);
  }
}
