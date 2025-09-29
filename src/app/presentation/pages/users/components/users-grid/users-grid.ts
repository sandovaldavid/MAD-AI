/**
 * Users Grid Component - Dumb Component
 *
 * @description
 * Grid layout component for displaying users in card format.
 * Provides responsive grid layout with optimal spacing and accessibility.
 *
 * @responsibilities
 * - Render users in responsive grid layout
 * - Handle user card interactions
 * - Manage selection state for cards
 * - Support loading and empty states
 * - Provide keyboard navigation
 * - Emit user action events
 *
 * @architecture
 * Dumb Component following MAD-AI patterns:
 * - No dependency injection or business logic
 * - All data received through inputs
 * - All interactions communicated through outputs
 * - Pure presentation logic only
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Presentation
 */

import { ChangeDetectionStrategy, Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

// Local Components
import { UserCardComponent, type UserCardActionEvent } from '../user-card/user-card';

// Shared UI Components
import { Icon } from '@presentation/shared/ui/icon/icon';

// Local Types
import type { UserCardViewModel } from '../../../../models/users/user-display.model';
import { UserActionConfig } from '@/app/presentation/models/users';

/**
 * Selection change event
 */
export interface UserSelectionChangeEvent {
  readonly user: UserCardViewModel;
  readonly selected: boolean;
}

/**
 * Users Grid Component
 *
 * Responsive grid layout for displaying users as cards
 * with selection, actions, and accessibility support.
 */
@Component({
  selector: 'app-users-grid',
  standalone: true,
  imports: [CommonModule, UserCardComponent, Icon],
  templateUrl: './users-grid.html',
  styleUrl: './users-grid.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersGridComponent {
  /** Users to display */
  users = input.required<UserCardViewModel[]>();

  /** Available actions for users */
  userActions = input<UserActionConfig>({
    canView: true,
    canEdit: true,
    canDelete: false,
    canActivate: false,
    canDeactivate: false,
    canResetPassword: false,
  });

  /** Loading state */
  loading = input<boolean>(false);

  /** Compact layout mode */
  compact = input<boolean>(false);

  /** Enable selection mode */
  enableSelection = input<boolean>(false);

  /** Selected user IDs */
  selectedUsers = input<number[]>([]);

  /** Show action buttons on cards */
  showActions = input<boolean>(true);

  /** Show detailed information on cards */
  showDetails = input<boolean>(true);

  /** Emitted when a user action is triggered */
  userAction = output<UserCardActionEvent>();

  /** Emitted when a card is clicked */
  cardClick = output<UserCardViewModel>();

  /** Emitted when user selection changes */
  selectionChange = output<UserSelectionChangeEvent>();

  /** Calculate grid columns based on viewport and card size */
  readonly gridCols = computed(() => {
    if (this.compact()) return 4;
    return 3; // Default columns for normal size cards
  });

  /** Calculate grid rows based on user count and columns */
  readonly gridRows = computed(() => {
    const userCount = this.users().length;
    const cols = this.gridCols();
    return Math.ceil(userCount / cols);
  });

  /**
   * Handle user action from card
   */
  onUserAction(event: UserCardActionEvent): void {
    this.userAction.emit(event);
  }

  /**
   * Handle card click
   */
  onCardClick(user: UserCardViewModel): void {
    this.cardClick.emit(user);
  }

  /**
   * Handle selection change
   */
  onSelectionChange(event: { user: UserCardViewModel; selected: boolean }): void {
    this.selectionChange.emit({
      user: event.user,
      selected: event.selected,
    });
  }

  /**
   * Check if user is selected
   */
  isUserSelected(userId: number): boolean {
    return this.selectedUsers().includes(userId);
  }

  /**
   * Get row index for grid accessibility
   */
  getRowIndex(index: number): number {
    const cols = this.gridCols();
    return Math.floor(index / cols) + 1;
  }

  /**
   * Get column index for grid accessibility
   */
  getColIndex(index: number): number {
    const cols = this.gridCols();
    return (index % cols) + 1;
  }
}
