import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { NotificationRepository } from '@domain/repositories/notification.repository';
import { NotificationEntity } from '@domain/entities/notification.entity';
import { CreateNotificationRequest } from '@domain/models/notification/notification.model';

@Injectable()
export class NotificationRepositoryImpl implements NotificationRepository {
    private notifications = new BehaviorSubject<NotificationEntity[]>([]);

    show(request: CreateNotificationRequest): Observable<NotificationEntity> {
        const notification = new NotificationEntity({
            ...request,
        });

        const currentNotifications = this.notifications.getValue();
        this.notifications.next([...currentNotifications, notification]);

        return of(notification);
    }

    dismiss(notificationId: string): Observable<void> {
        const currentNotifications = this.notifications.getValue();
        const updatedNotifications = currentNotifications.filter(
            (notification) => notification.id !== notificationId
        );
        this.notifications.next(updatedNotifications);

        return of(undefined);
    }

    getAll(): Observable<NotificationEntity[]> {
        return this.notifications.asObservable();
    }
}
