import { NotificationType, NotificationPosition } from '../../enums/notification.enum';

export interface CreateNotificationRequest {
    type: NotificationType;
    title: string;
    message: string;
    duration?: number;
    position?: NotificationPosition;
    autoClose?: boolean;
    showCloseButton?: boolean;
}

export interface NotificationOptions {
    duration?: number;
    position?: NotificationPosition;
    autoClose?: boolean;
    showCloseButton?: boolean;
}
