import { Routes } from '@angular/router';
import { authOnly, guestOnly, emailConfirmedOnly } from './core/guards';
import { securedRoutes } from '@presentation/features/secured.routes';
import { authRoutes } from '@presentation/features/auth/auth.routes';

export const routes: Routes = [
  {
    path: 'auth',
    canMatch: [guestOnly],
    loadComponent: () =>
      import('@presentation/layouts/auth-layout/auth-layout').then((m) => m.AuthLayout),
    children: authRoutes,
  },
  {
    path: '',
    canMatch: [authOnly, emailConfirmedOnly],
    loadComponent: () =>
      import('@presentation/layouts/main-layout/main-layout').then((m) => m.MainLayout),
    children: securedRoutes,
  },
  {
    path: '**',
    loadComponent: () =>
      import('@presentation/features/not-found/not-found').then((m) => m.NotFoundPage),
    title: 'Página no encontrada',
  },
];
