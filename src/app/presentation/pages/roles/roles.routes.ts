import { Routes } from '@angular/router';

export const rolesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/roles-list/roles-list').then((m) => m.RolesList),
    title: 'Gestión de Roles',
  },
  {
    path: 'new',
    loadComponent: () => import('./pages/create-role/create-role').then((m) => m.CreateRole),
    title: 'Crear Rol',
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/role-detail/role-detail').then((m) => m.RoleDetail),
    title: 'Detalles del Rol',
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./pages/update-role/update-role').then((m) => m.UpdateRole),
    title: 'Editar Rol',
  },
];
