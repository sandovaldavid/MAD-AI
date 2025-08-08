import { Routes } from '@angular/router';

export const securedRoutes: Routes = [
    {
        path: 'dashboard',
        loadComponent: () => import('@presentation/dashboard/dashboard').then((m) => m.Dashboard),
        title: 'Dashboard',
    },
    {
        path: 'users',
        loadChildren: () =>
            import('@presentation/users/users-module.routes').then(
                (m) => m.USER_MODULE_ROUTES
            ),
        title: 'Gestión de Usuarios',
    },
    {
        path: 'profile',
        loadChildren: () => import('@presentation/profile/profile.routes').then((m) => m.default),
        title: 'Perfil',
    },
    {
        path: 'resource-management',
        loadChildren: () =>
            import('@presentation/resource_management/resource_management.routes').then(
                (m) => m.RESOURCE_MANAGEMENT_ROUTES
            ),
        title: 'Gestión de Recursos',
    },
];
