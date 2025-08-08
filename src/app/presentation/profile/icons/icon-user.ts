import { Component } from '@angular/core';

@Component({
    selector: 'icon-user',
    standalone: true,
    template: `
        <svg
            class="w-5 h-5 text-primary-500 dark:text-primary-200"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            viewBox="0 0 24 24">
            <circle cx="12" cy="8" r="4" class="fill-primary-100 dark:fill-primary-900" />
            <path
                d="M4 20c0-2.21 3.582-4 8-4s8 1.79 8 4"
                stroke-linecap="round"
                stroke-linejoin="round" />
        </svg>
    `,
})
export class IconUser {}
