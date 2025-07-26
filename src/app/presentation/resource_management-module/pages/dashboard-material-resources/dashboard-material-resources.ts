import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialResourcesStats } from '../../components/stats/material-resources-stats/material-resources-stats';
import { MaterialResourceByType } from '../../components/chart/material-resource-by-type/material-resource-by-type';
import { MaterialResourceStock } from '../../components/chart/material-resource-stock/material-resource-stock';

@Component({
    selector: 'app-dashboard-material-resources',
    standalone: true,
    imports: [CommonModule, MaterialResourcesStats, MaterialResourceByType, MaterialResourceStock],
    templateUrl: './dashboard-material-resources.html',
    styleUrls: ['./dashboard-material-resources.css'],
})
export class DashboardMaterialResources {}
