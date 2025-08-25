import { Routes } from '@angular/router';
import { rolesRoutes } from './roles/roles.routes';

export const securedRoutes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('@presentation/features/dashboard/dashboard').then((m) => m.Dashboard),
    title: 'Dashboard',
  },
  {
    path: 'roles',
    children: rolesRoutes,
  },
];
