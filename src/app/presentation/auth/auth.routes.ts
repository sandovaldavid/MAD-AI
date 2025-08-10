import { authOnly } from '@/app/core/guards/matchers.guard';
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
    // Página para usuarios logueados pero con email NO confirmado
    {
        path: 'auth/verify-email',
        canMatch: [authOnly], // debe estar logueado
        loadComponent: () => import('./pages/verify-email/verify-email').then((m) => m.VerifyEmail),
    },
];
