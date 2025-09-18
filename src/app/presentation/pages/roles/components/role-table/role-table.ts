import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Shared UI Components
import { Button } from '@presentation/shared/ui/button/button';
import { Icon } from '@presentation/shared/ui/icon/icon';
import { BulkActionsToolbar } from '@presentation/shared/ui/bulk-actions-toolbar/bulk-actions-toolbar';

// Import types from BulkActionsToolbar
import type {
  BulkAction,
  ExportFormat,
  SelectionStats,
} from '@presentation/shared/ui/bulk-actions-toolbar/bulk-actions-toolbar';

// Models and Types
import { RoleModel } from '../../models/role.model';

// Import AccessLevelIndicator component and its exported types (unified imports)
import {
  AccessLevelIndicator,
  type RoleAccessLevelInfo,
  ROLE_ACCESS_LEVEL_CONFIG,
  getRoleAccessLevelInfo,
} from '../access-level-indicator';

// Facade
import { RolesFacade } from '@application/facades/role';

/**
 * Available bulk actions for role management
 */
export interface BulkActionOption {
  id: string;
  label: string;
  icon: string;
  description: string;
  variant: 'default' | 'danger' | 'warning' | 'success';
  requiresConfirmation: boolean;
  minimumSelection: number;
  maximumSelection?: number;
}

/**
 * Export format options for role data
 */
export interface ExportFormatOption {
  id: string;
  label: string;
  icon: string;
  extension: string;
  mimeType: string;
}

/**
 * Sort configuration interface
 */
interface SortConfig {
  column: 'name' | 'accessLevel' | 'userCount' | 'isActive';
  direction: 'asc' | 'desc';
}

/**
 * Filter configuration interface
 */
interface FilterConfig {
  search: string;
  accessLevel: number | null;
  isActive: boolean | null;
}

/**
 * RoleTable Component
 *
 * Advanced table component for displaying roles with:
 * - Sorting capabilities
 * - Advanced filtering (search, access level, status)
 * - Inline actions (edit, delete, toggle status)
 * - Multiple selection for bulk operations
 * - Responsive design with skeleton loading
 * - Integration with RolesFacade
 *
 * @example
 * ```html
 * <app-role-table
 *   [roles]="roles"
 *   [loading]="loading"
 *   (editRole)="onEditRole($event)"
 *   (deleteRole)="onDeleteRole($event)"
 *   (toggleStatus)="onToggleStatus($event)"
 *   (bulkAction)="onBulkAction($event)">
 * </app-role-table>
 * ```
 */
