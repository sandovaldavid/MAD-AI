import { NavSection } from './types';

export const NAV_SECTIONS: NavSection[] = [
    {
        id: 'main',
        title: 'Principal',
        items: [
            {
                id: 'dashboard',
                label: 'Dashboard',
                icon: 'home',
                route: '/dashboard',
                activeMatch: '/dashboard',
            },
            {
                id: 'users',
                label: 'Usuarios',
                icon: 'users',
                route: '/users',
                activeMatch: '/users',
                requireRoles: ['admin', 'manager'],
            },
            {
                id: 'projects',
                label: 'Proyectos',
                icon: 'folder',
                route: '/projects',
                activeMatch: '/projects',
            },
        ],
    },
    {
        id: 'administration',
        title: 'Administración',
        items: [
            {
                id: 'roles',
                label: 'Roles',
                icon: 'shield-check',
                route: '/roles',
                activeMatch: '/roles',
                requireRoles: ['admin'],
            },
            {
                id: 'settings',
                label: 'Configuración',
                icon: 'settings',
                route: '/settings',
                activeMatch: '/settings',
                requireRoles: ['admin'],
            },
        ],
    },
    {
        id: 'tools',
        title: 'Herramientas',
        items: [
            {
                id: 'reports',
                label: 'Reportes',
                icon: 'chart-bar',
                route: '/reports',
                activeMatch: '/reports',
            },
            {
                id: 'analytics',
                label: 'Analítica',
                icon: 'chart-line',
                route: '/analytics',
                activeMatch: '/analytics',
            },
        ],
    },
];
