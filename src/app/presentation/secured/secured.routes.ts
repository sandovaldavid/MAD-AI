import { Routes } from '@angular/router';

export const securedRoutes: Routes = [
    {
        path: 'dashboard',
        loadComponent: () =>
            import('@presentation/pages/dashboard/dashboard').then((m) => m.Dashboard),
        title: 'Dashboard',
    },
    {
        path: 'users',
        loadChildren: () =>
            import('@presentation/users-module/users-module.routes').then((m) => m.USER_MODULE_ROUTES),
        title: 'Gestión de Usuarios',
    },
    {
        path: 'test-components',
        loadComponent: () =>
            import('@presentation/test-components/test-components').then((m) => m.TestComponents),
        title: 'Componentes de Prueba',
    },
];