@Component({
  selector: 'app-role-table',
  standalone: true,
  imports: [CommonModule, FormsModule, Button, Icon, BulkActionsToolbar, AccessLevelIndicator],
  templateUrl: './role-table.html',
  styleUrl: './role-table.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleTable implements OnInit {
  private rolesFacade = inject(RolesFacade);

  // ============================================================================
  // Inputs
  // ============================================================================

  /** List of roles to display */
  roles = input<RoleModel[]>([]);

  /** Loading state */
  loading = input<boolean>(false);

  /** Enable bulk operations */
  enableBulkActions = input<boolean>(true);

  /** Enable pagination */
  enablePagination = input<boolean>(true);

  /** Items per page */
  pageSize = input<number>(10);

  // ============================================================================
  // Outputs
  // ============================================================================

  /** Emitted when user wants to view role details */
  viewRole = output<number>();

  /** Emitted when user wants to edit a role */
  editRole = output<number>();

  /** Emitted when user wants to delete a role */
  deleteRole = output<number>();

  /** Emitted when user toggles role status */
  toggleStatus = output<{ id: number; isActive: boolean }>();

  /** Emitted when bulk action is triggered */
  bulkAction = output<{ action: string; roleIds: number[]; metadata?: any }>();

  /** Emitted when export action is triggered */
  exportRoles = output<{ format: string; roleIds: number[]; includeMetadata: boolean }>();

  /** Emitted when role cloning is requested */
  cloneRoles = output<{ sourceRoleIds: number[]; targetData: any }>();

  /** Emitted when role assignment to users is requested */
  assignRolesToUsers = output<{ roleIds: number[]; assignmentData: any }>();

  // ============================================================================
  // Internal State
  // ============================================================================

  /** Current sort configuration */
  private _sortConfig = signal<SortConfig>({
    column: 'name',
    direction: 'asc',
  });

  /** Current filter configuration */
  private _filterConfig = signal<FilterConfig>({
    search: '',
    accessLevel: null,
    isActive: null,
  });

  /** Selected role IDs for bulk operations */
  private _selectedRoles = signal<Set<number>>(new Set());

  /** Current page number */
  private _currentPage = signal<number>(1);

  /** Show advanced bulk actions panel */
  private _showAdvancedActions = signal<boolean>(false);

  /** Currently executing bulk action */
  private _executingBulkAction = signal<string | null>(null);

  /** Export format selection */
  private _selectedExportFormat = signal<string>('json');

  // ============================================================================
  // Computed Properties
  // ============================================================================

  /** Current sort configuration */
  readonly sortConfig = computed(() => this._sortConfig());

  /** Current filter configuration */
  readonly filterConfig = computed(() => this._filterConfig());

  /** Selected role IDs */
  readonly selectedRoles = computed(() => this._selectedRoles());

  /** Current page */
  readonly currentPage = computed(() => this._currentPage());

  /** Filtered and sorted roles */
  readonly filteredRoles = computed(() => {
    let filteredRoles = this.applyFilters(this.roles());
    filteredRoles = this.applySorting(filteredRoles);
    return filteredRoles;
  });

  /** Paginated roles for display */
  readonly displayedRoles = computed(() => {
    const filtered = this.filteredRoles();
    if (!this.enablePagination()) return filtered;

    const startIndex = (this.currentPage() - 1) * this.pageSize();
    const endIndex = startIndex + this.pageSize();
    return filtered.slice(startIndex, endIndex);
  });

  /** Total number of filtered roles */
  readonly totalRoles = computed(() => this.filteredRoles().length);

  /** Total number of pages */
  readonly totalPages = computed(() => {
    if (!this.enablePagination()) return 1;
    return Math.ceil(this.totalRoles() / this.pageSize());
  });

  /** Whether all visible roles are selected */
  readonly allSelected = computed(() => {
    const displayed = this.displayedRoles();
    const selected = this.selectedRoles();
    return displayed.length > 0 && displayed.every((role) => selected.has(role.id));
  });

  /** Whether some (but not all) visible roles are selected */
  readonly someSelected = computed(() => {
    const displayed = this.displayedRoles();
    const selected = this.selectedRoles();
    return displayed.some((role) => selected.has(role.id)) && !this.allSelected();
  });

  /** Number of selected roles */
  readonly selectedCount = computed(() => this.selectedRoles().size);

  /** Show advanced actions panel */
  readonly showAdvancedActions = computed(() => this._showAdvancedActions());

  /** Currently executing bulk action */
  readonly executingBulkAction = computed(() => this._executingBulkAction());

  /** Selected export format */
  readonly selectedExportFormat = computed(() => this._selectedExportFormat());

  /** Available bulk actions based on current selection */
  readonly availableBulkActions = computed(() => {
    const selectedCount = this.selectedCount();
    return this.getBulkActionOptions().filter(
      (action) =>
        selectedCount >= action.minimumSelection &&
        (!action.maximumSelection || selectedCount <= action.maximumSelection)
    );
  });

  /** Available export formats */
  readonly exportFormats = computed(() => this.getExportFormatOptions());

  /** Whether any advanced action is available */
  readonly hasAdvancedActions = computed(() => {
    return this.selectedCount() > 0 && this.availableBulkActions().length > 0;
  });

  /** Selected roles as array for calculations */
  readonly selectedRolesArray = computed(() => {
    const allRoles = this.roles();
    const selectedIds = this.selectedRoles();
    return allRoles.filter((role) => selectedIds.has(role.id));
  });

  /** Statistics for selected roles */
  readonly selectedStats = computed(() => {
    const selectedRoles = this.selectedRolesArray();
    return {
      total: selectedRoles.length,
      active: selectedRoles.filter((r) => r.isActive).length,
      totalUsers: selectedRoles.reduce((sum, r) => sum + (r.userCount || 0), 0),
      avgLevel:
        selectedRoles.length > 0
          ? Math.round(
              selectedRoles.reduce((sum, r) => sum + r.accessLevel, 0) / selectedRoles.length
            )
          : 0,
    };
  });

  /** Bulk actions configuration for the toolbar */
  readonly bulkActions = computed((): BulkAction[] => {
    return this.getBulkActionOptions().map((action) => ({
      id: action.id,
      label: action.label,
      icon: action.icon,
      variant:
        action.variant === 'danger'
          ? 'danger'
          : action.variant === 'warning'
            ? 'secondary'
            : 'primary',
      shortcut: this.getShortcutForAction(action.id),
      requiresConfirmation: action.requiresConfirmation,
      minSelection: action.minimumSelection,
      maxSelection: action.maximumSelection,
    }));
  });

  /** Export formats configuration for the toolbar */
  readonly toolbarExportFormats = computed((): ExportFormat[] => {
    return this.getExportFormatOptions().map((format) => ({
      id: format.id,
      label: format.label,
      icon: format.icon,
      extension: format.extension,
      mimeType: format.mimeType,
    }));
  });

  /** Selection statistics for the toolbar */
  readonly toolbarSelectionStats = computed((): SelectionStats => {
    const stats = this.selectedStats();
    return {
      total: stats.total,
      active: stats.active,
      inactive: stats.total - stats.active,
      totalUsers: stats.totalUsers,
      avgLevel: stats.avgLevel,
    };
  });

  // ============================================================================
  // UI State Computed Properties (for template logic simplification)
  // ============================================================================

  /** Whether to show clear filters button */
  readonly showClearFilters = computed(() => {
    const filters = this.filterConfig();
    return filters.search || filters.accessLevel !== null || filters.isActive !== null;
  });

  /** Whether to show bulk actions section */
  readonly showBulkActions = computed(() => {
    return this.enableBulkActions() && this.selectedCount() > 0;
  });

  /** Whether to show bulk selection checkbox */
  readonly showBulkCheckbox = computed(() => {
    return this.enableBulkActions();
  });

  /** Table column span for empty states */
  readonly tableColspan = computed(() => {
    return this.enableBulkActions() ? 6 : 5;
  });

  /** Whether to show pagination */
  readonly showPagination = computed(() => {
    return this.enablePagination() && this.totalPages() > 1;
  });

  /** Whether this is an empty search result (vs no data at all) */
  readonly isEmptySearchResult = computed(() => {
    return this.totalRoles() === 0 && this.showClearFilters();
  });

  /** Whether to show floating bulk actions toolbar */
  readonly showFloatingToolbar = computed(() => {
    return this.enableBulkActions() && this.selectedCount() > 0;
  });

  /** Current page info for pagination display */
  readonly paginationInfo = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize() + 1;
    const end = Math.min(this.currentPage() * this.pageSize(), this.totalRoles());
    const total = this.totalRoles();
    return { start, end, total };
  });

  /** Quick actions for toolbar (first 3) */
  readonly quickActions = computed(() => {
    return this.bulkActions().slice(0, 3);
  });

  /** Advanced actions for toolbar (remaining) */
  readonly advancedActions = computed(() => {
    return this.bulkActions().slice(3);
  });

  /** Whether previous page button should be disabled */
  readonly isPreviousDisabled = computed(() => {
    return this.currentPage() === 1;
  });

  /** Whether next page button should be disabled */
  readonly isNextDisabled = computed(() => {
    return this.currentPage() === this.totalPages();
  });

  /** Page numbers array for pagination */
  readonly pageNumbers = computed(() => {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  });

  // ============================================================================
  // Lifecycle
  // ============================================================================

  ngOnInit() {
    // Initialize component
  }

  // ============================================================================
  // Sorting Methods
  // ============================================================================

  /**
   * Sort roles by the specified column
   */
  sortBy(column: SortConfig['column']) {
    const current = this._sortConfig();
    const direction = current.column === column && current.direction === 'asc' ? 'desc' : 'asc';

    this._sortConfig.set({ column, direction });
  }

  /**
   * Get sort icon for column
   */
  getSortIcon(column: SortConfig['column']): string {
    const current = this._sortConfig();
    if (current.column !== column) return 'chevron-up-down';
    return current.direction === 'asc' ? 'chevron-up' : 'chevron-down';
  }

  /**
   * Check if column is currently sorted
   */
  isSorted(column: SortConfig['column']): boolean {
    return this._sortConfig().column === column;
  }

  // ============================================================================
  // Filtering Methods
  // ============================================================================

  /**
   * Update search filter
   */
  updateSearchFilter(search: string) {
    this._filterConfig.update((config) => ({ ...config, search }));
    this._currentPage.set(1); // Reset to first page
  }

  /**
   * Update access level filter
   */
  updateAccessLevelFilter(accessLevel: number | null) {
    this._filterConfig.update((config) => ({ ...config, accessLevel }));
    this._currentPage.set(1);
  }

  /**
   * Update status filter
   */
  updateStatusFilter(isActive: boolean | null) {
    this._filterConfig.update((config) => ({ ...config, isActive }));
    this._currentPage.set(1);
  }

  /**
   * Clear all filters
   */
  clearFilters() {
    this._filterConfig.set({
      search: '',
      accessLevel: null,
      isActive: null,
    });
    this._currentPage.set(1);
  }

  // ============================================================================
  // Selection Methods
  // ============================================================================

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
        displayed.forEach((role) => newSelected.delete(role.id));
      } else {
        // Select all displayed roles
        displayed.forEach((role) => newSelected.add(role.id));
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

  // ============================================================================
  // Pagination Methods
  // ============================================================================

  /**
   * Go to specific page
   */
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this._currentPage.set(page);
    }
  }

  /**
   * Go to previous page
   */
  previousPage() {
    const current = this.currentPage();
    if (current > 1) {
      this._currentPage.set(current - 1);
    }
  }

  /**
   * Go to next page
   */
  nextPage() {
    const current = this.currentPage();
    const total = this.totalPages();
    if (current < total) {
      this._currentPage.set(current + 1);
    }
  }

  // ============================================================================
  // Action Methods
  // ============================================================================

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
  onToggleStatus(role: RoleModel) {
    this.toggleStatus.emit({ id: role.id, isActive: !role.isActive });
  }

  /**
   * Handle bulk action
   */
  onBulkAction(action: string) {
    const selectedIds = Array.from(this.selectedRoles());
    if (selectedIds.length > 0) {
      this._executingBulkAction.set(action);

      setTimeout(() => {
        this.bulkAction.emit({ action, roleIds: selectedIds });
        this._executingBulkAction.set(null);
      }, 100);
    }
  }

  /**
   * Handle advanced bulk action with metadata
   */
  onAdvancedBulkAction(action: string, metadata?: any) {
    const selectedIds = Array.from(this.selectedRoles());
    if (selectedIds.length > 0) {
      this._executingBulkAction.set(action);

      this.bulkAction.emit({ action, roleIds: selectedIds, metadata });

      setTimeout(() => {
        this._executingBulkAction.set(null);
      }, 1000);
    }
  }

  /**
   * Handle export action
   */
  onExportRoles(format?: string, includeMetadata = true) {
    const selectedIds = Array.from(this.selectedRoles());
    const exportFormat = format || this.selectedExportFormat();

    if (selectedIds.length > 0) {
      this.exportRoles.emit({
        format: exportFormat,
        roleIds: selectedIds,
        includeMetadata,
      });
    }
  }

  /**
   * Handle clone roles action
   */
  onCloneRoles(targetData: any) {
    const selectedIds = Array.from(this.selectedRoles());
    if (selectedIds.length > 0) {
      this.cloneRoles.emit({
        sourceRoleIds: selectedIds,
        targetData,
      });
    }
  }

  /**
   * Handle assign roles to users action
   */
  onAssignRolesToUsers(assignmentData: any) {
    const selectedIds = Array.from(this.selectedRoles());
    if (selectedIds.length > 0) {
      this.assignRolesToUsers.emit({
        roleIds: selectedIds,
        assignmentData,
      });
    }
  }

  /**
   * Toggle advanced actions panel
   */
  toggleAdvancedActions() {
    this._showAdvancedActions.update((show) => !show);
  }

  /**
   * Set export format
   */
  setExportFormat(format: string) {
    this._selectedExportFormat.set(format);
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Apply filters to roles list
   */
  private applyFilters(roles: RoleModel[]): RoleModel[] {
    const filters = this.filterConfig();

    return roles.filter((role) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          role.name.toLowerCase().includes(searchLower) ||
          (role.description && role.description.toLowerCase().includes(searchLower));

        if (!matchesSearch) return false;
      }

      // Access level filter
      if (filters.accessLevel !== null && role.accessLevel !== filters.accessLevel) {
        return false;
      }

      // Status filter
      if (filters.isActive !== null && role.isActive !== filters.isActive) {
        return false;
      }

      return true;
    });
  }

  /**
   * Apply sorting to roles list
   */
  private applySorting(roles: RoleModel[]): RoleModel[] {
    const sort = this.sortConfig();

    return [...roles].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sort.column) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'accessLevel':
          aValue = a.accessLevel;
          bValue = b.accessLevel;
          break;
        case 'userCount':
          aValue = a.userCount || 0;
          bValue = b.userCount || 0;
          break;
        case 'isActive':
          aValue = a.isActive ? 1 : 0;
          bValue = b.isActive ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sort.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sort.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  /**
   * Get access level info for a role
   */
  getAccessLevelInfo(accessLevel: number) {
    return getRoleAccessLevelInfo(accessLevel);
  }

  /**
   * Get status badge classes
   */
  getStatusBadgeClasses(isActive: boolean): string {
    return isActive
      ? 'bg-successful-100 text-successful-800 border-successful-200 dark:bg-successful-800 dark:text-successful-200 dark:border-successful-700'
      : 'bg-neutral-100 text-neutral-800 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700';
  }

  /**
   * Get available access levels for filter
   */
  getAccessLevels(): { value: number; label: string }[] {
    return Object.entries(ROLE_ACCESS_LEVEL_CONFIG).map(([level, config]) => ({
      value: parseInt(level),
      label: `Nivel ${level} - ${config.label} (${config.description})`,
    }));
  }

  /**
   * Get available bulk action options
   */
  getBulkActionOptions(): BulkActionOption[] {
    return [
      {
        id: 'activate',
        label: 'Activate',
        icon: 'check-circle',
        description: 'Activate all selected roles',
        variant: 'success',
        requiresConfirmation: false,
        minimumSelection: 1,
      },
      {
        id: 'deactivate',
        label: 'Deactivate',
        icon: 'x-circle',
        description: 'Deactivate all selected roles',
        variant: 'warning',
        requiresConfirmation: true,
        minimumSelection: 1,
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: 'trash',
        description: 'Permanently delete selected roles',
        variant: 'danger',
        requiresConfirmation: true,
        minimumSelection: 1,
      },
      {
        id: 'clone',
        label: 'Clone',
        icon: 'document-duplicate',
        description: 'Create copies of selected roles',
        variant: 'default',
        requiresConfirmation: false,
        minimumSelection: 1,
        maximumSelection: 5,
      },
    ];
  }

  /**
   * Get available export format options
   */
  getExportFormatOptions(): ExportFormatOption[] {
    return [
      {
        id: 'json',
        label: 'JSON',
        icon: 'code',
        extension: 'json',
        mimeType: 'application/json',
      },
      {
        id: 'csv',
        label: 'CSV',
        icon: 'table-cells',
        extension: 'csv',
        mimeType: 'text/csv',
      },
      {
        id: 'excel',
        label: 'Excel',
        icon: 'table-cells',
        extension: 'xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      {
        id: 'pdf',
        label: 'PDF Report',
        icon: 'document',
        extension: 'pdf',
        mimeType: 'application/pdf',
      },
    ];
  }

  /**
   * Get keyboard shortcut for bulk action
   */
  private getShortcutForAction(actionId: string): string | undefined {
    const shortcuts: Record<string, string> = {
      activate: 'Ctrl+A',
      deactivate: 'Ctrl+D',
      delete: 'Ctrl+Del',
      export: 'Ctrl+E',
      clone: 'Ctrl+C',
    };
    return shortcuts[actionId];
  }

  /**
   * Handle bulk action execution from toolbar
   */
  onToolbarBulkAction(action: BulkAction) {
    this.onAdvancedBulkAction(action.id);
  }

  /**
   * Handle export action from toolbar
   */
  onToolbarExport(format: ExportFormat) {
    this.onExportRoles(format.id, true);
  }

  /**
   * Handle quick action from toolbar
   */
  onToolbarQuickAction(event: { actionId: string; selectedCount: number }) {
    this.onAdvancedBulkAction(event.actionId);
  }

  /**
   * Handle advanced action from toolbar
   */
  onToolbarAdvancedAction(event: { actionId: string; selectedCount: number }) {
    this.onAdvancedBulkAction(event.actionId);
  }

  /**
   * Handle export request from toolbar
   */
  onToolbarExportRequested(event: { format: string; selectedCount: number }) {
    this.onExportRoles(event.format, true);
  }
}
