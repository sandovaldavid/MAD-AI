import { Component, effect, inject, input, ViewChild } from '@angular/core';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
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
export class ResourceState {
    @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;
    private readonly themeService = inject(ThemeService);

    totals = input<ResourceTotals | null>(null);

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
    public pieChartData: ChartData<'pie', number[], string | string[]> = {
        labels: [
            'Activos',
            'Inactivos',
            'Asignados',
            'Disponibles',
            'En Mantenimiento',
            'No Disponibles',
        ],
        datasets: [
            {
                data: [],
                backgroundColor: ['#4CAF50', '#F44336', '#FFC107', '#2196F3', '#9C27B0', '#795548'],
            },
        ],
    };
    public pieChartType: ChartType = 'pie';

    constructor() {
        effect(() => {
            const totalsData = this.totals();
            if (totalsData) {
                this.pieChartData.datasets[0].data = [
                    totalsData.activos,
                    totalsData.inactivos,
                    totalsData.asignados,
                    totalsData.disponibles,
                    totalsData.en_mantenimiento,
                    totalsData.no_disponibles,
                ];
                this.chart?.update();
            }
        });

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
}
