import { Component } from '@angular/core';

@Component({
    selector: 'icon-calendar',
    standalone: true,
    template: `
        <svg
            class="w-5 h-5 text-primary-500 dark:text-primary-200"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            viewBox="0 0 24 24">
            <rect
                x="3"
                y="5"
                width="18"
                height="16"
                rx="2"
                class="fill-primary-100 dark:fill-primary-900" />
            <path d="M8 3v4M16 3v4M3 9h18" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
    `,
})
export class IconCalendar {}
