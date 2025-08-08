import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'icon-email',
    imports: [],
    templateUrl: './email.icon.html',
    styleUrl: './email.icon.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailIcon {
    size = input<string>('24');
    customClass = input<string>('text-current');
}
