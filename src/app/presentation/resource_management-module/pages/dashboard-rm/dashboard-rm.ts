import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatCardComponent } from '../../components/stat-card/stat-card.component';
import { ChartComponent } from '../../components/chart/chart.component';
import { HumanResourceUseCases } from '@application/use-cases/resource-management/human-resource.use-case';
import { MaterialResourceUseCases } from '@application/use-cases/resource-management/material-resource.use-case';
import { AbsenceUseCases } from '@application/use-cases/resource-management/absence.use-case';
import { HumanResource } from '@domain/entities/resource-management/human-resource.entity';
import { MaterialResource } from '@domain/entities/resource-management/material-resource.entity';
import { Absence } from '@domain/entities/resource-management/absence.entity';

@Component({
    selector: 'app-dashboard-rm',
    standalone: true,
    imports: [CommonModule, StatCardComponent, ChartComponent],
    templateUrl: './dashboard-rm.html',
    styleUrls: ['./dashboard-rm.css'],
})
export class DashboardRm implements OnInit {
    private readonly humanResourceUseCases = inject(HumanResourceUseCases);
    private readonly materialResourceUseCases = inject(MaterialResourceUseCases);
    private readonly absenceUseCases = inject(AbsenceUseCases);

    // Signals for real API data (or mock if empty)
    protected readonly humanResources = signal<HumanResource[]>([]);
    protected readonly materialResources = signal<MaterialResource[]>([]);
    protected readonly absences = signal<Absence[]>([]);

    // Stat card values (computed from signals)
    protected readonly humanResourceCount = computed(() => this.humanResources().length);
    protected readonly materialResourceCount = computed(() => this.materialResources().length);
    protected readonly absenceCount = computed(() => this.absences().length);

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
        // Placeholder: all material resources are available
        const total = this.materialResources().length;
        return total ? 100 : 0;
    });

    protected readonly utilizationData = computed(() => [
        { name: 'Human Resources', value: this.humanUtilization() },
        { name: 'Material Resources', value: this.materialUtilization() },
        // Add more categories as needed
    ]);

    ngOnInit(): void {
        this.humanResourceUseCases
            .getAllHumanResources()
            .subscribe(async (data: HumanResource[]) => {
                if (data && data.length > 0) {
                    this.humanResources.set(data);
                } else {
                    const mock = await import('./database/human-resources.mock.json');
                    const casted = (mock.default ?? mock).map((hr: any) => ({
                        ...hr,
                        role: hr.role as
                            | 'senior'
                            | 'junior'
                            | 'specialist'
                            | 'consultant'
                            | 'intern',
                    }));
                    this.humanResources.set(casted);
                }
            });
        this.materialResourceUseCases
            .getAllMaterialResources()
            .subscribe(async (data: MaterialResource[]) => {
                if (data && data.length > 0) {
                    this.materialResources.set(data);
                } else {
                    const mock = await import('./database/material-resources.mock.json');
                    const casted = (mock.default ?? mock).map((mr: any) => ({
                        ...mr,
                        unit_of_measure: mr.unit_of_measure as
                            | 'unit'
                            | 'hour'
                            | 'day'
                            | 'sprint'
                            | 'story_point'
                            | 'task'
                            | 'license'
                            | 'user'
                            | 'instance'
                            | 'month'
                            | 'service',
                    }));
                    this.materialResources.set(casted);
                }
            });
        this.absenceUseCases.getAllAbsences().subscribe(async (data: Absence[]) => {
            if (data && data.length > 0) {
                this.absences.set(data);
            } else {
                const mock = await import('./database/absences.mock.json');
                const casted = (mock.default ?? mock).map((a: any) => ({
                    ...a,
                    absence_type: a.absence_type as
                        | 'vacation'
                        | 'sick_leave'
                        | 'training'
                        | 'maintenance'
                        | 'conference'
                        | 'personal'
                        | 'other',
                }));
                this.absences.set(casted);
            }
        });
    }
}
