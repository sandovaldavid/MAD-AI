import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'icon-edit',
    template: `
        <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
        </svg>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditIcon {}
