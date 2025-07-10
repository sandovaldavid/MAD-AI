import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
    selector: 'icon-id-badge',
    templateUrl: './id-badge.icon.html',
    styleUrl: './id-badge.icon.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IdBadgeIcon {
    size = input<string>('24');
    customClass = input<string>('');
}
