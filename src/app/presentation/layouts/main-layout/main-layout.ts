import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '@shared/components/header/header';
import { NotificationContainerComponent } from '@shared/components/notification/notification-container/notification-container';
import { Sidebar } from '@shared/components/sidebar/sidebar';
import { SidebarService } from '@core/services/sidebar.service';

@Component({
    selector: 'app-main-layout',
    templateUrl: './main-layout.html',
    styleUrl: './main-layout.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterOutlet, HeaderComponent, NotificationContainerComponent, Sidebar],
})
export class MainLayoutComponent {
    private readonly sidebarService = inject(SidebarService);
    
    protected readonly layoutClasses = computed(() => 
        this.sidebarService.isCollapsed() ? 'main-layout sidebar-collapsed' : 'main-layout'
    );
}
