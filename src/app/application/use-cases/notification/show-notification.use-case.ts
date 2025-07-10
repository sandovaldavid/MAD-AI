import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificationRepository } from '@domain/repositories/notification.repository';
import { CreateNotificationRequest } from '@domain/models/notification/notification.model';
import { NotificationEntity } from '@domain/entities/notification.entity';

@Injectable({
    providedIn: 'root',
})
export class ShowNotificationUseCase {
    private readonly notificationRepository = inject(NotificationRepository);

    execute(request: CreateNotificationRequest): Observable<NotificationEntity> {
        return this.notificationRepository.show(request);
    }
}
