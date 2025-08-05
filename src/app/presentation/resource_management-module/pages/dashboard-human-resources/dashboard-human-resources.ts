import { Component, inject } from '@angular/core';
import { HumanResourcesStats } from '../../components/stats/human-resources-stats/human-resources-stats';
import { HumanResourcesByRol } from '../../components/chart/human-resources-by-rol/human-resources-by-rol';
import { HumanResourcesByContractType } from '../../components/chart/human-resources-by-contract-type/human-resources-by-contract-type';
import { Button } from '@shared/components/ui/button/button';
import { FontAwesomeIconsModule } from '@/app/fontawesome-icons';
import { Router } from '@angular/router';

@Component({
    selector: 'app-dashboard-human-resources',
    standalone: true,
    imports: [
        HumanResourcesStats,
        HumanResourcesByRol,
        HumanResourcesByContractType,
        Button,
        FontAwesomeIconsModule,
    ],
    templateUrl: './dashboard-human-resources.html',
    styleUrl: './dashboard-human-resources.css',
})
export class DashboardHumanResources {
    private readonly router = inject(Router);

    navigateTo(path: string): void {
        this.router.navigate([path]);
    }
}
