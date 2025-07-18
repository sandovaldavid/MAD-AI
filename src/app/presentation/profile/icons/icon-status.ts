import { Component } from '@angular/core';

@Component({
    selector: 'icon-status',
    standalone: true,
    template: `
        <svg
            class="w-5 h-5 text-primary-500 dark:text-primary-200"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" class="fill-primary-100 dark:fill-primary-900" />
            <path d="M9 12l2 2 4-4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
    `,
})
export class IconStatus {}
