import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
    selector: 'icon-check-circle',
    templateUrl: './check-circle.icon.html',
    styleUrl: './check-circle.icon.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckCircleIcon {
    size = input<string>('24');
    customClass = input<string>('');
}
