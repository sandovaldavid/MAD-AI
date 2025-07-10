import { NotificationType, NotificationPosition } from '../enums/notification.enum';

export class NotificationEntity {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    duration: number;
    position: NotificationPosition;
    autoClose: boolean;
    showCloseButton: boolean;
    createdAt: Date;

    constructor(params: {
        id?: string;
        type: NotificationType;
        title: string;
        message: string;
        duration?: number;
        position?: NotificationPosition;
        autoClose?: boolean;
        showCloseButton?: boolean;
    }) {
        this.id = params.id || crypto.randomUUID();
        this.type = params.type;
        this.title = params.title;
        this.message = params.message;
        this.duration = params.duration ?? 5000; // Default 5 seconds
        this.position = params.position ?? NotificationPosition.TOP_RIGHT;
        this.autoClose = params.autoClose ?? true;
        this.showCloseButton = params.showCloseButton ?? true;
        this.createdAt = new Date();
    }
}
