import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'icon-user',
    imports: [],
    templateUrl: './user.icon.html',
    styleUrl: './user.icon.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserIcon {
    size = input<string>('24');
    customClass = input<string>('text-current');
}
