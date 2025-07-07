import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'icon-bell',
    imports: [],
    templateUrl: './bell.icon.html',
    styleUrl: './bell.icon.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BellIcon {
    size = input<string>('24');
    customClass = input<string>('text-current');
}
