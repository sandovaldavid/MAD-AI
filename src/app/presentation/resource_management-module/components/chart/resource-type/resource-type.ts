import { Component, inject, OnInit, signal } from '@angular/core';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { GetResourceStatsUseCase } from '@application/use-cases/resource-management/get-resource-stats.use-case';
import { ThemeService } from '@core/services/theme.service';
import { effect } from '@angular/core';
import { FontAwesomeIconsModule } from '@/app/fontawesome-icons';

@Component({
    selector: 'app-resource-type',
    standalone: true,
    imports: [BaseChartDirective, FontAwesomeIconsModule],
    templateUrl: './resource-type.html',
    styleUrls: ['./resource-type.css'],
})
export class ResourceType implements OnInit {
    private readonly getResourceStatsUseCase = inject(GetResourceStatsUseCase);
    private readonly themeService = inject(ThemeService);

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
    public barChartData = signal<ChartData<'bar'>>({
        labels: [],
        datasets: [{ data: [], label: 'Disponibles' }],
    });
    public barChartType: ChartType = 'bar';

    constructor() {
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

    ngOnInit(): void {
        this.loadStats();
    }

    loadStats(): void {
        this.getResourceStatsUseCase.execute().subscribe((response) => {
            const porTipo = response.por_tipo;
            const labels = Object.keys(porTipo);
            const data = labels.map((key) => porTipo[key].disponibles);

            this.barChartData.set({
                labels,
                datasets: [
                    {
                        data,
                        label: 'Disponibles',
                        backgroundColor: '#3B82F6',
                    },
                ],
            });
        });
    }
}
