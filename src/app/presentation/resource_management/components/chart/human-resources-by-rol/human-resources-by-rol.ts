import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeIconsModule } from '@/app/fontawesome-icons';
import { Chart, ChartType, registerables } from 'chart.js';
import { GetHumanResourcesStatsUseCase } from '@application/use-cases/resource-management/get-human-resources-stats.use-case';
import { HumanResourcesStats } from '@domain/models/resource-management/human-resources-stats.model';

Chart.register(...registerables);

@Component({
    selector: 'app-human-resources-by-rol',
    standalone: true,
    imports: [CommonModule, FontAwesomeIconsModule],
    templateUrl: './human-resources-by-rol.html',
    styleUrl: './human-resources-by-rol.css',
})
export class HumanResourcesByRol implements OnInit {
    private readonly getStatsUseCase = inject(GetHumanResourcesStatsUseCase);
    stats = signal<HumanResourcesStats | null>(null);
    chart: Chart | null = null;

    ngOnInit(): void {
        this.getStatsUseCase.execute().subscribe((data) => {
            this.stats.set(data);
            this.renderChart();
        });
    }

    renderChart(): void {
        const stats = this.stats();
        if (!stats || !stats.role_distribution) return;

        const labels = Object.keys(stats.role_distribution);
        const data = Object.values(stats.role_distribution);

        const canvas = document.getElementById('roleChart') as HTMLCanvasElement | null;
        if (!canvas) return;

        if (this.chart) {
            this.chart.destroy();
        }

        // Función para obtener el color correcto según el modo
        const getLabelColor = () =>
            document.documentElement.classList.contains('dark') ? '#fff' : '#334155';

        this.chart = new Chart(canvas, {
            type: 'bar' as ChartType,
            data: {
                labels,
                datasets: [
                    {
                        label: 'Cantidad',
                        data,
                        backgroundColor: '#3b82f6', // Azul principal
                        borderRadius: 8,
                        borderSkipped: false,
                        barThickness: 24,
                    },
                ],
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: true },
                },
                scales: {
                    x: {
                        grid: {
                            color: '#dbeafe', // Fondo azul claro
                        },
                        ticks: {
                            color: getLabelColor(),
                            font: { weight: 'bold' },
                        },
                    },
                    y: {
                        grid: {
                            color: '#dbeafe',
                        },
                        ticks: {
                            color: getLabelColor(),
                            font: { weight: 'bold' },
                        },
                    },
                },
            },
        });

        // Observer para actualizar el color al cambiar el modo
        const observer = new MutationObserver(() => {
            if (this.chart) {
                const color = getLabelColor();
                this.chart.options.scales!['x']!.ticks!.color = color;
                this.chart.options.scales!['y']!.ticks!.color = color;
                this.chart.update();
            }
        });
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });
    }
}
