import { Observable } from 'rxjs';
import { NotificationEntity } from '../entities/notification.entity';
import { CreateNotificationRequest } from '../models/notification/notification.model';

export abstract class NotificationRepository {
    abstract show(request: CreateNotificationRequest): Observable<NotificationEntity>;
    abstract dismiss(notificationId: string): Observable<void>;
    abstract getAll(): Observable<NotificationEntity[]>;
}
