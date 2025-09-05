import { Routes } from '@angular/router';
import {
  authGuard as authOnly,
  noAuthGuard as guestOnly,
} from './presentation/services/guards/auth.guard';
import { emailConfirmedOnly } from './presentation/services/guards/email-confirmed.guard';
import { securedRoutes } from '@/app/presentation/pages/secured.routes';
import { authRoutes } from '@/app/presentation/pages/auth/auth.routes';

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
      import('@presentation/pages/not-found/not-found').then((m) => m.NotFoundPage),
    title: 'Página no encontrada',
  },
];
