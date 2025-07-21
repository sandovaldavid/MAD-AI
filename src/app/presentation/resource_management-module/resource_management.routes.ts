import { Routes } from '@angular/router';
import { DashboardRm } from './pages/dashboard-rm/dashboard-rm';

export const RESOURCE_MANAGEMENT_ROUTES: Routes = [
    {
        path: 'dashboard',
        component: DashboardRm,
    },
    {
        path: 'resource-management/dashboard',
        redirectTo: 'dashboard',
        pathMatch: 'full',
    },
];
