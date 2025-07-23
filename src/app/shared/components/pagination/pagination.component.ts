import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-pagination',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './pagination.component.html',
    styleUrls: ['./pagination.component.css'],
})
export class PaginationComponent {
    currentPage = input.required<number>();
    totalPages = input.required<number>();
    totalItems = input.required<number>();

    pageChange = output<number>();

    pages = computed<(number | string)[]>(() => {
        const total = this.totalPages();
        const current = this.currentPage();
        const sideWidth = 1; // Pages to show on each side of the current page
        const range: (number | string)[] = [];

        if (total <= 5) {
            return Array.from({ length: total }, (_, i) => i + 1);
        }

        // Always show first page
        range.push(1);

        // Ellipsis after first page
        if (current > sideWidth + 2) {
            range.push('...');
        }

        // Pages around current
        for (let i = Math.max(2, current - sideWidth); i <= Math.min(total - 1, current + sideWidth); i++) {
            if (!range.includes(i)) {
                range.push(i);
            }
        }

        // Ellipsis before last page
        if (current < total - sideWidth - 1) {
            range.push('...');
        }

        // Always show last page
        if (!range.includes(total)) {
            range.push(total);
        }

        return range;
    });

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages() && page !== this.currentPage()) {
            this.pageChange.emit(page);
        }
    }
}
