import {
    ChangeDetectionStrategy,
    Component,
    effect,
    inject,
    signal,
    computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RolesFacade } from '@application/facades/roles.facade';
import { Icon } from '@shared/ui/icon/icon';
import { RoleCard } from '../../components/role-card/role-card';
import { PageHeader, type PageHeaderConfig } from '@shared/components/page-header/page-header';
import { ErrorDisplay } from '@shared/components/error-view/error-display/error-display';
import { RoleSkeleton } from '../../skeleton/role-list-skeleton/role-skeleton';
import type { ErrorDisplayConfig } from '@shared/types/error-display.types';
import { BreadcrumbService } from '@core/services/breadcrumb.service';

@Component({
    selector: 'app-roles-list',
    standalone: true,
    imports: [CommonModule, Icon, RoleCard, PageHeader, ErrorDisplay, RoleSkeleton],
    templateUrl: './roles-list.html',
    styleUrl: './roles-list.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesList {
    private facade = inject(RolesFacade);
    private router = inject(Router);
    private breadcrumbService = inject(BreadcrumbService);

    readonly loading = this.facade.loading;
    readonly roles = this.facade.roles;
    readonly error = this.facade.error;

    search = signal('');
    activeFilter = signal<boolean | null>(null);

    constructor() {
        // Set breadcrumbs for this page
        this.breadcrumbService.setBreadcrumbs([
            { label: 'Dashboard', route: '/dashboard' },
            { label: 'Roles', route: '/roles', isLast: true },
        ]);

        // Load initial data
        effect(() => {
            this.onRetry();
        });
    }

    // Computed properties for UI components
    readonly headerConfig = computed(
        (): PageHeaderConfig => ({
            title: 'Roles',
            icon: 'shield',
            description: 'Administra Roles de usuario y permisos',
            showBreadcrumbs: true,
            actions: [
                {
                    label: 'Nuevo Rol',
                    icon: 'shield-plus',
                    variant: 'primary',
                    action: () => this.onCreateRole(),
                },
            ],
        })
    );

    readonly errorConfig = computed(
        (): ErrorDisplayConfig => ({
            type: 'generic',
            severity: 'error',
            title: 'Failed to load roles',
            message: this.facade.error() || 'Unable to fetch roles at this time.',
            actions: [
                {
                    label: 'Try Again',
                    style: 'primary',
                    action: () => this.onRetry(),
                },
            ],
        })
    );

    onRetry() {
        const params: { search: string; active?: boolean } = {
            search: this.search(),
        };

        const activeFilterValue = this.activeFilter();
        if (activeFilterValue !== null) {
            params.active = activeFilterValue;
        }

        void this.facade.refresh(params);
    }

    onCreateRole() {
        void this.router.navigate(['/roles/new']);
    }

    onViewRole(id: number) {
        void this.router.navigate(['/roles', id]);
    }

    onToggleActive(rid: number, status: boolean) {
        void this.facade.toggleStatus(rid, status);
        console.log('Toggle active for role:', rid);
        console.log('Status Role:', status);
    }

    onDelete(rid: number) {
        void this.facade.delete(rid);
    }
}
