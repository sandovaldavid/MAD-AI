import { inject, Injectable } from '@angular/core';
import { NOTIFICATION_PORT } from '@app/di/tokens';
import type { NotificationPort } from '@domain/ports/notification.port';

@Injectable({ providedIn: 'root' })
export class ClearNotifications {
    private port = inject<NotificationPort>(NOTIFICATION_PORT);
    execute() {
        this.port.clear();
    }
}
