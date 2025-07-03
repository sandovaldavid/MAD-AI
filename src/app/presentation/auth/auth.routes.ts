import { Routes } from '@angular/router';

export const authRoutes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./pages/login/login').then((m) => m.Login),
        title: 'Iniciar Sesión | MAD-AI',
    },
    {
        path: 'register',
        loadComponent: () => import('./pages/register/register').then((m) => m.Register),
        title: 'Registrarse | MAD-AI',
    },
    {
        path: 'reset-password',
        loadComponent: () =>
            import('./pages/reset-password/reset-password').then((m) => m.ResetPassword),
        title: 'Recuperar Contraseña | MAD-AI',
    },
];
