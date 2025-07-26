import { Routes } from '@angular/router';
import { DashboardRm } from './pages/dashboard-rm/dashboard-rm';
import { DashboardMaterialResources } from './pages/dashboard-material-resources/dashboard-material-resources';

export const RESOURCE_MANAGEMENT_ROUTES: Routes = [
    {
        path: 'dashboard',
        component: DashboardRm,
    },
    {
        path: 'material-resources/dashboard',
        component: DashboardMaterialResources,
    },
];
