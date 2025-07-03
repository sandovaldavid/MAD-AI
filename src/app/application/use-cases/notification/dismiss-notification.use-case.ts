import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificationRepository } from '@domain/repositories/notification.repository';

@Injectable({
    providedIn: 'root',
})
export class DismissNotificationUseCase {
    private readonly notificationRepository = inject(NotificationRepository);

    execute(notificationId: string): Observable<void> {
        return this.notificationRepository.dismiss(notificationId);
    }
}
