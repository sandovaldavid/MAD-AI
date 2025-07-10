import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
    selector: 'icon-edit',
    templateUrl: './edit.icon.html',
    styleUrl: './edit.icon.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditIcon {
    size = input<string>('24');
    customClass = input<string>('');
}
