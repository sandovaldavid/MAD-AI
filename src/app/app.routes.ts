import { Routes } from '@angular/router';
import { authRoutes } from '@presentation/auth/auth.routes';

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/auth/login',
        pathMatch: 'full',
    },
    {
        path: 'auth',
        children: authRoutes,
    },
    {
        path: 'dashboard',
        loadComponent: () =>
            import('@presentation/pages/dashboard/dashboard').then((m) => m.Dashboard),
        title: 'Dashboard | MAD-AI',
    },
    {
        path: 'test-components',
        loadComponent: () =>
            import('@presentation/test-components/test-components').then((m) => m.TestComponents),
        title: 'Test Component | MAD-AI',
    },
    {
        path: '**',
        redirectTo: '/auth/login',
    },
];
