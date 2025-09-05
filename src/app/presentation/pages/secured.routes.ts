import { Routes } from '@angular/router';
import { rolesRoutes } from './roles/roles.routes';
import { provideRoles } from '@di/provide-roles';
import { RolesFacade } from '@application/facades/roles.facade';

export const securedRoutes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('@presentation/pages/dashboard/dashboard').then((m) => m.Dashboard),
    title: 'Dashboard',
  },
  {
    path: 'roles',
    children: rolesRoutes,
    providers: [...provideRoles(), RolesFacade],
  },
];
