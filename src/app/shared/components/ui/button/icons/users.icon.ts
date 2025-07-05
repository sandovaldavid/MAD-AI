import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'icon-users',
    template: `
        <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="m22 21-2-2 2-2"/>
            <path d="M17 17h5"/>
        </svg>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersIcon {}
