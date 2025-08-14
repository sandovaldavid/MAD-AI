import { NavSection } from '@domain/entities/nav-section.entity';
import { NavItem } from '@domain/entities/nav-item.entity';

export const NAV_SECTIONS: NavSection[] = [
    NavSection.create({
        id: 'main',
        title: 'Principal',
        items: [
            NavItem.create({
                id: 'dashboard',
                label: 'Dashboard',
                icon: 'home',
                route: '/dashboard',
                activeMatch: '/dashboard',
            }),
            NavItem.create({
                id: 'users',
                label: 'Usuarios',
                icon: 'users',
                route: '/users',
                activeMatch: '/users',
                requireRoles: ['admin', 'manager'],
            }),
            NavItem.create({
                id: 'projects',
                label: 'Proyectos',
                icon: 'folder',
                route: '/projects',
                activeMatch: '/projects',
            }),
        ],
    }),
    NavSection.create({
        id: 'administration',
        title: 'Administración',
        items: [
            NavItem.create({
                id: 'roles',
                label: 'Roles',
                icon: 'shield-check',
                route: '/roles',
                activeMatch: '/roles',
                requireRoles: ['admin'],
            }),
            NavItem.create({
                id: 'settings',
                label: 'Configuración',
                icon: 'settings',
                route: '/settings',
                activeMatch: '/settings',
                requireRoles: ['admin'],
            }),
        ],
    }),
    NavSection.create({
        id: 'tools',
        title: 'Herramientas',
        items: [
            NavItem.create({
                id: 'reports',
                label: 'Reportes',
                icon: 'chart-bar',
                route: '/reports',
                activeMatch: '/reports',
            }),
            NavItem.create({
                id: 'analytics',
                label: 'Analítica',
                icon: 'chart-line',
                route: '/analytics',
                activeMatch: '/analytics',
            }),
        ],
    }),
];
