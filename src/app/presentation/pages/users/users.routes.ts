/**
 * Users Feature Routes Configuration
 *
 * @description
 * Defines the routing structure for the Users management feature.
 * Follows lazy loading patterns for optimal performance and implements
 * proper guards for access control and data protection.
 *
 * @responsibilities
 * - Define routes for all user management pages
 * - Implement lazy loading for performance optimization
 * - Configure route guards for security and access control
 * - Set up proper navigation titles and breadcrumbs
 * - Handle route parameters and query parameters
 *
 * @architecture
 * - Lazy loading: All components loaded on demand
 * - Guard protection: Role-based access control
 * - Title management: Automatic page title setting
 * - Breadcrumb support: Navigation context preservation
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Presentation
 */

import { Routes } from '@angular/router';
import { roleGuard } from '@presentation/services/guards/role.guard';

export const usersRoutes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full',
  },
  {
    path: 'list',
    loadComponent: () =>
      import('./pages/users-list/users-list.component').then((m) => m.UsersListPage),
    title: 'Users Management',
    canActivate: [roleGuard],
    data: {
      requiredRoles: ['admin', 'user_manager'],
      breadcrumb: 'Users List',
      pageTitle: 'Users Management',
      pageDescription: 'Manage users, roles, and permissions',
    },
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./pages/create-user/create-user.component').then((m) => m.CreateUserPage),
    title: 'Create User',
    canActivate: [roleGuard],
    data: {
      requiredRoles: ['admin', 'user_manager'],
      breadcrumb: 'Create User',
      pageTitle: 'Create New User',
      pageDescription: 'Add a new user to the system',
    },
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('./pages/edit-user/edit-user.component').then((m) => m.EditUserPage),
    title: 'Edit User',
    canActivate: [roleGuard],
    data: {
      requiredRoles: ['admin', 'user_manager'],
      breadcrumb: 'Edit User',
      pageTitle: 'Edit User',
      pageDescription: 'Modify user information and settings',
    },
  },
  {
    path: 'detail/:id',
    loadComponent: () =>
      import('./pages/user-detail/user-detail.component').then((m) => m.UserDetailPage),
    title: 'User Detail',
    canActivate: [roleGuard],
    data: {
      requiredRoles: ['admin', 'user_manager', 'viewer'],
      breadcrumb: 'User Detail',
      pageTitle: 'User Details',
      pageDescription: 'View detailed user information',
    },
  },
  {
    path: ':id',
    redirectTo: 'detail/:id',
    pathMatch: 'full',
  },
];