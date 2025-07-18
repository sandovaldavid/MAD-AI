import { Component, input, signal } from '@angular/core';

@Component({
    selector: 'icon-status',
    standalone: true,
    template: `
        @if (active()) {
        <svg
            class="w-5 h-5 text-green-500 dark:text-green-400"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" class="fill-green-100 dark:fill-green-900" />
            <path d="M9 12l2 2 4-4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        } @else {
        <svg
            class="w-5 h-5 text-red-500 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" class="fill-red-100 dark:fill-red-900" />
            <path d="M15 9l-6 6M9 9l6 6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        }
    `,
})
export class IconStatus {
    active = input.required<boolean>();
}
