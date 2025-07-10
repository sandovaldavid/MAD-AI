import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'icon-shield',
    imports: [],
    templateUrl: './shield.icon.html',
    styleUrl: './shield.icon.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShieldIcon {
    size = input<string>('24');
    customClass = input<string>('text-current');
}
