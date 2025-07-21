import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersIconComponent } from '../icons/users-icon.component';
import { BoxIconComponent } from '../icons/box-icon.component';
import { CalendarOffIconComponent } from '../icons/calendar-off-icon.component';
import { LineChartIconComponent } from '../icons/line-chart-icon.component';

@Component({
    selector: 'app-stat-card',
    standalone: true,
    imports: [
        CommonModule,
        UsersIconComponent,
        BoxIconComponent,
        CalendarOffIconComponent,
        LineChartIconComponent,
    ],
    templateUrl: './stat-card.component.html',
    styleUrls: ['./stat-card.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCardComponent {
    title = input.required<string>();
    value = input.required<string | number>();
    change = input<number>();
    icon = input.required<'users' | 'box' | 'calendar-off' | 'line-chart'>();

    public iconColor = computed(() => {
        switch (this.icon()) {
            case 'users':
                return 'blue';
            case 'box':
                return 'green';
            case 'calendar-off':
                return 'yellow';
            case 'line-chart':
                return 'indigo';
            default:
                return 'gray';
        }
    });
}
