import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'icon-check',
    template: `
        <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6 9 17l-5-5"/>
        </svg>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckIcon {}
