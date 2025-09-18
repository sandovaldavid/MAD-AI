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
  readonly NotificationType = {
    SUCCESS: 'success' as const,
    ERROR: 'error' as const,
    WARNING: 'warning' as const,
    INFO: 'info' as const,
  };

  // Mapa para controlar los timeouts de autocierre por id
  private autoCloseTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
  // Duración del autocierre en ms (puedes hacer esto configurable si lo deseas)
  private readonly AUTO_CLOSE_SUCCESS_MS = 3000;

  items = computed(() => {
    const notifications = this.facade.notifications();
    // Inicia autocierre para los nuevos toasts de tipo success
    notifications.forEach((notification) => {
      if (
        notification.type === this.NotificationType.SUCCESS &&
        !this.autoCloseTimeouts.has(notification.id)
      ) {
        const timeout = setTimeout(() => {
          this.close(notification.id);
        }, this.AUTO_CLOSE_SUCCESS_MS);
        this.autoCloseTimeouts.set(notification.id, timeout);
      }
    });
    // Limpia timeouts de notificaciones que ya no existen
    const currentIds = new Set(notifications.map((n) => n.id));
    Array.from(this.autoCloseTimeouts.keys()).forEach((id) => {
      if (!currentIds.has(id)) {
        const timeout = this.autoCloseTimeouts.get(id);
        if (timeout) clearTimeout(timeout);
        this.autoCloseTimeouts.delete(id);
      }
    });
    return notifications.map((notification) => this.toViewModel(notification));
  });

  cap = () =>
    typeof window !== 'undefined' && window.matchMedia?.('(max-width: 640px)').matches
      ? this.cfg.maxVisibleMobile
      : this.cfg.maxVisibleDesktop;

  allItems = () => this.items().slice(0, this.cap());

  trackId = (_: number, t: ToastViewModel) => t.id;

  close(id: string) {
    // Limpiar el timeout si existe
    const timeout = this.autoCloseTimeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.autoCloseTimeouts.delete(id);
    }
    this.facade.dismiss({ notificationId: id });
  }

  async onAction(_id: string, _which: 'primary' | 'secondary') {
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
