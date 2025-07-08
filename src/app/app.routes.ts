import { Routes } from '@angular/router';
import { authRoutes } from '@presentation/auth/auth.routes';
import { securedRoutes } from '@presentation/secured/secured.routes';
import { AuthGuard } from '@core/guards/auth.guard';
import { GuestGuard } from '@core/guards/guest.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full',
    },
    {
        path: 'auth',
        loadComponent: () =>
            import('@presentation/layouts/auth-layout/auth-layout').then(
                (m) => m.AuthLayoutComponent
            ),
        canActivate: [GuestGuard],
        children: authRoutes,
    },
    {
        path: '',
        loadComponent: () =>
            import('@presentation/layouts/main-layout/main-layout').then(
                (m) => m.MainLayoutComponent
            ),
        canActivate: [AuthGuard],
        children: securedRoutes,
    },
    {
        path: '**',
        redirectTo: '/dashboard',
    },
];
