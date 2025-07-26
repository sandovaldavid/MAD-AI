import { Component, inject, OnInit, signal, effect, ViewChild } from '@angular/core';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { GetMaterialResourceStatsUseCase } from '@application/use-cases/resource-management/get-material-resource-stats.use-case';
import { ThemeService } from '@core/services/theme.service';
import { FontAwesomeIconsModule } from '@/app/fontawesome-icons';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-material-resource-stock',
    standalone: true,
    imports: [CommonModule, BaseChartDirective, FontAwesomeIconsModule],
    templateUrl: './material-resource-stock.html',
    styleUrls: ['./material-resource-stock.css'],
})
export class MaterialResourceStock implements OnInit {
    @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;
    private readonly getMaterialResourceStatsUseCase = inject(GetMaterialResourceStatsUseCase);
    private readonly themeService = inject(ThemeService);

    public barChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
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
        labels: ['Máximo', 'Mínimo', 'Promedio'],
        datasets: [{ data: [], label: 'Stock' }],
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
        this.getMaterialResourceStatsUseCase.execute().subscribe((response) => {
            this.barChartData.set({
                labels: ['Máximo', 'Mínimo', 'Promedio'],
                datasets: [
                    {
                        data: [
                            response.maximum_stock,
                            response.minimum_stock,
                            response.average_stock,
                        ],
                        label: 'Stock',
                        backgroundColor: ['#4CAF50', '#F44336', '#2196F3'],
                    },
                ],
            });
        });
    }
}
