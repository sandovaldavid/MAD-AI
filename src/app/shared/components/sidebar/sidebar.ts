import { ChangeDetectionStrategy, Component, signal, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { SidebarService } from '@core/services/sidebar.service';
import { IconComponent } from './icon/icon';

interface MenuItem {
    icon: string;
    label: string;
    route: string;
    badge?: number;
}

interface MenuSection {
    title?: string;
    items: MenuItem[];
}

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.html',
    styleUrl: './sidebar.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterLink, RouterLinkActive, IconComponent],
})
export class Sidebar {
    private readonly router = inject(Router);
    private readonly authService = inject(AuthService);
    private readonly sidebarService = inject(SidebarService);

    // State signals - use service for collapsed state
    protected readonly isCollapsed = this.sidebarService.isCollapsed;
    protected readonly hoveredItem = signal<string | null>(null);

    // Computed properties
    protected readonly sidebarClasses = computed(() =>
        this.isCollapsed() ? 'sidebar-collapsed' : 'sidebar-expanded'
    );

    protected readonly user = this.authService.user;

    // Menu configuration
    protected readonly menuSections: MenuSection[] = [
        {
            items: [{ icon: 'dashboard', label: 'Dashboard', route: '/dashboard' }],
        },
        {
            title: 'Gestión',
            items: [
                { icon: 'projects', label: 'Gestión de Proyectos', route: '/projects' },
                { icon: 'tasks', label: 'Gestión de Tareas', route: '/tasks' },
                { icon: 'teams', label: 'Gestión de Equipos', route: '/teams' },
                { icon: 'resources', label: 'Gestión de Recursos', route: '/resource-management/dashboard' },
            ],
        },
        {
            items: [
                { icon: 'users', label: 'Usuarios', route: '/users' },
                {
                    icon: 'notifications',
                    label: 'Notificaciones',
                    route: '/notifications',
                    badge: 3,
                },
                { icon: 'reports', label: 'Reportes', route: '/reports' },
            ],
        },
        {
            items: [
                { icon: 'audit', label: 'Auditoría', route: '/audit' },
                { icon: 'integration', label: 'Integración', route: '/integration' },
                { icon: 'settings', label: 'Configuración', route: '/settings' },
            ],
        },
    ];

    protected toggleSidebar(): void {
        this.sidebarService.toggle();
    }

    protected onItemHover(itemLabel: string | null): void {
        this.hoveredItem.set(itemLabel);
    }

    protected onLogout(): void {
        this.authService.logout().subscribe();
    }
}
