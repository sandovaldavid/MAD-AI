import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationsFacade } from '@application/facades/notifications.facade';
import { NotificationPosition, NotificationType } from '@domain/enums/notification';
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
    types = NotificationType;
    items = this.facade.items;

    cap = () =>
        typeof window !== 'undefined' && window.matchMedia?.('(max-width: 640px)').matches
            ? this.cfg.maxVisibleMobile
            : this.cfg.maxVisibleDesktop;

    byPos = (p: NotificationPosition | string) =>
        this.items().filter((x) => (x.position ?? 'top-right') === p); // fallback por si algo llega sin posición

    trackId = (_: any, t: any) => t.id;

    close(id: string) {
        this.facade.dismiss(id);
    }

    async onAction(id: string, which: 'primary' | 'secondary') {
        const item = this.items().find((x) => x.id === id);
        const act = which === 'primary' ? item?.action : item?.secondaryAction;
        if (!act?.run) return;
        try {
            await act.run();
        } finally {
            const close = which === 'primary' ? act.closeOnClick ?? true : false;
            if (close) this.close(id);
        }
    }

    pause(id: string) {
        (this.facade as any).port?.pause?.(id);
    }
    resume(id: string) {
        (this.facade as any).port?.resume?.(id);
    }
}
