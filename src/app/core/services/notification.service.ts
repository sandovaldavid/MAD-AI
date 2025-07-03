import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificationEntity } from '@domain/entities/notification.entity';
import { NotificationType, NotificationPosition } from '@domain/enums/notification.enum';
import { CreateNotificationRequest, NotificationOptions } from '@domain/models/notification/notification.model';
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

    // Convenience methods by notification type
    success(title: string, message: string, options?: NotificationOptions): Observable<NotificationEntity> {
        return this.show({
            type: NotificationType.SUCCESS,
            title,
            message,
            ...options,
        });
    }

    error(title: string, message: string, options?: NotificationOptions): Observable<NotificationEntity> {
        return this.show({
            type: NotificationType.ERROR,
            title,
            message,
            duration: options?.duration ?? 8000, // Errors have longer duration by default
            ...options,
        });
    }

    warning(title: string, message: string, options?: NotificationOptions): Observable<NotificationEntity> {
        return this.show({
            type: NotificationType.WARNING,
            title,
            message,
            ...options,
        });
    }

    info(title: string, message: string, options?: NotificationOptions): Observable<NotificationEntity> {
        return this.show({
            type: NotificationType.INFO,
            title,
            message,
            ...options,
        });
    }

    // Convenience methods by position
    successTopLeft(title: string, message: string, options?: NotificationOptions): Observable<NotificationEntity> {
        return this.success(title, message, { ...options, position: NotificationPosition.TOP_LEFT });
    }

    successTopCenter(title: string, message: string, options?: NotificationOptions): Observable<NotificationEntity> {
        return this.success(title, message, { ...options, position: NotificationPosition.TOP_CENTER });
    }

    successBottomRight(title: string, message: string, options?: NotificationOptions): Observable<NotificationEntity> {
        return this.success(title, message, { ...options, position: NotificationPosition.BOTTOM_RIGHT });
    }

    errorTopLeft(title: string, message: string, options?: NotificationOptions): Observable<NotificationEntity> {
        return this.error(title, message, { ...options, position: NotificationPosition.TOP_LEFT });
    }

    errorTopCenter(title: string, message: string, options?: NotificationOptions): Observable<NotificationEntity> {
        return this.error(title, message, { ...options, position: NotificationPosition.TOP_CENTER });
    }

    errorBottomRight(title: string, message: string, options?: NotificationOptions): Observable<NotificationEntity> {
        return this.error(title, message, { ...options, position: NotificationPosition.BOTTOM_RIGHT });
    }

    warningTopLeft(title: string, message: string, options?: NotificationOptions): Observable<NotificationEntity> {
        return this.warning(title, message, { ...options, position: NotificationPosition.TOP_LEFT });
    }

    warningTopCenter(title: string, message: string, options?: NotificationOptions): Observable<NotificationEntity> {
        return this.warning(title, message, { ...options, position: NotificationPosition.TOP_CENTER });
    }

    warningBottomRight(title: string, message: string, options?: NotificationOptions): Observable<NotificationEntity> {
        return this.warning(title, message, { ...options, position: NotificationPosition.BOTTOM_RIGHT });
    }

    infoTopLeft(title: string, message: string, options?: NotificationOptions): Observable<NotificationEntity> {
        return this.info(title, message, { ...options, position: NotificationPosition.TOP_LEFT });
    }

    infoTopCenter(title: string, message: string, options?: NotificationOptions): Observable<NotificationEntity> {
        return this.info(title, message, { ...options, position: NotificationPosition.TOP_CENTER });
    }

    infoBottomRight(title: string, message: string, options?: NotificationOptions): Observable<NotificationEntity> {
        return this.info(title, message, { ...options, position: NotificationPosition.BOTTOM_RIGHT });
    }
}
