import { Routes } from '@angular/router';

export const ROLES_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./roles').then((m) => m.Roles),
        title: 'Gestión de Roles',
    },
    {
        path: 'create',
        loadComponent: () => import('./create-role/create-role').then((m) => m.CreateRole),
        title: 'Crear Rol',
    },
    {
        path: ':id',
        loadComponent: () => import('./detail-role/detail-role').then((m) => m.DetailRole),
        title: 'Detalle del Rol',
    },
    {
        path: ':id/edit',
        loadComponent: () => import('./update-role/update-role').then((m) => m.UpdateRole),
        title: 'Editar Rol',
    },
    {
        path: ':id/delete',
        loadComponent: () => import('./delete-role/delete-role').then((m) => m.DeleteRole),
        title: 'Eliminar Rol',
    },
];
