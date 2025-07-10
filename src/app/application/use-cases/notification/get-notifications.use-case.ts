import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificationRepository } from '@domain/repositories/notification.repository';
import { NotificationEntity } from '@domain/entities/notification.entity';

@Injectable({
    providedIn: 'root',
})
export class GetNotificationsUseCase {
    private readonly notificationRepository = inject(NotificationRepository);

    execute(): Observable<NotificationEntity[]> {
        return this.notificationRepository.getAll();
    }
}
