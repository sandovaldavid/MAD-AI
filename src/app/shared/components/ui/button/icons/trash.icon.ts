import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'icon-trash',
    template: `
        <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18"/>
            <path d="m19 6-1 12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="m8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <line x1="10" x2="10" y1="11" y2="17"/>
            <line x1="14" x2="14" y1="11" y2="17"/>
        </svg>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrashIcon {}
