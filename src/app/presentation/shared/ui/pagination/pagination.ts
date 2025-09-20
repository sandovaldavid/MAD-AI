/**
 * Pagination Component - Dumb Component
 *
 * @description
 * Pure UI component that provides pagination controls for data tables and lists.
 * Handles page navigation, page size selection, and displays pagination information.
 * Completely reusable across different contexts.
 *
 * @responsibilities
 * - Display pagination controls (previous, next, page numbers)
 * - Show current page and total pages information
 * - Emit page change events
 * - Handle page size selection
 * - Provide accessible pagination interface
 *
 * @architecture
 * Dumb Component following MAD-AI patterns:
 * - No dependency injection or business logic
 * - All data received through @Input properties
 * - All interactions communicated through @Output events
 * - Pure presentation logic only
 * - Fully reusable across different contexts
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Presentation
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// Shared UI Components
import { Button } from '../button/button';
import { Icon } from '../icon/icon';

/**
 * Pagination configuration interface
 */
export interface PaginationConfig {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly totalItems: number;
  readonly pageSize: number;
  readonly pageSizeOptions: number[];
  readonly showPageSizeSelector: boolean;
  readonly showPageInfo: boolean;
  readonly maxVisiblePages: number;
}

/**
 * Page change event data
 */
export interface PageChangeEvent {
  readonly page: number;
  readonly pageSize: number;
}

/**
 * Page size change event data
 */
export interface PageSizeChangeEvent {
  readonly pageSize: number;
  readonly page: number; // Reset to page 1 when page size changes
}

/**
 * Default pagination configuration
 */
export const DEFAULT_PAGINATION_CONFIG: Partial<PaginationConfig> = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  pageSize: 10,
  pageSizeOptions: [5, 10, 25, 50, 100],
  showPageSizeSelector: true,
  showPageInfo: true,
  maxVisiblePages: 7,
};

@Component({
  selector: 'ui-pagination',
  standalone: true,
  imports: [CommonModule, Button, Icon],
  templateUrl: './pagination.html',
  styleUrl: './pagination.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Pagination {
  // ============================================================================
  // Input Properties
  // ============================================================================

  /**
   * Current page number (1-based)
   */
  @Input() currentPage = 1;

  /**
   * Total number of pages
   */
  @Input() totalPages = 1;

  /**
   * Total number of items
   */
  @Input() totalItems = 0;

  /**
   * Number of items per page
   */
  @Input() pageSize = 10;

  /**
   * Available page size options
   */
  @Input() pageSizeOptions = [5, 10, 25, 50, 100];

  /**
   * Show page size selector dropdown
   */
  @Input() showPageSizeSelector = true;

  /**
   * Show page information text
   */
  @Input() showPageInfo = true;

  /**
   * Maximum number of visible page buttons
   */
  @Input() maxVisiblePages = 7;

  /**
   * Disable all pagination controls
   */
  @Input() disabled = false;

  /**
   * Loading state
   */
  @Input() loading = false;

  // ============================================================================
  // Output Events
  // ============================================================================

  /**
   * Emitted when page changes
   */
  @Output() pageChange = new EventEmitter<PageChangeEvent>();

  /**
   * Emitted when page size changes
   */
  @Output() pageSizeChange = new EventEmitter<PageSizeChangeEvent>();

  // ============================================================================
  // Computed Properties
  // ============================================================================

  /**
   * Calculate visible page numbers
   */
  readonly visiblePages = computed(() => {
    const current = this.currentPage;
    const total = this.totalPages;
    const maxVisible = this.maxVisiblePages;

    if (total <= maxVisible) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const halfVisible = Math.floor(maxVisible / 2);
    let start = Math.max(1, current - halfVisible);
    let end = Math.min(total, start + maxVisible - 1);

    // Adjust start if we're near the end
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  /**
   * Check if we should show first page button
   */
  readonly showFirstPage = computed(() => {
    const visiblePages = this.visiblePages();
    return visiblePages.length > 0 && visiblePages[0] > 1;
  });

  /**
   * Check if we should show last page button
   */
  readonly showLastPage = computed(() => {
    const visiblePages = this.visiblePages();
    return visiblePages.length > 0 && visiblePages[visiblePages.length - 1] < this.totalPages;
  });

  /**
   * Check if previous page is available
   */
  readonly canGoPrevious = computed(() => this.currentPage > 1);

  /**
   * Check if next page is available
   */
  readonly canGoNext = computed(() => this.currentPage < this.totalPages);

  /**
   * Calculate start item number for current page
   */
  readonly startItem = computed(() => {
    if (this.totalItems === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  });

  /**
   * Calculate end item number for current page
   */
  readonly endItem = computed(() => {
    const end = this.currentPage * this.pageSize;
    return Math.min(end, this.totalItems);
  });

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handle page navigation
   */
  onPageChange(page: number): void {
    if (
      page === this.currentPage ||
      page < 1 ||
      page > this.totalPages ||
      this.disabled ||
      this.loading
    ) {
      return;
    }

    this.pageChange.emit({
      page,
      pageSize: this.pageSize,
    });
  }

  /**
   * Go to previous page
   */
  onPreviousPage(): void {
    this.onPageChange(this.currentPage - 1);
  }

  /**
   * Go to next page
   */
  onNextPage(): void {
    this.onPageChange(this.currentPage + 1);
  }

  /**
   * Go to first page
   */
  onFirstPage(): void {
    this.onPageChange(1);
  }

  /**
   * Go to last page
   */
  onLastPage(): void {
    this.onPageChange(this.totalPages);
  }

  /**
   * Handle page size change
   */
  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newPageSize = parseInt(target.value, 10);

    if (newPageSize === this.pageSize || this.disabled || this.loading) {
      return;
    }

    this.pageSizeChange.emit({
      pageSize: newPageSize,
      page: 1, // Reset to first page when page size changes
    });
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Check if page is current page
   */
  isCurrentPage(page: number): boolean {
    return page === this.currentPage;
  }

  /**
   * Get page button ARIA label
   */
  getPageAriaLabel(page: number): string {
    return this.isCurrentPage(page) ? `Page ${page}, current page` : `Go to page ${page}`;
  }
}
