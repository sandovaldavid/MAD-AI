import { Component, effect, inject, input, ViewChild } from '@angular/core';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { ThemeService } from '@core/services/theme.service';
import { FontAwesomeIconsModule } from '@/app/fontawesome-icons';
import { ResourcesByType } from '@domain/models/resource-management/resource-type-stats.model';

@Component({
    selector: 'app-resource-type',
    standalone: true,
    imports: [BaseChartDirective, FontAwesomeIconsModule],
    templateUrl: './resource-type.html',
    styleUrls: ['./resource-type.css'],
})
export class ResourceType {
    @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;
    private readonly themeService = inject(ThemeService);

    resourcesByType = input<ResourcesByType | null>(null);

    public barChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        indexAxis: 'y',
        scales: {
            x: {
                ticks: {
                    color: this.themeService.isDarkMode() ? 'white' : 'black',
                },
            },
            y: {
                ticks: {
                    color: this.themeService.isDarkMode() ? 'white' : 'black',
                },
            },
        },
        plugins: {
            legend: {
                display: false,
            },
        },
    };
    public barChartData: ChartData<'bar'> = {
        labels: [],
        datasets: [{ data: [], label: 'Disponibles' }],
    };
    public barChartType: ChartType = 'bar';

    constructor() {
        effect(() => {
            const porTipo = this.resourcesByType();
            if (porTipo) {
                const labels = Object.keys(porTipo);
                const data = labels.map((key) => porTipo[key].disponibles);
                this.barChartData = {
                    labels,
                    datasets: [
                        {
                            data,
                            label: 'Disponibles',
                            backgroundColor: '#3B82F6',
                        },
                    ],
                };
                this.chart?.update();
            }
        });

        effect(() => {
            const isDark = this.themeService.isDarkMode();
            this.barChartOptions = {
                ...this.barChartOptions,
                scales: {
                    x: {
                        ticks: {
                            color: isDark ? 'white' : 'black',
                        },
                    },
                    y: {
                        ticks: {
                            color: isDark ? 'white' : 'black',
                        },
                    },
                },
            };
        });
    }
}
