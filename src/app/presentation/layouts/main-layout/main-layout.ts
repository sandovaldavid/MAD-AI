import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '@shared/components/header/header';
import { NotificationContainerComponent } from '@shared/components/notification/notification-container/notification-container';

@Component({
    selector: 'app-main-layout',
    templateUrl: './main-layout.html',
    styleUrl: './main-layout.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterOutlet, HeaderComponent, NotificationContainerComponent],
})
export class MainLayoutComponent {}
