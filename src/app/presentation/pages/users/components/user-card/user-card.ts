/**
 * User Card Component - Dumb Component
 *
 * @description
 * Pure presentation component that displays user information in a card format.
 * Receives all data through inputs and communicates user interactions through
 * output events. Provides a compact, visually appealing user overview.
 *
 * @responsibilities
 * - Display user information in card format
 * - Show user avatar, name, email, role, and status
 * - Handle card interactions (click, hover)
 * - Emit user action events
 * - Support different card sizes and layouts
 * - Provide loading and skeleton states
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

import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

// Shared UI Components
import { Button } from '@presentation/shared/ui/button/button';
import { Icon } from '@presentation/shared/ui/icon/icon';

// Local Imports
import type { UserDisplayData, UserActionConfig } from '../../types';

/**
 * User card action event data
 */
export interface UserCardActionEvent {
  readonly action: 'view' | 'edit' | 'select';
  readonly user: UserDisplayData;
}

/**
 * User Card Component
 *
 * Displays user information in a card format with avatar,
 * basic details, status, and action buttons. Supports
 * different layouts and interaction modes.
 */
@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [CommonModule, Button, Icon],
  templateUrl: './user-card.html',
  styleUrl: './user-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserCardComponent {
  // ============================================================================
  // Input Properties
  // ============================================================================

  /**
   * User data to display
   */
  @Input({ required: true }) user!: UserDisplayData;

  /**
   * Available actions for this user
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
   * Card size variant
   */
  @Input() size: 'compact' | 'normal' | 'large' = 'normal';

  /**
   * Whether the card is selectable
   */
  @Input() selectable: boolean = false;

  /**
   * Whether the card is selected
   */
  @Input() selected: boolean = false;

  /**
   * Whether to show action buttons
   */
  @Input() showActions: boolean = true;

  /**
   * Whether to show detailed information
   */
  @Input() showDetails: boolean = true;

  /**
   * Loading state for the card
   */
  @Input() loading: boolean = false;

  /**
   * Whether the card is clickable
   */
  @Input() clickable: boolean = true;

  // ============================================================================
  // Output Events
  // ============================================================================

  /**
   * Emitted when a user action is triggered
   */
  @Output() userAction = new EventEmitter<UserCardActionEvent>();

  /**
   * Emitted when the card is clicked
   */
  @Output() cardClick = new EventEmitter<UserDisplayData>();

  /**
   * Emitted when the card selection changes
   */
  @Output() selectionChange = new EventEmitter<{ user: UserDisplayData; selected: boolean }>();

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handle card click
   */
  onCardClick(): void {
    if (!this.clickable || this.loading) return;

    if (this.selectable) {
      this.onToggleSelection();
    } else {
      this.cardClick.emit(this.user);
      this.userAction.emit({ action: 'view', user: this.user });
    }
  }

  /**
   * Handle user action
   */
  onUserAction(action: UserCardActionEvent['action'], event: Event): void {
    event.stopPropagation();
    this.userAction.emit({ action, user: this.user });
  }

  /**
   * Handle selection toggle
   */
  onToggleSelection(): void {
    if (!this.selectable) return;

    const newSelected = !this.selected;
    this.selectionChange.emit({ user: this.user, selected: newSelected });
    this.userAction.emit({ action: 'select', user: this.user });
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Get user initials for avatar
   */
  getUserInitials(): string {
    return this.user.initials;
  }

  /**
   * Get user status CSS class
   */
  getStatusClass(): string {
    return `status-${this.user.status.cssClass}`;
  }

  /**
   * Get role display color
   */
  getRoleClass(): string {
    const roleClasses: Record<string, string> = {
      admin: 'role-admin',
      manager: 'role-manager',
      user: 'role-user',
      viewer: 'role-viewer',
    };
    return roleClasses[this.user.role.toLowerCase()] || 'role-default';
  }

  /**
   * Format last activity for display
   */
  getLastActivityDisplay(): string {
    if (!this.user.lastActivity) return 'Nunca';

    const date = new Date(this.user.lastActivity);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays === 1 ? '' : 's'}`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semana${Math.floor(diffDays / 7) === 1 ? '' : 's'}`;

    return date.toLocaleDateString();
  }

  /**
   * Get card CSS classes
   */
  getCardClasses(): string {
    const classes = ['user-card'];

    classes.push(`size-${this.size}`);

    if (this.selectable) classes.push('selectable');
    if (this.selected) classes.push('selected');
    if (this.clickable) classes.push('clickable');
    if (this.loading) classes.push('loading');

    return classes.join(' ');
  }
}
