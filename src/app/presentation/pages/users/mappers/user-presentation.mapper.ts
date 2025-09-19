/**
 * User Presentation Mapper
 *
 * @description
 * Transforms domain User entities into presentation-optimized ViewModels.
 * This mapper handles the conversion from business entities to UI-friendly
 * data structures, including formatting, localization, and UI-specific computations.
 *
 * @responsibilities
 * - Transform domain User entities to presentation ViewModels
 * - Apply UI-specific formatting and calculations
 * - Handle status and role display logic
 * - Generate avatar URLs and fallback data
 * - Compute user permissions and available actions
 * - Format dates and relative time displays
 *
 * @architecture
 * - Mapper Pattern: Clean separation between domain and presentation
 * - Static Methods: Stateless transformation functions
 * - Type Safety: Strong typing for all transformations
 * - Single Responsibility: Each method handles one specific mapping
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Presentation
 */

import type { User } from '@domain/entities/user.entity';
import type { UserStatusVO } from '@domain/value-objects';
import type {
  UserDisplayData,
  UserCardData,
  UserStatusDisplay,
  UserStatsData,
  UserActionConfig,
} from '../types';
import {
  UserListViewModel,
  UserCardViewModel,
  UserDetailViewModel,
} from '../models/user-display.model';

/**
 * Main User Presentation Mapper
 *
 * Static utility class that provides methods to transform domain User entities
 * into various presentation-layer ViewModels optimized for different UI contexts.
 */
export class UserPresentationMapper {
  // ============================================================================
  // List Display Transformations
  // ============================================================================

  /**
   * Transform domain User entity to UserDisplayData for list/table display
   *
   * @param user Domain User entity from facade
   * @param permissions Optional user permissions for action computation
   * @returns UserDisplayData optimized for list/table rendering
   */
  static toDisplayData(user: User, permissions?: UserActionConfig): UserDisplayData {
    return {
      id: user.id,
      displayName: this.formatDisplayName(user.firstName.toString(), user.lastName.toString()),
      email: user.email.toString(),
      username: user.username.toString(),
      role: this.formatRole(user.role?.name || 'user'),
      status: this.mapUserStatus(user.status, user.active),
      avatar: this.generateAvatarUrl(user.email.toString()),
      initials: this.generateInitials(user.firstName.toString(), user.lastName.toString()),
      lastActivity: user.lastActivityAt?.toString(),
      createdAt: user.createdAt ? this.formatDate(new Date(user.createdAt.toString())) : '',
      isActive: user.active,
      canEdit: permissions?.canEdit ?? this.canEditUser(user),
      canDelete: permissions?.canDelete ?? this.canDeleteUser(user),
    };
  }

  /**
   * Transform multiple User entities to UserListViewModel array
   *
   * @param users Array of domain User entities
   * @param permissions Optional permissions mapping by user ID
   * @returns Array of UserListViewModel instances
   */
  static toListViewModels(
    users: User[],
    permissions?: Map<number, UserActionConfig>
  ): UserListViewModel[] {
    return users.map((user) => {
      const userPermissions = permissions?.get(user.id);
      const displayData = this.toDisplayData(user, userPermissions);
      return new UserListViewModel(displayData);
    });
  }

  // ============================================================================
  // Card Display Transformations
  // ============================================================================

  /**
   * Transform domain User entity to UserCardData for card display
   *
   * @param user Domain User entity from facade
   * @param includeStats Whether to include user statistics
   * @returns UserCardData optimized for card rendering
   */
  static toCardData(user: User, includeStats: boolean = false): UserCardData {
    return {
      id: user.id,
      displayName: this.formatDisplayName(user.firstName.toString(), user.lastName.toString()),
      email: user.email.toString(),
      role: this.formatRole(user.role?.name || 'user'),
      status: this.mapUserStatus(user.status, user.active),
      avatar: this.generateAvatarUrl(user.email.toString()),
      stats: includeStats ? this.generateUserStats(user) : undefined,
    };
  }

  /**
   * Transform multiple User entities to UserCardViewModel array
   *
   * @param users Array of domain User entities
   * @param includeStats Whether to include user statistics
   * @returns Array of UserCardViewModel instances
   */
  static toCardViewModels(users: User[], includeStats: boolean = false): UserCardViewModel[] {
    return users.map((user) => {
      const cardData = this.toCardData(user, includeStats);
      return new UserCardViewModel(cardData);
    });
  }

  // ============================================================================
  // Detail View Transformations
  // ============================================================================

