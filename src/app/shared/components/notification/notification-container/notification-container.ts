import { ChangeDetectionStrategy, Component, computed, inject, signal, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NotificationEntity } from '@domain/entities/notification.entity';
import { NotificationPosition } from '@domain/enums/notification.enum';
import { NotificationService } from '@core/services/notification.service';
import { NotificationItemComponent } from '../notification-item/notification-item';

@Component({
    selector: 'app-notification-container',
    templateUrl: './notification-container.html',
    styleUrl: './notification-container.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NotificationItemComponent],
})
export class NotificationContainerComponent {
    private readonly notificationService = inject(NotificationService);
    
    // Convert the Observable to a signal with an initial empty array
    protected readonly notifications = toSignal(this.notificationService.getNotifications(), { initialValue: [] });

    // All positions for iteration
    protected readonly positions = Object.values(NotificationPosition);

    // Group notifications by position
    protected readonly notificationsByPosition = computed(() => {
        const positionMap = new Map<NotificationPosition, NotificationEntity[]>();
        const allNotifications = this.notifications();

        // Initialize all positions with empty arrays
        Object.values(NotificationPosition).forEach(position => {
            positionMap.set(position as NotificationPosition, []);
        });

        // Group notifications by position
        allNotifications.forEach(notification => {
            const position = notification.position;
            const notificationsForPosition = positionMap.get(position) || [];
            positionMap.set(position, [...notificationsForPosition, notification]);
        });

        return positionMap;
    });

    // Get class for container based on position
    protected getPositionClass(position: string): string {
        return `notifications-${position}`;
    }
}
