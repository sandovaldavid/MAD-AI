import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'icon-plus',
    template: `
        <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14"/>
            <path d="m12 5 0 14"/>
        </svg>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlusIcon {}
