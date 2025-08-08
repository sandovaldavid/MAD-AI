import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'icon-user-statistics',
    imports: [],
    templateUrl: './user-statistics.icon.html',
    styleUrl: './user-statistics.icon.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserStatisticsIcon {
    size = input<string>('24');
    customClass = input<string>('text-current');
}
