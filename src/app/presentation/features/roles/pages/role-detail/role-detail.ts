import { ChangeDetectionStrategy, Component, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RolesFacade } from '@application/facades/roles.facade';
import { PageHeader, type PageHeaderConfig } from '@shared/components/page-header/page-header';
import { ErrorDisplay } from '@shared/components/error-view/error-display/error-display';
import type { ErrorDisplayConfig } from '@shared/types/error-display.types';
import { Button } from '@shared/ui/button/button';
import { Icon } from '@shared/ui/icon/icon';
import { BreadcrumbService } from '@core/services/breadcrumb.service';
import {
    getRoleAccessLevelInfo,
    getRoleAccessLevelIcon,
    type RoleAccessLevelInfo,
} from '../../types/role-colors.type';

@Component({
    selector: 'app-role-detail',
    standalone: true,
    imports: [CommonModule, PageHeader, ErrorDisplay, Button, Icon],
    templateUrl: './role-detail.html',
    styleUrl: './role-detail.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleDetail {
    private facade = inject(RolesFacade);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private breadcrumbService = inject(BreadcrumbService);

    role = this.facade.current;
    loading = this.facade.loading;
    error = this.facade.error;

    readonly pageHeaderConfig = computed<PageHeaderConfig>(() => {
        const role = this.role();
        const levelInfo = role
            ? getRoleAccessLevelInfo(role.accessLevel)
            : getRoleAccessLevelInfo(5);
        return {
            title: role ? role.displayName : 'Detalle del Rol',
            description: role
                ? `${levelInfo.description} - ${role.description || 'Sin descripción'}`
                : 'Información detallada del rol seleccionado',
            icon: role ? getRoleAccessLevelIcon(role.accessLevel) : 'shield-check',
            showBreadcrumbs: true,
            actions: [
                {
                    label: 'Editar',
                    icon: 'shield-up',
                    action: () => this.editRole(),
                    variant: 'primary',
                    disabled: !role || this.loading(),
                },
                {
                    label: 'Volver',
                    icon: 'arrow-left',
                    action: () => this.goBack(),
                    variant: 'ghost',
                },
            ],
        };
    });

    readonly errorConfig = computed<ErrorDisplayConfig>(() => ({
        type: 'server',
        severity: 'error',
        title: 'Error al cargar el rol',
        message: this.error() || 'No se pudo cargar la información del rol',
        actions: [
            {
                label: 'Reintentar',
                icon: 'arrow-path',
                action: () => this.retry(),
                style: 'primary',
            },
            {
                label: 'Volver',
                icon: 'arrow-left',
                action: () => this.goBack(),
                style: 'secondary',
            },
        ],
        showDetails: false,
        compact: false,
    }));

    constructor() {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        void this.facade.load(id);

        // Update breadcrumbs when role data changes
        effect(() => {
            const role = this.role();
            if (role) {
                this.breadcrumbService.setBreadcrumbs([
                    { label: 'Dashboard', route: '/dashboard', icon: 'home' },
                    { label: 'Roles', route: '/roles', icon: 'shield-check' },
                    { label: role.displayName, icon: 'shield-check' },
                ]);
            } else {
                this.breadcrumbService.setBreadcrumbs([
                    { label: 'Dashboard', route: '/dashboard', icon: 'home' },
                    { label: 'Roles', route: '/roles', icon: 'shield-check' },
                    { label: 'Detalle del Rol', icon: 'shield-check' },
                ]);
            }
        });
    }

    editRole(): void {
        const role = this.role();
        if (role) {
            void this.router.navigate(['/roles', role.id, 'edit']);
        }
    }

    goBack(): void {
        void this.router.navigate(['/roles']);
    }

    // Helper methods for role styling consistency
    getRoleAccessLevelInfo(): RoleAccessLevelInfo {
        const role = this.role();
        return role ? getRoleAccessLevelInfo(role.accessLevel) : getRoleAccessLevelInfo(5);
    }

    getRoleAccessLevelIcon(): string {
        const role = this.role();
        return role ? getRoleAccessLevelIcon(role.accessLevel) : getRoleAccessLevelIcon(5);
    }

    getStatusInfo() {
        const role = this.role();
        const isActive = role?.isActive ?? false;
        return {
            label: isActive ? 'Activo' : 'Inactivo',
            icon: isActive ? 'check-circle' : 'x-circle',
            classes: isActive
                ? 'bg-successful-100 text-successful-800 dark:bg-successful-800 dark:text-successful-200 border border-successful-200 dark:border-successful-700'
                : 'bg-error-100 text-error-800 dark:bg-error-800 dark:text-error-200 border border-error-200 dark:border-error-700',
            dotColor: isActive ? 'bg-successful-500' : 'bg-error-500',
        };
    }

    private retry(): void {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        void this.facade.load(id);
    }
}
