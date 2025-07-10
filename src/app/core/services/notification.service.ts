import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificationEntity } from '@domain/entities/notification.entity';
import { NotificationType, NotificationPosition } from '@domain/enums/notification.enum';
import {
    CreateNotificationRequest,
    NotificationOptions,
} from '@domain/models/notification/notification.model';
import { ShowNotificationUseCase } from '@application/use-cases/notification/show-notification.use-case';
import { DismissNotificationUseCase } from '@application/use-cases/notification/dismiss-notification.use-case';
import { GetNotificationsUseCase } from '@application/use-cases/notification/get-notifications.use-case';

@Injectable({
    providedIn: 'root',
})
export class NotificationService {
    private readonly showNotificationUseCase = inject(ShowNotificationUseCase);
    private readonly dismissNotificationUseCase = inject(DismissNotificationUseCase);
    private readonly getNotificationsUseCase = inject(GetNotificationsUseCase);

    // Core methods
    show(request: CreateNotificationRequest): Observable<NotificationEntity> {
        return this.showNotificationUseCase.execute(request);
    }

    dismiss(notificationId: string): Observable<void> {
        return this.dismissNotificationUseCase.execute(notificationId);
    }

    getNotifications(): Observable<NotificationEntity[]> {
        return this.getNotificationsUseCase.execute();
    }

    // Private method to avoid code duplication
    private showTypedNotification(
        type: NotificationType,
        title: string,
        message: string,
        options?: NotificationOptions
    ): Observable<NotificationEntity> {
        const defaultDuration = type === NotificationType.ERROR ? 8000 : undefined;

        return this.show({
            type,
            title,
            message,
            duration: options?.duration ?? defaultDuration,
            ...options,
        });
    }

    // Convenience methods by notification type
    success(
        title: string,
        message: string,
        options?: NotificationOptions
    ): Observable<NotificationEntity> {
        return this.showTypedNotification(NotificationType.SUCCESS, title, message, options);
    }

    error(
        title: string,
        message: string,
        options?: NotificationOptions
    ): Observable<NotificationEntity> {
        return this.showTypedNotification(NotificationType.ERROR, title, message, options);
    }

    warning(
        title: string,
        message: string,
        options?: NotificationOptions
    ): Observable<NotificationEntity> {
        return this.showTypedNotification(NotificationType.WARNING, title, message, options);
    }

    info(
        title: string,
        message: string,
        options?: NotificationOptions
    ): Observable<NotificationEntity> {
        return this.showTypedNotification(NotificationType.INFO, title, message, options);
    }

    // Helper method to create position-specific notifications
    private withPosition(
        method: (
            title: string,
            message: string,
            options?: NotificationOptions
        ) => Observable<NotificationEntity>,
        title: string,
        message: string,
        position: NotificationPosition,
        options?: NotificationOptions
    ): Observable<NotificationEntity> {
        return method.call(this, title, message, { ...options, position });
    }

    // Positioned notifications (examples, can expand as needed)
    successAt(
        title: string,
        message: string,
        position: NotificationPosition,
        options?: NotificationOptions
    ): Observable<NotificationEntity> {
        return this.withPosition(this.success, title, message, position, options);
    }

    errorAt(
        title: string,
        message: string,
        position: NotificationPosition,
        options?: NotificationOptions
    ): Observable<NotificationEntity> {
        return this.withPosition(this.error, title, message, position, options);
    }

    warningAt(
        title: string,
        message: string,
        position: NotificationPosition,
        options?: NotificationOptions
    ): Observable<NotificationEntity> {
        return this.withPosition(this.warning, title, message, position, options);
    }

    infoAt(
        title: string,
        message: string,
        position: NotificationPosition,
        options?: NotificationOptions
    ): Observable<NotificationEntity> {
        return this.withPosition(this.info, title, message, position, options);
    }

    // Common position shortcuts
    successTopCenter(
        title: string,
        message: string,
        options?: NotificationOptions
    ): Observable<NotificationEntity> {
        return this.successAt(title, message, NotificationPosition.TOP_CENTER, options);
    }

    successTopLeft(
        title: string,
        message: string,
        options?: NotificationOptions
    ): Observable<NotificationEntity> {
        return this.successAt(title, message, NotificationPosition.TOP_LEFT, options);
    }

    successBottomRight(
        title: string,
        message: string,
        options?: NotificationOptions
    ): Observable<NotificationEntity> {
        return this.successAt(title, message, NotificationPosition.BOTTOM_RIGHT, options);
    }

    errorTopCenter(
        title: string,
        message: string,
        options?: NotificationOptions
    ): Observable<NotificationEntity> {
        return this.errorAt(title, message, NotificationPosition.TOP_CENTER, options);
    }

    errorTopLeft(
        title: string,
        message: string,
        options?: NotificationOptions
    ): Observable<NotificationEntity> {
        return this.errorAt(title, message, NotificationPosition.TOP_LEFT, options);
    }

    errorBottomRight(
        title: string,
        message: string,
        options?: NotificationOptions
    ): Observable<NotificationEntity> {
        return this.errorAt(title, message, NotificationPosition.BOTTOM_RIGHT, options);
    }

    warningTopLeft(
        title: string,
        message: string,
        options?: NotificationOptions
    ): Observable<NotificationEntity> {
        return this.warningAt(title, message, NotificationPosition.TOP_LEFT, options);
    }

    warningTopCenter(
        title: string,
        message: string,
        options?: NotificationOptions
    ): Observable<NotificationEntity> {
        return this.warningAt(title, message, NotificationPosition.TOP_CENTER, options);
    }

    warningBottomRight(
        title: string,
        message: string,
        options?: NotificationOptions
    ): Observable<NotificationEntity> {
        return this.warningAt(title, message, NotificationPosition.BOTTOM_RIGHT, options);
    }

    infoTopLeft(
        title: string,
        message: string,
        options?: NotificationOptions
    ): Observable<NotificationEntity> {
        return this.infoAt(title, message, NotificationPosition.TOP_LEFT, options);
    }

    infoTopCenter(
        title: string,
        message: string,
        options?: NotificationOptions
    ): Observable<NotificationEntity> {
        return this.infoAt(title, message, NotificationPosition.TOP_CENTER, options);
    }

    infoBottomRight(
        title: string,
        message: string,
        options?: NotificationOptions
    ): Observable<NotificationEntity> {
        return this.infoAt(title, message, NotificationPosition.BOTTOM_RIGHT, options);
    }
}
