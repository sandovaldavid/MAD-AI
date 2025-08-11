import { inject, Injectable } from '@angular/core';
import { NOTIFICATION_PORT } from '@app/di/tokens';
import type { NotificationPort } from '@domain/ports/notification.port';
import type { NotificationId } from '@domain/entities/notification.entity';

@Injectable({ providedIn: 'root' })
export class DismissNotification {
    private port = inject<NotificationPort>(NOTIFICATION_PORT);
    execute(id: NotificationId) {
        this.port.dismiss(id);
    }
}
