import { Component, input } from '@angular/core';

@Component({
    selector: 'icon-check-circle',
    standalone: true,
    template: `
        <svg
            [class]="'w-5 h-5 ' + customClass()"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg">
            <path
                d="M9 12.75L11.25 15L15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                stroke-linecap="round"
                stroke-linejoin="round" />
        </svg>
    `,
})
export class CheckCircleIcon {
    customClass = input<string>('');
}
