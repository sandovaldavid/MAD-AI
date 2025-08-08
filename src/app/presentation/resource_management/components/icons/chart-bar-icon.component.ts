import { Component } from '@angular/core';

@Component({
    selector: 'app-chart-bar-icon',
    standalone: true,
    template: `
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="18" width="4" height="8" rx="2" fill="currentColor" />
            <rect x="14" y="12" width="4" height="14" rx="2" fill="currentColor" />
            <rect x="22" y="6" width="4" height="20" rx="2" fill="currentColor" />
        </svg>
    `,
    styles: [':host { display: inline-block; color: #3b82f6; }']
})
export class ChartBarIconComponent {}
