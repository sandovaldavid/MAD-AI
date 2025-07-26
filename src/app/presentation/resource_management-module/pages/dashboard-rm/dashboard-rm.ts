import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResourcesTable } from '../../components/tables/resources-table/resources-table';
import { HumanResource } from '@domain/entities/resource-management/human-resource.entity';
import { MaterialResource } from '@domain/entities/resource-management/material-resource.entity';
import { Absence } from '@domain/entities/resource-management/absence.entity';
import { HumanResourceUseCases } from '@application/use-cases/resource-management/human-resource.use-case';
import { MaterialResourceUseCases } from '@application/use-cases/resource-management/material-resource.use-case';
import { AbsenceUseCases } from '@application/use-cases/resource-management/absence.use-case';
import { ResourcesStats } from '../../components/stats/resources-stats/resources-stats';
import { ResourceState } from '../../components/chart/resource-state/resource-state';
import { ResourceType } from '../../components/chart/resource-type/resource-type';
import { FontAwesomeIconsModule } from '@/app/fontawesome-icons';
import { Button } from '@shared/components/ui/button/button';
import { Router, RouterModule } from '@angular/router';
import { GetResourceStatsUseCase } from '@application/use-cases/resource-management/get-resource-stats.use-case';
import { GeneralStatistics } from '@domain/models/resource-management/resource-stats.model';

@Component({
    selector: 'app-dashboard-rm',
    standalone: true,
    imports: [
        CommonModule,
        ResourcesTable,
        ResourcesStats,
        ResourceState,
        ResourceType,
        FontAwesomeIconsModule,
        Button,
        RouterModule,
    ],
    templateUrl: './dashboard-rm.html',
    styleUrls: ['./dashboard-rm.css'],
})
export class DashboardRm implements OnInit {
    private readonly router = inject(Router);
    private readonly humanResourceUseCases = inject(HumanResourceUseCases);
    private readonly materialResourceUseCases = inject(MaterialResourceUseCases);
    private readonly absenceUseCases = inject(AbsenceUseCases);
    private readonly getResourceStatsUseCase = inject(GetResourceStatsUseCase);

    // Signals for real API data
    protected readonly stats = signal<GeneralStatistics | null>(null);
    protected readonly humanResources = signal<HumanResource[]>([]);
    protected readonly materialResources = signal<MaterialResource[]>([]);
    protected readonly absences = signal<Absence[]>([]);

    // Stat card values (computed from signals)
    protected readonly humanResourceCount = computed(() => this.humanResources().length);
    protected readonly materialResourceCount = computed(() => this.materialResources().length);
    protected readonly absenceCount = computed(() => this.absences().length);

    // Derived signals for child components
    protected readonly resourceStats = computed(() => this.stats()?.estadisticas_generales ?? null);
    protected readonly resourceTotals = computed(() => this.stats()?.totales ?? null);
    protected readonly resourcesByType = computed(() => this.stats()?.por_tipo ?? null);

    // Utilization (example: % of resources currently absent)
    protected readonly humanUtilization = computed(() => {
        const total = this.humanResources().length;
        if (!total) return 0;
        // Count unique human resources with an active absence
        const now = new Date();
        const absentIds = new Set(
            this.absences()
                .filter((a) => {
                    const start = new Date(a.start_date);
                    const end = new Date(a.end_date);
                    return start <= now && end >= now && a.resource;
                })
                .map((a) => a.resource)
        );
        return Math.round(((total - absentIds.size) / total) * 100);
    });

    protected readonly materialUtilization = computed(() => {
        const allMaterialResources = this.materialResources();
        const total = allMaterialResources.length;
        if (!total) return 0;

        const availableCount = allMaterialResources.filter(
            (r) => r.availability_status === 'available'
        ).length;

        console.log(availableCount);

        return Math.round((availableCount / total) * 100);
    });

    protected readonly utilizationData = computed(() => [
        { name: 'Human Resources', value: this.humanUtilization() },
        { name: 'Material Resources', value: this.materialUtilization() },
    ]);

    navigateTo(path: string): void {
        this.router.navigate([path]);
    }

    ngOnInit(): void {
        this.getResourceStatsUseCase.execute().subscribe((data) => this.stats.set(data));

        this.humanResourceUseCases.getAllHumanResources().subscribe((data: HumanResource[]) => {
            this.humanResources.set(data || []);
        });

        this.materialResourceUseCases
            .getAllMaterialResources()
            .subscribe((data: MaterialResource[]) => {
                this.materialResources.set(data || []);
            });

        this.absenceUseCases.getAllAbsences().subscribe((data: Absence[]) => {
            this.absences.set(data || []);
        });
    }
}
