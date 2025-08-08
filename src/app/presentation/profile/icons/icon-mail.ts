import { Component } from '@angular/core';

@Component({
    selector: 'icon-mail',
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
                height="14"
                rx="2"
                class="fill-primary-100 dark:fill-primary-900" />
            <path d="M3 7l9 6 9-6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
    `,
})
export class IconMail {}
