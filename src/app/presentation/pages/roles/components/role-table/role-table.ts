import { Component, input, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BulkActionsToolbar } from '@presentation/shared/ui/bulk-actions-toolbar/bulk-actions-toolbar';
import { AccessLevelIndicator } from '../access-level-indicator/access-level-indicator';
import { Icon, Button } from '@presentation/shared/ui';

// Models and Types
import type { RoleTableRowView } from '../../../../models/roles';
import { transformToTableRowView } from '../../../../mappers/roles/role.mapper';
import type { RoleSummary } from '@application/mappers/role.mapper';

import { Pagination } from '@presentation/shared/ui/pagination/pagination';

@Component({
  selector: 'app-role-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BulkActionsToolbar,
    AccessLevelIndicator,
    Icon,
    Button,
    Pagination,
  ],
  templateUrl: './role-table.html',
  styleUrl: './role-table.css',
})
export class RoleTable {
  /** Emitted when the page changes (for parent to update current page) */
  pageChange = output<{ page: number; pageSize: number }>();

  /** Emitted when the page size changes (for parent to update pageSize and reset page) */
  pageSizeChange = output<{ pageSize: number; page: number }>();

  /**
   * Handle page change event from ui-pagination
   */
  onPaginationPageChange(event: { page: number; pageSize: number }): void {
    this.pageChange.emit(event);
  }

  /**
   * Handle page size change event from ui-pagination
   */
  onPaginationPageSizeChange(event: { pageSize: number; page: number }): void {
    this.pageSizeChange.emit(event);
  }
  /** List of roles to display */
  roles = input<RoleSummary[]>([]);

  /** Loading state */
  loading = input<boolean>(false);

  /** Enable bulk operations */
  enableBulkActions = input<boolean>(true);

  /** Enable pagination */
  enablePagination = input<boolean>(true);

  /** Items per page */
  pageSize = input<number>(10);

  /** Current page number (managed by parent) */
  currentPage = input<number>(1);

  /** Current sort column from parent */
  sortBy = input<'name' | 'accessLevel' | 'userCount' | 'isActive'>('name');

  /** Current sort direction from parent */
  sortDirection = input<'asc' | 'desc'>('asc');

  /** Emitted when user wants to view role details */
  viewRole = output<number>();

  /** Emitted when user wants to edit a role */
  editRole = output<number>();

  /** Emitted when user wants to delete a role */
  deleteRole = output<number>();

  /** Emitted when user toggles role status */
  toggleStatus = output<{ id: number; isActive: boolean }>();

  /** Emitted when bulk action is triggered */
  bulkAction = output<{ action: string; roleIds: number[]; metadata?: { format?: string } }>();

  /** Emitted when user requests sorting change */
  sortChange = output<{
    column: 'name' | 'accessLevel' | 'userCount' | 'isActive';
    direction: 'asc' | 'desc';
  }>();

  /** Selected role IDs for bulk operations */
  private _selectedRoles = signal<Set<number>>(new Set());

  /** Selected role IDs */
  readonly selectedRoles = computed(() => this._selectedRoles());

  /** Transform roles to table row views */
  readonly tableRowViews = computed(() => {
    return this.roles().map((role) => transformToTableRowView(role));
  });

  /** Paginated roles for display */
  readonly displayedRoles = computed(() => {
    const roles = this.tableRowViews();
    if (!this.enablePagination()) return roles;

    const startIndex = (this.currentPage() - 1) * this.pageSize();
    const endIndex = startIndex + this.pageSize();
    return roles.slice(startIndex, endIndex);
  });

  /** Total number of roles */
  readonly totalRoles = computed(() => this.tableRowViews().length);

  /** Total number of pages */
  readonly totalPages = computed(() => {
    if (!this.enablePagination()) return 1;
    return Math.ceil(this.totalRoles() / this.pageSize());
  });

  /** Whether all visible roles are selected */
  readonly allSelected = computed(() => {
    const displayed = this.displayedRoles();
    const selected = this.selectedRoles();
    return displayed.length > 0 && displayed.every((role) => selected.has(parseInt(role.id)));
  });

  /** Whether some (but not all) visible roles are selected */
  readonly someSelected = computed(() => {
    const displayed = this.displayedRoles();
    const selected = this.selectedRoles();
    return displayed.some((role) => selected.has(parseInt(role.id))) && !this.allSelected();
  });

  /** Number of selected roles */
  readonly selectedCount = computed(() => this.selectedRoles().size);

  /** Show bulk actions toolbar */
  readonly showBulkActions = computed(() => {
    return this.enableBulkActions() && this.selectedCount() > 0;
  });

  /** Show bulk selection checkbox */
  readonly showBulkCheckbox = computed(() => {
    return this.enableBulkActions();
  });

  /** Table column span for empty states */
  readonly tableColspan = computed(() => {
    return this.enableBulkActions() ? 6 : 5;
  });

  /** Show pagination */
  readonly showPagination = computed(() => {
    return this.enablePagination() && this.totalPages() > 1;
  });

