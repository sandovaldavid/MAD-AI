import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'icon-arrow-left',
    template: `
        <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m12 19-7-7 7-7"/>
            <path d="M19 12H5"/>
        </svg>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArrowLeftIcon {}
