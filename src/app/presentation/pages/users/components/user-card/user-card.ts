import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

// Shared UI Components
import { Icon } from '../../../../shared/ui/icon/icon';

// Local Imports
import { UserCardData, UserActionConfig } from '../../../../models/users/user-ui.types';
import { UserCardViewModel } from '../../../../models/users/user-display.model';
import { USER_STATUS_CONFIG, getUserStatusInfo } from '../../../../models/users/user-colors.type';
import {
  ROLE_ACCESS_LEVEL_CONFIG,
  getRoleAccessLevelInfo,
  getRoleAccessLevelIcon,
} from '../../../../models/roles/accesLevel.models';

/**
 * User card action event data
 */
export interface UserCardActionEvent {
  readonly action: 'view' | 'edit' | 'select' | 'activate' | 'deactivate';
  readonly user: UserCardData;
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
  imports: [CommonModule, Icon],
  templateUrl: './user-card.html',
  styleUrl: './user-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserCardComponent {
  /**
   * User data to display
   */
  @Input({ required: true }) user!: UserCardViewModel;

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
  @Input() selectable = false;

  /**
   * Whether the card is selected
   */
  @Input() selected = false;

  /**
   * Whether to show action buttons
   */
  @Input() showActions = true;

  /**
   * Whether to show detailed information
   */
  @Input() showDetails = true;

  /**
   * Loading state for the card
   */
  @Input() loading = false;

  /**
   * Whether the card is clickable
   */
  @Input() clickable = true;

  /**
   * Emitted when a user action is triggered
   */
  @Output() userAction = new EventEmitter<UserCardActionEvent>();

  /**
   * Emitted when the card is clicked
   */
  @Output() cardClick = new EventEmitter<UserCardViewModel>();

  /**
   * Emitted when the card selection changes
   */
  @Output() selectionChange = new EventEmitter<{ user: UserCardViewModel; selected: boolean }>();

  /**
   * Handle card click
   */
  onCardClick(): void {
    if (!this.clickable || this.loading) return;

    if (this.selectable) {
      this.userAction.emit({ action: 'select', user: this.user });
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
   * Get user initials for avatar
   */
  getUserInitials(): string {
    return this.user.initials;
  }

  /**
   * Get user status CSS class using USER_STATUS_CONFIG
   */
  getStatusClass(): string {
    const statusInfo = getUserStatusInfo(this.user.status.value as any);
    return statusInfo.badgeClasses;
  }

  /**
   * Get role access level information
   */
  getRoleAccessLevel(): { level: number; info: any; icon: string } {
    // Map role names to access levels (this could be enhanced with a proper mapping)
    const roleToLevel: Record<string, number> = {
      'admin': 1,      // Critical access
      'superadmin': 1, // Critical access
      'manager': 2,    // High access
      'moderator': 3,  // Medium access
      'user': 4,       // Low access
      'viewer': 5,     // Minimal access
      'guest': 5,     // Minimal access
    };

    const level = roleToLevel[this.user.role.toLowerCase()] || 5;
    const info = getRoleAccessLevelInfo(level);
    const icon = getRoleAccessLevelIcon(level);

    return { level, info, icon };
  }

  /**
   * Get role icon using ROLE_ACCESS_LEVEL_CONFIG
   */
  getRoleIcon(): string {
    return this.getRoleAccessLevel().icon;
  }

  /**
   * Get role display color using ROLE_ACCESS_LEVEL_CONFIG
   */
  getRoleClass(): string {
    return this.getRoleAccessLevel().info.badgeClasses;
  }
  getLastActivityDisplay(): string {
    // Use stats from UserCardViewModel for better activity information
    if (this.user.stats) {
      const { totalLogins, lastLoginDate } = this.user.stats;

      if (lastLoginDate) {
        // Format relative time for last login
        const lastLogin = new Date(lastLoginDate);
        const now = new Date();
        const diffMs = now.getTime() - lastLogin.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return `Último login: Hoy (${totalLogins} total)`;
        if (diffDays === 1) return `Último login: Ayer (${totalLogins} total)`;
        if (diffDays < 7) return `Hace ${diffDays} días (${totalLogins} total)`;
        if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas (${totalLogins} total)`;
        return `Hace ${Math.floor(diffDays / 30)} meses (${totalLogins} total)`;
      }

      return `${totalLogins} logins totales`;
    }

    return 'Sin actividad reciente';
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
