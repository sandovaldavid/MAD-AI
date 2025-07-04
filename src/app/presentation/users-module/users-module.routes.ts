import { Routes } from '@angular/router';

export const USER_MODULE_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/dashboard/dashboard').then((c) => c.Dashboard),
        title: 'Dashboard de Usuarios',
    },
    {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard').then((c) => c.Dashboard),
        title: 'Dashboard de Usuarios',
    },
    {
        path: 'create',
        loadComponent: () => import('./pages/create-user/create-user').then((c) => c.CreateUser),
        title: 'Crear Usuario',
    },
    {
        path: ':id',
        loadComponent: () => import('./pages/detail-user/detail-user').then((c) => c.DetailUser),
        title: 'Perfil de Usuario',
    },
    {
        path: ':id/edit',
        loadComponent: () => import('./pages/update-user/update-user').then((c) => c.UpdateUser),
        title: 'Editar Usuario',
    },
    {
        path: '**',
        redirectTo: '',
    },
];
