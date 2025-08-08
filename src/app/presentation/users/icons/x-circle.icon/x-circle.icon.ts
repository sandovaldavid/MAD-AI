import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
    selector: 'icon-x-circle',
    templateUrl: './x-circle.icon.html',
    styleUrl: './x-circle.icon.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class XCircleIcon {
    size = input<string>('24');
    customClass = input<string>('');
}