  /**
   * Transform domain User entity to UserDetailViewModel for detail display
   *
   * @param user Domain User entity from facade
   * @param permissions User-specific permissions and actions
   * @returns UserDetailViewModel optimized for detail rendering
   */
  static toDetailViewModel(user: User, permissions?: UserActionConfig): UserDetailViewModel {
    const actions = permissions ?? this.computeUserActions(user);
    const stats = this.generateUserStats(user);

    return new UserDetailViewModel({
      id: user.id,
      displayName: this.formatDisplayName(user.firstName.toString(), user.lastName.toString()),
      firstName: user.firstName.toString(),
      lastName: user.lastName.toString(),
      email: user.email.toString(),
      username: user.username.toString(),
      role: this.formatRole(user.role?.name || 'user'),
      status: this.mapUserStatus(user.status, user.active),
      avatar: this.generateAvatarUrl(user.email.toString()),
      stats,
      createdAt: user.createdAt ? this.formatDate(new Date(user.createdAt.toString())) : '',
      updatedAt: user.updatedAt ? this.formatDate(new Date(user.updatedAt.toString())) : '',
      lastActivity: user.lastActivityAt?.toString(),
      isActive: user.active,
      actions,
    });
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Format user's full display name
   */
  private static formatDisplayName(firstName: string, lastName: string): string {
    return `${firstName} ${lastName}`.trim();
  }

  /**
   * Format role for display with proper capitalization
   */
  private static formatRole(role: string): string {
    return role
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Map user status to display-friendly format
   */
  private static mapUserStatus(status: UserStatusVO | undefined, isActive: boolean): UserStatusDisplay {
    const statusMap: Record<string, Omit<UserStatusDisplay, 'value'>> = {
      ACTIVE: {
        label: 'Active',
        cssClass: 'status-active',
        iconName: 'check-circle',
        description: 'User is active and can access the system',
      },
      INACTIVE: {
        label: 'Inactive',
        cssClass: 'status-inactive',
        iconName: 'x-circle',
        description: 'User is inactive and cannot access the system',
      },
      PENDING: {
        label: 'Pending',
        cssClass: 'status-pending',
        iconName: 'clock',
        description: 'User registration is pending approval',
      },
      SUSPENDED: {
        label: 'Suspended',
        cssClass: 'status-suspended',
        iconName: 'alert-circle',
        description: 'User has been temporarily suspended',
      },
    };

    const userStatus = status?.toString() || 'PENDING';
    const displayStatus = statusMap[userStatus] || statusMap['INACTIVE'];

    // Override based on isActive flag for additional safety
    if (!isActive && userStatus === 'ACTIVE') {
      return {
        value: 'INACTIVE',
        ...statusMap['INACTIVE'],
      };
    }

    return {
      value: userStatus,
      ...displayStatus,
    };
  }

  /**
   * Generate avatar URL or fallback
   */
  private static generateAvatarUrl(email: string): string | undefined {
    // For now, return undefined to use initials fallback
    // In the future, this could integrate with Gravatar or other avatar services
    return undefined;
  }

  /**
   * Format date for display
   */
  private static formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Generate user statistics (mock implementation)
   */
  private static generateUserStats(user: User): UserStatsData {
    // This would typically come from analytics or activity tracking
    // For now, we'll generate mock data based on user properties
    const accountAge = user.createdAt 
      ? Math.floor((Date.now() - new Date(user.createdAt.toString()).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      totalLogins: Math.floor(accountAge * 0.3) + 1, // Mock: ~30% of days
      lastLoginDate: user.lastActivityAt?.toString(),
      totalActions: Math.floor(accountAge * 1.2) + 5, // Mock: ~1.2 actions per day
      accountAge: `${Math.floor(accountAge / 30)} months`,
      completionRate: Math.min(85 + Math.floor(Math.random() * 15), 100), // Mock: 85-100%
    };
  }

  /**
   * Compute available actions for a user
   */
  private static computeUserActions(user: User): UserActionConfig {
    // This would typically be based on current user permissions and business rules
    // For now, we'll use basic rules
    return {
      canView: true,
      canEdit: user.active,
      canDelete: !user.active, // Can only delete inactive users
      canActivate: !user.active,
      canDeactivate: user.active,
      canResetPassword: user.active,
    };
  }

  /**
   * Check if current user can edit the given user
   */
  private static canEditUser(user: User): boolean {
    // This would integrate with actual permission system
    // For now, return true for all active users
    return user.active;
  }

  /**
   * Check if current user can delete the given user
   */
  private static canDeleteUser(user: User): boolean {
    // This would integrate with actual permission system
    // For now, only allow deletion of inactive users
    return !user.active;
  }

  /**
   * Generate user initials from first and last name
   */
  private static generateInitials(firstName: string, lastName: string): string {
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    return (firstInitial + lastInitial) || 'U';
  }

  /**
   * Format date for relative display (e.g., "2 days ago")
   */
  private static formatRelativeDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    
    return date.toLocaleDateString();
  }
}