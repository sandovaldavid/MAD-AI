import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'icon-eye',
    template: `
        <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
        </svg>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EyeIcon {}
