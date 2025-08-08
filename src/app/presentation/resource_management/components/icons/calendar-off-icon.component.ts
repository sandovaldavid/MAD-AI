import { Component } from '@angular/core';

@Component({
    selector: 'app-calendar-off-icon',
    standalone: true,
    template: `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round">
            <path d="M4.7 4.7A1 1 0 0 1 5.6 4H18a2 2 0 0 1 2 2v11.4a1 1 0 0 1-.7.9" />
            <path d="M16 2v4" />
            <path d="M8 2v4" />
            <path d="M3 10h17" />
            <path d="m2 2 20 20" />
        </svg>
    `,
    styles: [':host { display: block; }'],
})
export class CalendarOffIconComponent {}
