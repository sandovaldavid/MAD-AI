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
            import('@presentation/users-module/users-module.routes').then(
                (m) => m.USER_MODULE_ROUTES
            ),
        title: 'Gestión de Usuarios',
    },
];
