import { Component } from '@angular/core';

@Component({
    selector: 'icon-badge',
    standalone: true,
    template: `
        <svg
            class="w-5 h-5 text-primary-500 dark:text-primary-200"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            viewBox="0 0 24 24">
            <rect
                x="4"
                y="4"
                width="16"
                height="16"
                rx="4"
                class="fill-primary-100 dark:fill-primary-900" />
            <path d="M8 12h8M8 16h8M8 8h8" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
    `,
})
export class IconBadge {}
