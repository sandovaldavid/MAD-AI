import { NotificationType, NotificationPosition } from '../enums/notification';
import { NotificationAction } from '../types/notification/action.type';

export type NotificationId = string;

export interface Notification {
    id: NotificationId;
    type: NotificationType;
    message: string;
    title?: string;
    duration?: number | 0;
    dismissible?: boolean;
    icon?: string | null;
    key?: string | null;
    groupId?: string | null;
    createdAt: number;
    position?: NotificationPosition | null;
    action?: NotificationAction | null;
    secondaryAction?: NotificationAction | null;
    data?: Record<string, unknown>;
}

export type NewNotification = Omit<Notification, 'id' | 'createdAt'> & { id?: NotificationId };
