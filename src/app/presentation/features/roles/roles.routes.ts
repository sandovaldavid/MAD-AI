import { Routes } from '@angular/router';
import { provideRoles } from '@di/provide-roles';
import { RolesFacade } from '@application/facades/roles.facade';

export const rolesRoutes: Routes = [
    {
        path: '',
        providers: [...provideRoles(), RolesFacade],
        loadComponent: () => import('./pages/roles-list/roles-list').then((m) => m.RolesList),
    },
    {
        path: 'new',
        providers: [...provideRoles(), RolesFacade],
        loadComponent: () => import('./pages/create-role/create-role').then((m) => m.CreateRole),
    },
    {
        path: ':id',
        providers: [...provideRoles(), RolesFacade],
        loadComponent: () => import('./pages/role-detail/role-detail').then((m) => m.RoleDetail),
    },
    {
        path: ':id/edit',
        providers: [...provideRoles(), RolesFacade],
        loadComponent: () => import('./pages/update-role/update-role').then((m) => m.UpdateRole),
    },
];
