import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TitleService } from '@core/services/title.service';
import { BreadcrumbService } from '@core/services/breadcrumb.service';
import { Button } from '@/app/shared/ui/button/button';
import { AuthFacade } from '@/app/application/facades/auth.facade';
import { User } from '@/app/domain/entities/user.entity';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [Button],
})
export class Dashboard {
    readonly User: User | null;
    readonly username: string | undefined;
    protected readonly titlePage = 'Dashboard';

    constructor(
        private titleService: TitleService,
        private breadcrumbService: BreadcrumbService,
        public authFacade: AuthFacade,
        private router: Router
    ) {
        this.User = this.authFacade.user();
        this.username = this.User?.username;
    }

    async ngOnInit(): Promise<void> {
        this.titleService.setTitle(this.titlePage);
        this.breadcrumbService.setBreadcrumbs([{ label: this.titlePage, icon: 'home' }]);
        await this.authFacade.refreshProfile();
    }

    async logout() {
        await this.authFacade.logout();
        await this.router.navigateByUrl('/auth/login');
    }
}
