import { Routes } from '@angular/router';

export const rolesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/roles-list/roles-list').then((m) => m.RolesList),
  },
  {
    path: 'new',
    loadComponent: () => import('./pages/create-role/create-role').then((m) => m.CreateRole),
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/role-detail/role-detail').then((m) => m.RoleDetail),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./pages/update-role/update-role').then((m) => m.UpdateRole),
  },
];
