import { inject, Injectable, signal, computed } from '@angular/core';
import {
    DismissNotification,
    ClearNotifications,
    UpdateNotification,
    Notify,
} from '../use-cases/notifications';
import { NOTIFICATION_PORT } from '@app/di/tokens';
import { NotificationType } from '@domain/enums/notification';
import type { NewNotification, NotificationId } from '@domain/entities/notification.entity';
import type { NotificationPort } from '@domain/ports/notification.port';

@Injectable({ providedIn: 'root' })
export class NotificationsFacade {
    private notifyUC = inject(Notify);
    private dismissUC = inject(DismissNotification);
    private clearUC = inject(ClearNotifications);
    private updateUC = inject(UpdateNotification);
    private port = inject<NotificationPort>(NOTIFICATION_PORT);

    private _items = signal(this.port.snapshot());
    readonly items = computed(() => this._items());

    constructor() {
        // Mantener sincronizado con el gateway
        this.port.onChange((list) => this._items.set(list));
    }

    notify(n: NewNotification): NotificationId {
        return this.notifyUC.execute(n);
    }

    success(message: string, title?: string, opt?: Partial<NewNotification>) {
        return this.notify({ type: NotificationType.SUCCESS, message, title, ...opt });
    }

    info(message: string, title?: string, opt?: Partial<NewNotification>) {
        return this.notify({ type: NotificationType.INFO, message, title, ...opt });
    }

    warning(message: string, title?: string, opt?: Partial<NewNotification>) {
        return this.notify({ type: NotificationType.WARNING, message, title, ...opt });
    }

    error(message: string, title?: string, opt?: Partial<NewNotification>) {
        return this.notify({ type: NotificationType.ERROR, message, title, ...opt });
    }

    dismiss(id: NotificationId) {
        this.dismissUC.execute(id);
    }

    clear() {
        this.clearUC.execute();
    }

    update(id: NotificationId, patch: Partial<NewNotification>) {
        this.updateUC.execute(id, patch as any);
    }
}
