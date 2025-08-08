import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'icon-toggle',
    imports: [],
    templateUrl: './toggle.icon.html',
    styleUrl: './toggle.icon.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleIcon {
    size = input<string>('24');
    customClass = input<string>('text-current');
    isActive = input<boolean>(false);
}
