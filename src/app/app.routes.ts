import { Routes } from '@angular/router';
import { authRoutes } from '@presentation/auth/auth.routes';
import { profileRoutes } from '@presentation/profile/profile.routes';
import { authOnly, guestOnly } from './core/guards/matchers.guard';
import { emailConfirmedOnly } from './core/guards/email-confirmed.guard';

export const routes: Routes = [
    {
        path: 'auth',
        canMatch: [guestOnly],
        loadComponent: () =>
            import('@presentation/layouts/auth-layout/auth-layout').then(
                (m) => m.AuthLayoutComponent
            ),
        children: authRoutes,
    },
    {
        path: '/profile',
        canMatch: [authOnly, emailConfirmedOnly],
        loadComponent: () =>
            import('@presentation/layouts/main-layout/main-layout').then(
                (m) => m.MainLayoutComponent
            ),
        children: profileRoutes,
    },
    {
        path: 'dashboard',
        canMatch: [authOnly],
        loadComponent: () => import('@presentation/dashboard/dashboard').then((m) => m.Dashboard),
    },
    { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    {
        /* crear un componente para error 404 */
        path: '**',
        redirectTo: '/dashboard',
    },
];
