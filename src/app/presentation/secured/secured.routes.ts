import { Routes } from '@angular/router';

export const securedRoutes: Routes = [
    {
        path: 'dashboard',
        loadComponent: () =>
            import('@presentation/pages/dashboard/dashboard').then((m) => m.Dashboard),
        title: 'Dashboard',
    },
    {
        path: 'test-components',
        loadComponent: () =>
            import('@presentation/test-components/test-components').then((m) => m.TestComponents),
        title: 'Componentes de Prueba',
    },
];
