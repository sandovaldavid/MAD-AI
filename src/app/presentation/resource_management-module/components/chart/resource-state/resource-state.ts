import { Component, inject, OnInit, signal, effect, ViewChild } from '@angular/core';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { GetResourceStatsUseCase } from '@application/use-cases/resource-management/get-resource-stats.use-case';
import { ResourceTotals } from '@domain/models/resource-management/resource-totals.model';
import { FontAwesomeIconsModule } from '@/app/fontawesome-icons';
import { ThemeService } from '@core/services/theme.service';

@Component({
    selector: 'app-resource-state',
    standalone: true,
    imports: [BaseChartDirective, FontAwesomeIconsModule],
    templateUrl: './resource-state.html',
    styleUrls: ['./resource-state.css'],
})
export class ResourceState implements OnInit {
    @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;
    private readonly getResourceStatsUseCase = inject(GetResourceStatsUseCase);
    private readonly themeService = inject(ThemeService);

    public pieChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'right',
            },
        },
    };
    public pieChartData = signal<ChartData<'pie', number[], string | string[]>>({
        labels: [],
        datasets: [{ data: [] }],
    });
    public pieChartType: ChartType = 'pie';

    constructor() {
        effect(() => {
            const isDark = this.themeService.isDarkMode();
            this.pieChartOptions = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'right',
                        labels: {
                            color: isDark ? 'white' : 'black',
                        },
                    },
                },
            };
        });
    }

    ngOnInit(): void {
        this.loadStats();
    }

    loadStats(): void {
        this.getResourceStatsUseCase.execute().subscribe((response) => {
            const totals: ResourceTotals = response.totales;
            const labels = [
                'Activos',
                'Inactivos',
                'Asignados',
                'Disponibles',
                'En Mantenimiento',
                'No Disponibles',
            ];
            const data = [
                totals.activos,
                totals.inactivos,
                totals.asignados,
                totals.disponibles,
                totals.en_mantenimiento,
                totals.no_disponibles,
            ];

            this.pieChartData.set({
                labels,
                datasets: [
                    {
                        data,
                        backgroundColor: [
                            '#4CAF50',
                            '#F44336',
                            '#FFC107',
                            '#2196F3',
                            '#9C27B0',
                            '#795548',
                        ],
                    },
                ],
            });
        });
    }
}
