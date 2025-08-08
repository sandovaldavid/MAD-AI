import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
    selector: 'icon-clock',
    templateUrl: './clock.icon.html',
    styleUrl: './clock.icon.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClockIcon {
    size = input<string>('24');
    customClass = input<string>('');
}
