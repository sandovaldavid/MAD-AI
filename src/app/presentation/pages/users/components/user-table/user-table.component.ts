/**
 * User Table Component - Dumb Component
 *
 * @description
 * Pure presentation component that displays users in a table format with
 * sorting, selection, and action capabilities. Receives all data through
 * inputs and communicates user interactions through output events.
 *
 * @responsibilities
 * - Display users in a tabular format
 * - Handle table interactions (sorting, row selection)
 * - Emit user action events (view, edit, delete/deactivate, etc.)
 * - Provide responsive table design
 * - Support loading and empty states
 * - Handle bulk selection operations
 *
 * @architecture
 * Dumb Component following MAD-AI patterns:
 * - No dependency injection or business logic
 * - All data received through @Input properties
 * - All interactions communicated through @Output events
 * - Pure presentation logic only
 * - No direct service calls or state management
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
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// Shared UI Components
import { Button } from '@presentation/shared/ui/button/button';
import { Icon } from '@presentation/shared/ui/icon/icon';

// Local Imports
import { UserDisplayData, SortConfig, UserActionConfig } from '../../types/user-ui.types';
import {
  RoleAccessLevelInfo,
  getRoleAccessLevelInfo,
  getRoleAccessLevelIcon,
} from '../../../roles/types/role-colors.type';

/**
 * User action event data
 */
export interface UserActionEvent {
  readonly action: 'view' | 'edit' | 'delete' | 'activate' | 'deactivate' | 'resetPassword';
  readonly user: UserDisplayData;
}

/**
 * User selection event data
 */
export interface UserSelectionEvent {
  readonly selectedUsers: UserDisplayData[];
  readonly isAllSelected: boolean;
}

/**
 * Sort change event data
 */
export interface SortChangeEvent {
  readonly field: keyof UserDisplayData;
  readonly direction: 'asc' | 'desc';
}

/**
 * User Table Component
 *
 * Displays users in a responsive table with sorting, selection,
 * and contextual actions. Handles all table interactions and
 * communicates events to parent components.
 */
