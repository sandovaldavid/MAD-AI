/**
 * User Display Models
 *
 * @description
 * ViewModels specifically designed for user data display in the presentation layer.
 * These models represent the "shape" of data that UI components need,
 * optimized for rendering and user interaction patterns.
 *
 * @responsibilities
 * - Define optimized data structures for UI consumption
 * - Provide computed properties for display logic
 * - Support different display contexts (list, card, detail)
 * - Include UI-specific metadata and state
 *
 * @architecture
 * - ViewModel Pattern: Data shaped for specific UI needs
 * - Immutable Objects: Readonly properties for predictable state
 * - Computed Properties: Derived values for display logic
 * - Context-Specific: Different models for different UI contexts
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Presentation
 */

import type {
  UserDisplayData,
  UserCardData,
  UserStatusDisplay,
  UserStatsData,
  UserActionConfig,
} from '../types';

/**
 * Complete user information optimized for list display
 * Contains all data needed for table rows, including actions and metadata
 */
export class UserListViewModel implements UserDisplayData {
  readonly id: number;
  readonly displayName: string;
  readonly email: string;
  readonly username: string;
  readonly role: string;
  readonly status: UserStatusDisplay;
  readonly avatar?: string;
  readonly lastActivity?: string;
  readonly createdAt: string;
  readonly isActive: boolean;
  readonly canEdit: boolean;
  readonly canDelete: boolean;

  constructor(data: UserDisplayData) {
    this.id = data.id;
    this.displayName = data.displayName;
    this.email = data.email;
    this.username = data.username;
    this.role = data.role;
    this.status = data.status;
    this.avatar = data.avatar;
    this.lastActivity = data.lastActivity;
    this.createdAt = data.createdAt;
    this.isActive = data.isActive;
    this.canEdit = data.canEdit;
    this.canDelete = data.canDelete;
  }

  /**
   * Get initials for avatar fallback
   */
  get initials(): string {
    const names = this.displayName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return this.displayName.substring(0, 2).toUpperCase();
  }

  /**
   * Get user's full information for tooltips
   */
  get fullInfo(): string {
    return `${this.displayName} (${this.username}) - ${this.role}`;
  }

  /**
   * Check if user has recent activity (within last 30 days)
   */
  get hasRecentActivity(): boolean {
    if (!this.lastActivity) return false;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(this.lastActivity) > thirtyDaysAgo;
  }

  /**
   * Get available actions for this user
   */
  get availableActions(): UserActionConfig {
    return {
      canView: true,
      canEdit: this.canEdit,
      canDelete: this.canDelete,
      canActivate: !this.isActive,
      canDeactivate: this.isActive,
      canResetPassword: this.isActive,
    };
  }
}

/**
 * Compact user information optimized for card display
 * Contains essential information for dashboard and overview components
 */
export class UserCardViewModel implements UserCardData {
  readonly id: number;
  readonly displayName: string;
  readonly email: string;
  readonly role: string;
  readonly status: UserStatusDisplay;
  readonly avatar?: string;
  readonly stats?: UserStatsData;

  constructor(data: UserCardData) {
    this.id = data.id;
    this.displayName = data.displayName;
    this.email = data.email;
    this.role = data.role;
    this.status = data.status;
    this.avatar = data.avatar;
    this.stats = data.stats;
  }

  /**
   * Get initials for avatar fallback
   */
  get initials(): string {
    const names = this.displayName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return this.displayName.substring(0, 2).toUpperCase();
  }

  /**
   * Get role display with proper formatting
   */
  get roleDisplay(): string {
    return this.role.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  /**
   * Get performance indicator based on stats
   */
  get performanceIndicator(): 'high' | 'medium' | 'low' | 'unknown' {
    if (!this.stats) return 'unknown';

    const { completionRate, totalActions } = this.stats;

    if (completionRate >= 80 && totalActions > 50) return 'high';
    if (completionRate >= 60 && totalActions > 20) return 'medium';
    return 'low';
  }

  /**
   * Get formatted stats summary for quick overview
   */
  get statsSummary(): string {
    if (!this.stats) return 'No activity data';

    const { totalLogins, completionRate } = this.stats;
    return `${totalLogins} logins, ${completionRate}% completion rate`;
  }
}

/**
 * User information optimized for detail view
 * Contains comprehensive information with computed display properties
 */
export class UserDetailViewModel {
  readonly id: number;
  readonly displayName: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly username: string;
  readonly role: string;
  readonly status: UserStatusDisplay;
  readonly avatar?: string;
  readonly stats: UserStatsData;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastActivity?: string;
  readonly isActive: boolean;
  readonly actions: UserActionConfig;

  constructor(data: {
    id: number;
    displayName: string;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    role: string;
    status: UserStatusDisplay;
    avatar?: string;
    stats: UserStatsData;
    createdAt: string;
    updatedAt: string;
    lastActivity?: string;
    isActive: boolean;
    actions: UserActionConfig;
  }) {
    this.id = data.id;
    this.displayName = data.displayName;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.email = data.email;
    this.username = data.username;
    this.role = data.role;
    this.status = data.status;
    this.avatar = data.avatar;
    this.stats = data.stats;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.lastActivity = data.lastActivity;
    this.isActive = data.isActive;
    this.actions = data.actions;
  }

  /**
   * Get initials for avatar fallback
   */
  get initials(): string {
    return `${this.firstName[0]}${this.lastName[0]}`.toUpperCase();
  }

  /**
   * Get user's account age in human-readable format
   */
  get accountAge(): string {
    const created = new Date(this.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
    return `${Math.floor(diffDays / 365)} years`;
  }

  /**
   * Get last activity in human-readable format
   */
  get lastActivityDisplay(): string {
    if (!this.lastActivity) return 'Never';

    const lastActive = new Date(this.lastActivity);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastActive.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  }

  /**
   * Get activity level based on stats and last activity
   */
  get activityLevel(): 'very-active' | 'active' | 'moderate' | 'inactive' {
    if (!this.lastActivity) return 'inactive';

    const daysSinceLastActivity = Math.ceil(
      (new Date().getTime() - new Date(this.lastActivity).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastActivity <= 1 && this.stats.totalActions > 10) return 'very-active';
    if (daysSinceLastActivity <= 7 && this.stats.totalActions > 5) return 'active';
    if (daysSinceLastActivity <= 30) return 'moderate';
    return 'inactive';
  }

  /**
   * Get comprehensive overview for summary sections
   */
  get overview(): {
    memberSince: string;
    totalLogins: number;
    activityLevel: string;
    completionRate: number;
    status: string;
  } {
    return {
      memberSince: this.accountAge,
      totalLogins: this.stats.totalLogins,
      activityLevel: this.activityLevel,
      completionRate: this.stats.completionRate,
      status: this.status.label,
    };
  }
}
