import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { TitleService } from '@core/services/title.service';
import { BreadcrumbService } from '@core/services/breadcrumb.service';
import { Button } from '@shared/components/ui/button/button';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [Button],
})
export class Dashboard implements OnInit {
    private readonly authService = inject(AuthService);
    private readonly titleService = inject(TitleService);
    private readonly breadcrumbService = inject(BreadcrumbService);

    protected readonly user = this.authService.user;
    protected readonly isAuthenticated = this.authService.isAuthenticated;

    ngOnInit(): void {
        // Set page title and breadcrumbs
        this.titleService.setTitle('Dashboard');
        this.breadcrumbService.setBreadcrumbs([{ label: 'Dashboard', icon: 'home' }]);
    }

    protected onLogout(): void {
        this.authService.logout().subscribe();
    }
}
