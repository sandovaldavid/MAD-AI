import { DetailRm } from './pages/detail-rm/detail-rm';
import { Routes } from '@angular/router';
import { DashboardRm } from './pages/dashboard-rm/dashboard-rm';
import { DashboardMaterialResources } from './pages/dashboard-material-resources/dashboard-material-resources';
import { DashboardHumanResources } from './pages/dashboard-human-resources/dashboard-human-resources';

export const RESOURCE_MANAGEMENT_ROUTES: Routes = [
    {
        path: 'dashboard',
        component: DashboardRm,
    },
    {
        path: 'material-resources/dashboard',
        component: DashboardMaterialResources,
        title: 'Dashboard de Recursos Materiales',
    },
    {
        path: 'human-resources/dashboard',
        component: DashboardHumanResources,
        title: 'Dashboard de Recursos Humanos',
    },
    {
        path: 'detail/:id',
        component: DetailRm,
        title: 'Detalle de Recurso',
    },
];