  /** Empty search result check */
  readonly isEmptySearchResult = computed(() => {
    return this.totalRoles() === 0;
  });

  /** Show floating toolbar */
  readonly showFloatingToolbar = computed(() => {
    return this.enableBulkActions() && this.selectedCount() > 0;
  });

  /** Show advanced toggle for export options */
  readonly showToolbarAdvancedToggle = computed(() => {
    return this.toolbarExportFormats().length > 1;
  });

  /** Export formats for export toolbar */
  readonly toolbarExportFormats = computed(() => {
    // Provide available export formats for the toolbar
    // These should match the ExportFormat interface expected by the toolbar
    // id, label, icon, extension, mimeType
    return [
      {
        id: 'pdf',
        label: 'PDF',
        icon: 'document',
        extension: 'pdf',
        mimeType: 'application/pdf',
      },
      {
        id: 'json',
        label: 'JSON',
        icon: 'braces',
        extension: 'json',
        mimeType: 'application/json',
      },
      {
        id: 'csv',
        label: 'CSV',
        icon: 'table',
        extension: 'csv',
        mimeType: 'text/csv',
      },
      {
        id: 'xlsx',
        label: 'Excel',
        icon: 'document',
        extension: 'xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    ];
  });

  /**
   * Handle sort column click - emit sort change to parent
   */
  onSortColumn(column: 'name' | 'accessLevel' | 'userCount' | 'isActive') {
    const currentSort = this.sortBy();
    const currentDirection = this.sortDirection();
    const direction = currentSort === column && currentDirection === 'asc' ? 'desc' : 'asc';
    this.sortChange.emit({ column, direction });
  }

  /**
   * Get sort icon for column
   */
  getSortIcon(column: 'name' | 'accessLevel' | 'userCount' | 'isActive'): string {
    const currentSort = this.sortBy();
    const currentDirection = this.sortDirection();
    if (currentSort !== column) return 'chevron-up-down';
    return currentDirection === 'asc' ? 'chevron-up' : 'chevron-down';
  }

  /**
   * Check if column is currently sorted
   */
  isSorted(column: 'name' | 'accessLevel' | 'userCount' | 'isActive'): boolean {
    return this.sortBy() === column;
  }

  /**
   * Toggle selection of a role
   */
  toggleRoleSelection(roleId: number) {
    this._selectedRoles.update((selected) => {
      const newSelected = new Set(selected);
      if (newSelected.has(roleId)) {
        newSelected.delete(roleId);
      } else {
        newSelected.add(roleId);
      }
      return newSelected;
    });
  }

  /**
   * Toggle selection of all visible roles
   */
  toggleAllSelection() {
    const displayed = this.displayedRoles();
    const allSelected = this.allSelected();

    this._selectedRoles.update((selected) => {
      const newSelected = new Set(selected);

      if (allSelected) {
        // Deselect all displayed roles
        displayed.forEach((role) => newSelected.delete(parseInt(role.id)));
      } else {
        // Select all displayed roles
        displayed.forEach((role) => newSelected.add(parseInt(role.id)));
      }

      return newSelected;
    });
  }

  /**
   * Clear all selections
   */
  clearSelection() {
    this._selectedRoles.set(new Set());
  }

  /**
   * Check if a role is selected
   */
  isRoleSelected(roleId: number): boolean {
    return this.selectedRoles().has(roleId);
  }

  /**
   * Handle view role action
   */
  onViewRole(roleId: number) {
    this.viewRole.emit(roleId);
  }

  /**
   * Handle edit role action
   */
  onEditRole(roleId: number) {
    this.editRole.emit(roleId);
  }

  /**
   * Handle delete role action
   */
  onDeleteRole(roleId: number) {
    this.deleteRole.emit(roleId);
  }

  /**
   * Handle toggle status action
   */
  onToggleStatus(role: RoleTableRowView) {
    this.toggleStatus.emit({
      id: parseInt(role.id),
      isActive: role.statusBadge.label === 'Activo',
    });
  }

  /**
   * Handle bulk action
   */
  onBulkAction(action: string) {
    const selectedIds = Array.from(this.selectedRoles());
    if (selectedIds.length > 0) {
      this.bulkAction.emit({ action, roleIds: selectedIds });
    }
  }

  /**
   * Parse string ID to number for role selection
   */
  parseRoleId(roleId: string): number {
    return parseInt(roleId, 10);
  }

  /**
   * Get role access level for the indicator
   */
  getRoleAccessLevel(role: RoleTableRowView): number {
    return role.accessLevel;
  }

  /**
   * Handle toolbar export request
   */
  onToolbarExportRequested(event: { format: string; selectedCount: number }) {
    const selectedIds = Array.from(this.selectedRoles());
    if (selectedIds.length > 0) {
      this.bulkAction.emit({
        action: 'export',
        roleIds: selectedIds,
        metadata: { format: event.format },
      });
    }
  }
}
