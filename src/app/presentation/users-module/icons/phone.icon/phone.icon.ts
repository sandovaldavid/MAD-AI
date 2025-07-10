import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'icon-phone',
    imports: [],
    templateUrl: './phone.icon.html',
    styleUrl: './phone.icon.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhoneIcon {
    size = input<string>('24');
    customClass = input<string>('text-current');
}
