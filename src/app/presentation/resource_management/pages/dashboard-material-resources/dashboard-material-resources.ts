import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialResourcesStats } from '../../components/stats/material-resources-stats/material-resources-stats';
import { MaterialResourceByType } from '../../components/chart/material-resource-by-type/material-resource-by-type';
import { MaterialResourceStock } from '../../components/chart/material-resource-stock/material-resource-stock';
import { Button } from '@shared/components/ui/button/button';
import { FontAwesomeIconsModule } from '@/app/fontawesome-icons';
import { Router } from '@angular/router';

@Component({
    selector: 'app-dashboard-material-resources',
    standalone: true,
    imports: [
        CommonModule,
        MaterialResourcesStats,
        MaterialResourceByType,
        MaterialResourceStock,
        Button,
        FontAwesomeIconsModule,
    ],
    templateUrl: './dashboard-material-resources.html',
    styleUrls: ['./dashboard-material-resources.css'],
})
export class DashboardMaterialResources {
    private readonly router = inject(Router);

    navigateTo(path: string): void {
        this.router.navigate([path]);
    }
}
