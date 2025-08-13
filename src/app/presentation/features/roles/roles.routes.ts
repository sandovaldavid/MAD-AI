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
        path: ':id',
        providers: [...provideRoles(), RolesFacade],
        loadComponent: () => import('./pages/role-detail/role-detail').then((m) => m.RoleDetail),
    },
];