@Component({
  selector: 'app-user-table',
  standalone: true,
  imports: [CommonModule, Button, Icon],
  templateUrl: './user-table.component.html',
  styleUrl: './user-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserTableComponent implements OnInit, OnChanges {
  // ============================================================================
  // Input Properties
  // ============================================================================

  /**
   * List of users to display
   */
  @Input({ required: true }) users: UserDisplayData[] = [];

  /**
   * Internal signal for users to enable reactivity
   */
  readonly _users = signal<UserDisplayData[]>([]);

  ngOnInit(): void {
    // Initialize internal signal with current users input
    this._users.set(this.users);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['users']) {
      // Update internal signal
      this._users.set(this.users);
    }
  }

  /**
   * Loading state for the table
   */
  @Input() loading = false;

  /**
   * Current sort configuration
   */
  @Input() sortConfig: SortConfig | null = null;

  /**
   * Available actions for each user
   */
  @Input() userActions: UserActionConfig = {
    canView: true,
    canEdit: true,
    canDelete: false,
    canActivate: false,
    canDeactivate: false,
    canResetPassword: false,
  };

  /**
   * Whether bulk selection is enabled
   */
  @Input() enableSelection = false;

  /**
   * Currently selected users
   */
  @Input() selectedUsers: UserDisplayData[] = [];

  /**
   * Show user avatars in table
   */
  @Input() showAvatars = true;

  /**
   * Compact table mode
   */
  @Input() compact = false;

  /**
   * Table actions (for bulk operations)
   */
  @Input() tableActions: string[] = [];

  // ============================================================================
  // Output Events
  // ============================================================================

  /**
   * Emitted when a user action is triggered
   */
  @Output() userAction = new EventEmitter<UserActionEvent>();

  /**
   * Emitted when user selection changes
   */
  @Output() selectionChange = new EventEmitter<UserSelectionEvent>();

  /**
   * Emitted when sort configuration changes
   */
  @Output() sortChange = new EventEmitter<SortChangeEvent>();

  /**
   * Emitted when a bulk action is triggered
   */
  @Output() bulkAction = new EventEmitter<{ action: string; users: UserDisplayData[] }>();

  // ============================================================================
  // Component State
  // ============================================================================

  /**
   * Internal selected users state
   */
  private readonly _internalSelection = signal<Set<number>>(new Set());

  // Role colors are handled by the role access level system

  // ============================================================================
  // Computed Properties
  // ============================================================================

  /**
   * Check if all users are selected
   */
  readonly isAllSelected = computed(() => {
    const users = this._users();
    if (users.length === 0) return false;
    const selection = this._internalSelection();
    return users.every((user) => selection.has(user.id));
  });

  /**
   * Check if some users are selected (indeterminate state)
   */
  readonly isSomeSelected = computed(() => {
    const users = this._users();
    const selection = this._internalSelection();
    const selectedCount = users.filter((user) => selection.has(user.id)).length;
    return selectedCount > 0 && selectedCount < users.length;
  });

  /**
   * Get currently selected users
   */
  readonly currentSelection = computed(() => {
    const users = this._users();
    const selection = this._internalSelection();
    return users.filter((user) => selection.has(user.id));
  });

  /**
   * Check if table has data
   */
  readonly hasData = computed(() => {
    const users = this._users();
    return users.length > 0;
  });

  /**
   * Check if selection is enabled and has selected items
   */
  readonly hasSelection = computed(
    () => this.enableSelection && this.currentSelection().length > 0
  );

  // ============================================================================
  // Table Header Methods
  // ============================================================================

  /**
   * Handle column sort
   */
  onSort(field: keyof UserDisplayData): void {
    const currentSort = this.sortConfig;
    let direction: 'asc' | 'desc' = 'asc';

    if (currentSort?.field === field) {
      direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    }

    this.sortChange.emit({ field, direction });
  }

  /**
   * Get sort icon for column
   */
  getSortIcon(field: keyof UserDisplayData): string {
    const currentSort = this.sortConfig;

    if (currentSort?.field !== field) {
      return 'chevron-up-down';
    }

    return currentSort.direction === 'asc' ? 'chevron-up' : 'chevron-down';
  }

  /**
   * Check if column is sortable
   */
  isSortable(field: keyof UserDisplayData): boolean {
    return ['displayName', 'email', 'role', 'createdAt', 'lastActivity'].includes(field as string);
  }

  // ============================================================================
  // Selection Methods
  // ============================================================================

  /**
   * Handle select all checkbox
   */
  onSelectAll(): void {
    if (!this.enableSelection) return;

    const selection = this._internalSelection();
    const newSelection = new Set(selection);

    if (this.isAllSelected()) {
      // Deselect all
      this.users.forEach((user) => newSelection.delete(user.id));
    } else {
      // Select all
      this.users.forEach((user) => newSelection.add(user.id));
    }

    this._internalSelection.set(newSelection);
    this.emitSelectionChange();
  }

  /**
   * Handle individual user selection
   */
  onSelectUser(user: UserDisplayData): void {
    if (!this.enableSelection) return;

    const selection = this._internalSelection();
    const newSelection = new Set(selection);

    if (newSelection.has(user.id)) {
      newSelection.delete(user.id);
    } else {
      newSelection.add(user.id);
    }

    this._internalSelection.set(newSelection);
    this.emitSelectionChange();
  }

  /**
   * Check if user is selected
   */
  isUserSelected(user: UserDisplayData): boolean {
    return this._internalSelection().has(user.id);
  }

  /**
   * Emit selection change event
   */
  private emitSelectionChange(): void {
    const selectedUsers = this.currentSelection();
    this.selectionChange.emit({
      selectedUsers,
      isAllSelected: this.isAllSelected(),
    });
  }

  // ============================================================================
  // User Action Methods
  // ============================================================================

  /**
   * Handle user action
   */
  onUserAction(action: UserActionEvent['action'], user: UserDisplayData): void {
    this.userAction.emit({ action, user });
  }

  /**
   * Handle bulk action
   */
  onBulkAction(action: string): void {
    const selectedUsers = this.currentSelection();
    if (selectedUsers.length > 0) {
      this.bulkAction.emit({ action, users: selectedUsers });
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Get user initials for avatar
   */
  getUserInitials(user: UserDisplayData): string {
    // Check if initials are already computed
    if (user.initials && user.initials.length > 0) {
      return user.initials;
    }

    // Generate initials from displayName if available
    if (user.displayName && user.displayName.trim().length > 0) {
      return user.displayName
        .split(' ')
        .map((name: string) => name.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }

    // Fallback to email or username initials
    const fallbackName = user.email || user.username;
    return fallbackName ? fallbackName.charAt(0).toUpperCase() : 'U';
  } /**
   * Get user status CSS class
   */
  getStatusClass(status: UserDisplayData['status']): string {
    return `status-${status.cssClass}`;
  }

  /**
   * Get role display information including colors and styling
   * Uses the role access level that should be provided in the user data
   */
  getRoleInfo(user: UserDisplayData): RoleAccessLevelInfo {
    const level = user.accessLevel || 5;
    return getRoleAccessLevelInfo(level);
  }

  /**
   * Get role badge CSS classes based on the user's access level
   */
  getRoleClass(user: UserDisplayData): string {
    const roleInfo = this.getRoleInfo(user);
    return roleInfo.badgeClasses;
  }

  /**
   * Get role icon based on the user's access level
   */
  getRoleIcon(user: UserDisplayData): string {
    const level = user.accessLevel || 5;
    return getRoleAccessLevelIcon(level);
  }

  /**
   * Get role icon background classes based on the user's access level
   */
  getRoleIconBg(user: UserDisplayData): string {
    const roleInfo = this.getRoleInfo(user);
    return roleInfo.iconBg;
  }

  /**
   * Get role icon color classes based on the user's access level
   */
  getRoleIconColor(user: UserDisplayData): string {
    const roleInfo = this.getRoleInfo(user);
    return roleInfo.iconColor;
  }

  /**
   * Get action label for display
   */
  getActionLabel(action: string): string {
    switch (action) {
      case 'delete':
        return 'Desactivar'; // Changed: reflects that "delete" actually deactivates the user
      case 'activate':
        return 'Activar';
      case 'deactivate':
        return 'Desactivar';
      case 'resetPassword':
        return 'Restablecer Contraseña';
      case 'edit':
        return 'Editar';
      case 'view':
        return 'Ver';
      default:
        return action.charAt(0).toUpperCase() + action.slice(1);
    }
  }

  /**
   * Track users by ID for ngFor
   */
  trackByUserId(_index: number, user: UserDisplayData): number {
    return user.id;
  }

  /**
   * Format date for display
   */
  formatDate(date: string | Date | undefined): string {
    if (!date) return 'Nunca';

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays === 1 ? '' : 's'}`;
    if (diffDays < 30)
      return `Hace ${Math.floor(diffDays / 7)} semana${Math.floor(diffDays / 7) === 1 ? '' : 's'}`;
    if (diffDays < 365)
      return `Hace ${Math.floor(diffDays / 30)} mes${Math.floor(diffDays / 30) === 1 ? '' : 'es'}`;

    return dateObj.toLocaleDateString();
  }
}
