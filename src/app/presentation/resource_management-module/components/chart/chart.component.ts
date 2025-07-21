import { ChangeDetectionStrategy, Component, input, computed } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { ChartDoughnutIconComponent } from '../icons/chart-doughnut-icon.component';
import { ChartEmptyIconComponent } from '../icons/chart-empty-icon.component';

@Component({
    selector: 'app-chart',
    standalone: true,
    imports: [ChartDoughnutIconComponent, ChartEmptyIconComponent, BaseChartDirective],
    templateUrl: './chart.component.html',
    styleUrl: './chart.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartComponent {
    title = input.required<string>();
    data = input.required<{ name: string; value: number }[]>();

    public doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
            legend: {
                display: true,
                position: 'bottom',
                labels: {
                    color: '#6b7280',
                    padding: 20,
                    usePointStyle: true,
                    pointStyle: 'circle',
                },
            },
        },
    };

    public doughnutChartData = computed<ChartConfiguration<'doughnut'>['data']>(() => {
        const chartData = this.data();
        return {
            labels: chartData.map((d) =>
                d.name === 'Human Resources' ? 'Rec. Humanos' : 'Rec. Materiales'
            ),
            datasets: [
                {
                    data: chartData.map((d) => d.value),
                    backgroundColor: ['#3b82f6', '#10b981'],
                    borderColor: ['#ffffff'],
                    borderWidth: 2,
                    hoverBackgroundColor: ['#2563eb', '#059669'],
                    hoverBorderColor: ['#ffffff'],
                },
            ],
        };
    });
}
