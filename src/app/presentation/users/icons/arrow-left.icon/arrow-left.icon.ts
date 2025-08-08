import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
    selector: 'icon-arrow-left',
    templateUrl: './arrow-left.icon.html',
    styleUrl: './arrow-left.icon.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArrowLeftIcon {
    size = input<string>('24');
    customClass = input<string>('');
}
