import { inject, Injectable } from '@angular/core';
import { NOTIFICATION_PORT } from '@app/di/tokens';
import type { NotificationPort } from '@domain/ports/notification.port';
import type { NewNotification, NotificationId } from '@domain/entities/notification.entity';

@Injectable({ providedIn: 'root' })
export class Notify {
    private port = inject<NotificationPort>(NOTIFICATION_PORT);
    execute(n: NewNotification): NotificationId {
        return this.port.push(n);
    }
}
