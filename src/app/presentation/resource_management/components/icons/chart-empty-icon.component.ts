import { Component } from '@angular/core';

@Component({
    selector: 'app-chart-empty-icon',
    standalone: true,
    template: `
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="24" width="4" height="2" rx="1" fill="#d1d5db" />
            <rect x="14" y="24" width="4" height="2" rx="1" fill="#d1d5db" />
            <rect x="22" y="24" width="4" height="2" rx="1" fill="#d1d5db" />
            <rect x="6" y="18" width="4" height="2" rx="1" fill="#d1d5db" />
            <rect x="14" y="12" width="4" height="2" rx="1" fill="#d1d5db" />
            <rect x="22" y="6" width="4" height="2" rx="1" fill="#d1d5db" />
        </svg>
    `,
    styles: [':host { display: inline-block; color: #d1d5db; }']
})
export class ChartEmptyIconComponent {}
