import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
    selector: 'icon-calendar',
    templateUrl: './calendar.icon.html',
    styleUrl: './calendar.icon.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarIcon {
    size = input<string>('24');
    customClass = input<string>('');
}
