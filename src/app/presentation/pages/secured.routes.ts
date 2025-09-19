import { Routes } from '@angular/router';
import { rolesRoutes } from './roles/roles.routes';
import { profileRoutes } from './profile/profile.routes';
import { usersRoutes } from './users/users.routes';
import { provideRoles } from '@di/provide-roles';
import { RolesFacade } from '@application/facades/role';
import { UsersFacade } from '@application/facades/users';

export const securedRoutes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('@presentation/pages/dashboard/dashboard').then((m) => m.Dashboard),
    title: 'Dashboard',
  },
  {
    path: 'users',
    children: usersRoutes,
    providers: [UsersFacade],
    title: 'Users Management',
  },
  {
    path: 'roles',
    children: rolesRoutes,
    providers: [...provideRoles(), RolesFacade],
  },
  {
    path: 'profile',
    children: profileRoutes,
    title: 'User Profile',
  },
];
