import { ChangeDetectionStrategy, Component, inject, input, output, signal, effect } from '@angular/core';
import { NotificationEntity } from '@domain/entities/notification.entity';
import { NotificationType } from '@domain/enums/notification.enum';
import { NotificationService } from '@core/services/notification.service';

@Component({
    selector: 'app-notification-item',
    templateUrl: './notification-item.html',
    styleUrl: './notification-item.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationItemComponent {
    // Expose NotificationType enum to the template
    protected readonly NotificationType = NotificationType;
    
    // Input signals
    notification = input.required<NotificationEntity>();
    
    // Output events
    dismissed = output<string>();

    private readonly notificationService = inject(NotificationService);
    private timeoutId?: number;

    constructor() {
        // Setup auto-dismiss timer if needed
        effect(() => {
            const notif = this.notification();
            
            if (notif?.autoClose && notif?.duration > 0) {
                // Clear any existing timeout
                if (this.timeoutId) {
                    window.clearTimeout(this.timeoutId);
                }
                
                // Set new timeout
                this.timeoutId = window.setTimeout(() => {
                    this.onClose();
                }, notif.duration);
            }
        });
    }

    onClose(): void {
        const notifId = this.notification().id;
        this.notificationService.dismiss(notifId).subscribe();
        this.dismissed.emit(notifId);
    }

    getNotificationIcon(type: NotificationType): string {
        switch (type) {
            case NotificationType.SUCCESS:
                return 'check-circle';
            case NotificationType.ERROR:
                return 'x-circle';
            case NotificationType.WARNING:
                return 'alert-triangle';
            case NotificationType.INFO:
                return 'info';
            default:
                return 'bell';
        }
    }
}
