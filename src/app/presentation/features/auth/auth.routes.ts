import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
    title: 'Iniciar Sesión',
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register').then((m) => m.Register),
    title: 'Registrarse',
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./pages/reset-password/reset-password').then((m) => m.ResetPassword),
    title: 'Recuperar Contraseña',
  },
  {
    path: 'change-password',
    loadComponent: () =>
      import('./pages/change-password/change-password').then((m) => m.ChangePassword),
    title: 'Cambiar Contraseña',
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./pages/verify-email/verify-email').then((m) => m.VerifyEmail),
    title: 'Verificar Email',
  },
];
