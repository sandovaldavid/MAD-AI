import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationContainerComponent } from '@shared/components/notification/notification-container/notification-container';

@Component({
    selector: 'app-auth-layout',
    templateUrl: './auth-layout.html',
    styleUrl: './auth-layout.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterOutlet, NotificationContainerComponent],
})
export class AuthLayoutComponent {}
