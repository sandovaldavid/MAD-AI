import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'icon-info',
    imports: [],
    templateUrl: './info.icon.html',
    styleUrl: './info.icon.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoIcon {
    size = input<string>('24');
    customClass = input<string>('text-current');
}
