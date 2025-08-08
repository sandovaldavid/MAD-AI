import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'icon-settings',
    imports: [],
    templateUrl: './settings.icon.html',
    styleUrl: './settings.icon.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsIcon {
    size = input<string>('24');
    customClass = input<string>('text-current');
}
