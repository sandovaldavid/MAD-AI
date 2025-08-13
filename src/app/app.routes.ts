import { Routes } from '@angular/router';
import { authOnly, guestOnly } from './core/guards/matchers.guard';
import { emailConfirmedOnly } from './core/guards/email-confirmed.guard';
import { rolesRoutes } from '@presentation/features/roles/roles.routes';
import { authRoutes } from '@presentation/features/auth/auth.routes';

export const routes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    {
        path: 'auth',
        canMatch: [guestOnly],
        loadComponent: () =>
            import('@shared/layouts/auth-layout/auth-layout').then((m) => m.AuthLayout),
        children: authRoutes,
    },
    {
        path: 'roles',
        canMatch: [authOnly, emailConfirmedOnly],
        loadChildren: () =>
            import('@shared/layouts/main-layout/main-layout').then((m) => m.MainLayout),
        children: rolesRoutes,
    },
    {
        /* TODO: crear un componente para error 404 */
        path: '**',
        redirectTo: '/dashboard',
    },
];
