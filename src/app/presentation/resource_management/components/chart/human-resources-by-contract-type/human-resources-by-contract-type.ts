import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeIconsModule } from '@/app/fontawesome-icons';
import { Chart, ChartType, registerables } from 'chart.js';
import { GetHumanResourcesStatsUseCase } from '@application/use-cases/resource-management/get-human-resources-stats.use-case';
import { HumanResourcesStats } from '@domain/models/resource-management/human-resources-stats.model';

Chart.register(...registerables);

@Component({
    selector: 'app-human-resources-by-contract-type',
    standalone: true,
    imports: [CommonModule, FontAwesomeIconsModule],
    templateUrl: './human-resources-by-contract-type.html',
    styleUrl: './human-resources-by-contract-type.css',
})
export class HumanResourcesByContractType implements OnInit {
    private readonly getStatsUseCase = inject(GetHumanResourcesStatsUseCase);
    stats = signal<HumanResourcesStats | null>(null);
    chart: Chart | null = null;

    // Paleta de colores para los tipos de contrato
    readonly contractTypeColors = [
        '#22c55e', // FULL_TIME
        '#f59e42', // PART_TIME
        '#6366f1', // REMOTE
        '#0ea5e9', // CONTRACTOR
    ];

    // Exponer Object para *ngFor
    readonly Object = Object;

    getColor(index: number): string {
        return this.contractTypeColors[index % this.contractTypeColors.length];
    }

    ngOnInit(): void {
        this.getStatsUseCase.execute().subscribe((data) => {
            this.stats.set(data);
            this.renderChart();
        });
    }

    renderChart(): void {
        const stats = this.stats();
        if (!stats || !stats.employment_distribution) return;

        const labels = Object.keys(stats.employment_distribution);
        const data = Object.values(stats.employment_distribution);
        const backgroundColors = this.contractTypeColors.slice(0, labels.length);
        const borderColors = Array(labels.length).fill('#fff');

        const canvas = document.getElementById('contractTypeChart') as HTMLCanvasElement | null;
        if (!canvas) return;

        if (this.chart) {
            this.chart.destroy();
        }

        // Función para obtener el color correcto según el modo
        const getLabelColor = () =>
            document.documentElement.classList.contains('dark') ? '#fff' : '#334155';

        this.chart = new Chart(canvas, {
            type: 'doughnut' as ChartType,
            data: {
                labels,
                datasets: [
                    {
                        label: 'Cantidad',
                        data,
                        backgroundColor: backgroundColors,
                        borderColor: borderColors,
                        borderWidth: 1,
                    },
                ],
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            color: getLabelColor(),
                            font: { weight: 'bold' },
                        },
                    },
                    tooltip: { enabled: true },
                },
            },
        });

        // Observer para actualizar el color al cambiar el modo
        const observer = new MutationObserver(() => {
            if (this.chart) {
                this.chart.options.plugins!.legend!.labels!.color = getLabelColor();
                this.chart.update();
            }
        });
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });
    }
}
