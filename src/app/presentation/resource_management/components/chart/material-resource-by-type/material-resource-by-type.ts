import { Component, inject, OnInit, signal, effect, ViewChild } from '@angular/core';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { GetMaterialResourceStatsUseCase } from '@application/use-cases/resource-management/get-material-resource-stats.use-case';
import { ThemeService } from '@core/services/theme.service';
import { FontAwesomeIconsModule } from '@/app/fontawesome-icons';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-material-resource-by-type',
    standalone: true,
    imports: [CommonModule, BaseChartDirective, FontAwesomeIconsModule],
    templateUrl: './material-resource-by-type.html',
    styleUrls: ['./material-resource-by-type.css'],
})
export class MaterialResourceByType implements OnInit {
    @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;
    private readonly getMaterialResourceStatsUseCase = inject(GetMaterialResourceStatsUseCase);
    private readonly themeService = inject(ThemeService);

    public doughnutChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'right',
            },
        },
    };
    public doughnutChartData = signal<ChartData<'doughnut'>>({
        labels: ['Consumibles', 'Permanentes'],
        datasets: [
            {
                data: [],
                backgroundColor: ['hsl(45, 90%, 55%)', 'hsl(220, 85%, 60%)'],
                borderColor: this.themeService.isDarkMode() ? 'hsl(240, 10%, 15%)' : 'white',
                borderWidth: 2,
            },
        ],
    });
    public doughnutChartType: ChartType = 'doughnut';

    constructor() {
        effect(() => {
            const isDark = this.themeService.isDarkMode();
            this.doughnutChartOptions = {
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
            this.doughnutChartData.update((d) => {
                d.datasets[0].borderColor = isDark ? 'hsl(240, 10%, 15%)' : 'white';
                return { ...d };
            });
        });
    }

    ngOnInit(): void {
        this.loadStats();
    }

    loadStats(): void {
        this.getMaterialResourceStatsUseCase.execute().subscribe((response) => {
            this.doughnutChartData.update((d) => {
                d.datasets[0].data = [response.consumable_resources, response.permanent_resources];
                return { ...d };
            });
        });
    }
}
