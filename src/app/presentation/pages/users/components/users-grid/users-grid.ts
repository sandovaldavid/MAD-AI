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
import type { UserDisplayData, UserActionConfig } from '../../types';

/**
 * Selection change event
 */
export interface UserSelectionChangeEvent {
  readonly user: UserDisplayData;
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
  template: `
    <div
      class="users-grid-container"
      [class.loading]="loading()"
      [attr.aria-label]="'Users grid with ' + users().length + ' users'"
      role="grid">
      <!-- Loading State -->
      @if (loading() && users().length === 0) {
        <div class="grid-loading" role="status" aria-label="Loading users">
          <div class="loading-message">
            <ui-icon
              name="arrow-clockwise"
              variant="outline"
              size="lg"
              class="loading-spinner"
              aria-hidden="true"></ui-icon>
            <span class="loading-text">Loading users...</span>
          </div>
        </div>
      }

      <!-- Empty State -->
      @else if (!loading() && users().length === 0) {
        <div class="grid-empty" role="status" aria-label="No users found">
          <div class="empty-content">
            <ui-icon
              name="user-group"
              variant="outline"
              size="xl"
              class="empty-icon"
              aria-hidden="true"></ui-icon>
            <h3 class="empty-title">No users found</h3>
            <p class="empty-description">
              There are no users to display. Try adjusting your filters or create a new user.
            </p>
          </div>
        </div>
      }

      <!-- Users Grid -->
      @else {
        <div
          class="users-grid"
          [class.compact]="compact()"
          role="grid"
          [attr.aria-rowcount]="gridRows()"
          [attr.aria-colcount]="gridCols()">
          @for (user of users(); track user.id; let index = $index) {
            <div
              role="gridcell"
              [attr.aria-rowindex]="getRowIndex(index)"
              [attr.aria-colindex]="getColIndex(index)">
              <app-user-card
                [user]="user"
                [userActions]="userActions()"
                [size]="compact() ? 'compact' : 'normal'"
                [selectable]="enableSelection()"
                [selected]="isUserSelected(user.id)"
                [showActions]="showActions()"
                [showDetails]="showDetails()"
                [loading]="loading()"
                [clickable]="true"
                (userAction)="onUserAction($event)"
                (cardClick)="onCardClick($event)"
                (selectionChange)="onSelectionChange($event)">
              </app-user-card>
            </div>
          }
        </div>
      }

      <!-- Loading Overlay for existing content -->
      @if (loading() && users().length > 0) {
        <div class="loading-overlay" role="status" aria-label="Updating users">
          <div class="overlay-content">
            <ui-icon
              name="arrow-clockwise"
              variant="outline"
              size="md"
              class="loading-spinner"
              aria-hidden="true"></ui-icon>
            <span class="sr-only">Updating users...</span>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './users-grid.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersGridComponent {
  // ============================================================================
  // Inputs
  // ============================================================================

  /** Users to display */
  users = input.required<UserDisplayData[]>();

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

  // ============================================================================
  // Outputs
  // ============================================================================

  /** Emitted when a user action is triggered */
  userAction = output<UserCardActionEvent>();

  /** Emitted when a card is clicked */
  cardClick = output<UserDisplayData>();

  /** Emitted when user selection changes */
  selectionChange = output<UserSelectionChangeEvent>();

  // ============================================================================
  // Computed Properties
  // ============================================================================

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

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handle user action from card
   */
  onUserAction(event: UserCardActionEvent): void {
    this.userAction.emit(event);
  }

  /**
   * Handle card click
   */
  onCardClick(user: UserDisplayData): void {
    this.cardClick.emit(user);
  }

  /**
   * Handle selection change
   */
  onSelectionChange(event: { user: UserDisplayData; selected: boolean }): void {
    this.selectionChange.emit({
      user: event.user,
      selected: event.selected,
    });
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

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
