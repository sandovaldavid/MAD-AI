/**
 * @fileoverview User Presentation Mapper
 *
 * This file contains the mapper that transforms Application layer data
 * (Domain entities from Facades) to Presentation layer models optimized for UI.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2025-01-01
 */

import { Injectable } from '@angular/core';

// Domain imports (from Facades)
import type { User } from '@domain/entities/user.entity';

// Presentation models (UI-optimized)
import {
  UserDisplayData,
  UserCardData,
  UserStatusDisplay,
  UserStatsData,
  UserListData,
  UserListViewModel,
  UserCardViewModel,
  UserDetailViewModel,
  UserActionConfig,
} from '../../models/users';

import { UserStatusType, getUserStatusInfo, mapStringToUserStatus } from '../../models/users';

@Injectable({
  providedIn: 'root',
})
export class UserPresentationMapper {
  /**
   * Maps Domain User entity to display data optimized for lists and tables
   */
  toDisplayData(user: User): UserDisplayData {
    return {
      id: user.id,
      displayName: this.formatDisplayName(user.firstName.value, user.lastName.value),
      email: user.email.value,
      username: user.username.value,
      role: user.role.name,
      accessLevel: user.role.accessLevel,
      status: this.toStatusDisplay(user),
      avatar: undefined, // Domain doesn't have avatar, can be added later
      initials: this.getInitials(user.firstName.value, user.lastName.value),
      lastActivity: user.lastActivityAt?.toString(),
      lastActivityDisplay: this.formatLastActivity(user.lastActivityAt),
      createdAt: user.createdAt?.toString() || '',
      isActive: user.active,
      canEdit: true, // TODO: Implement permission checking
      canDelete: user.canDeleteUsers(),
    };
  }

  /**
   * Maps Domain User entity to card data optimized for card components
   */
  toCardData(user: User): UserCardData {
    return {
      id: user.id,
      displayName: this.formatDisplayName(user.firstName.value, user.lastName.value),
      email: user.email.value,
      role: user.role.name,
      status: this.toStatusDisplay(user),
      avatar: undefined, // Domain doesn't have avatar
      stats: this.toUserStats(user),
    };
  }

  /**
   * Maps Domain User entity to list view model optimized for list displays
   */
  toListViewModel(user: User): UserListViewModel {
    return new UserListViewModel(this.toDisplayData(user));
  }

  /**
   * Maps Domain User entity to card view model optimized for card displays
   */
  toCardViewModel(user: User): UserCardViewModel {
    return new UserCardViewModel(this.toCardData(user));
  }

  /**
   * Maps Domain User entity to detail view model optimized for detailed views
   */
  toDetailViewModel(user: User): UserDetailViewModel {
    return new UserDetailViewModel({
      id: user.id,
      displayName: this.formatDisplayName(user.firstName.value, user.lastName.value),
      firstName: user.firstName.value,
      lastName: user.lastName.value,
      email: user.email.value,
      username: user.username.value,
      role: user.role.name,
      status: this.toStatusDisplay(user),
      avatar: undefined, // Domain doesn't have avatar
      stats: this.toUserStats(user),
      createdAt: user.createdAt?.toString() || '',
      updatedAt: user.updatedAt?.toString() || '',
      lastActivity: user.lastActivityAt?.toString(),
      isActive: user.active,
      actions: this.getUserActions(user),
    });
  }

  /**
   * Maps array of Domain User entities to list data with pagination
   */
  toListData(
    users: User[],
    totalCount: number,
    currentPage = 1,
    pageSize = 10
  ): UserListData {
    return {
      users: users.map((user) => this.toDisplayData(user)),
      totalCount,
      currentPage,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
      hasNextPage: currentPage * pageSize < totalCount,
      hasPreviousPage: currentPage > 1,
    };
  }

  /**
   * Maps Domain User entity to status display information
   */
  private toStatusDisplay(user: User): UserStatusDisplay {
    const statusType = this.mapUserStatusToType(user);
    const statusInfo = getUserStatusInfo(statusType);

    return {
      value: statusType,
      label: statusInfo.label,
      cssClass: statusInfo.badgeClasses,
      iconName: statusInfo.iconName,
      description: statusInfo.description,
    };
  }

  /**
   * Maps Domain User entity to user statistics
   */
  private toUserStats(user: User): UserStatsData {
    // For now, return basic stats - can be enhanced with actual user activity data
    return {
      totalLogins: 0, // TODO: Implement when user activity tracking is available
      lastLoginDate: user.lastActivityAt?.toString(),
      totalActions: 0, // TODO: Implement when user actions are tracked
      accountAge: this.calculateAccountAge(user.createdAt),
      completionRate: user.hasVerifiedEmail() ? 100 : 50, // Basic completion based on email verification
    };
  }

  /**
   * Gets available actions for a user based on their permissions and status
   */
  private getUserActions(user: User): UserActionConfig {
    return {
      canView: true,
      canEdit: true, // TODO: Implement proper permission checking
      canDelete: user.canDeleteUsers(),
      canActivate: !user.active,
      canDeactivate: user.active,
      canResetPassword: user.active,
    };
  }

  /**
   * Maps Domain User status to UserStatusType
   */
  private mapUserStatusToType(user: User): UserStatusType {
    if (user.status) {
      // Use the status VO if available
      const statusValue = user.status.value;
      return mapStringToUserStatus(statusValue);
    }

    // Fallback to active/inactive based on boolean flag
    return user.active ? 'active' : 'inactive';
  }

  /**
   * Formats display name from first and last name
   */
  private formatDisplayName(firstName: string, lastName: string): string {
    return `${firstName} ${lastName}`.trim();
  }

  /**
   * Gets initials for avatar fallback
   */
  private getInitials(firstName: string, lastName: string): string {
    const firstInitial = firstName.charAt(0).toUpperCase();
    const lastInitial = lastName.charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}`;
  }

  /**
   * Formats last activity date for display
   */
  private formatLastActivity(lastActivityAt?: any): string {
    if (!lastActivityAt) return 'Nunca';

    try {
      const date =
        lastActivityAt instanceof Date ? lastActivityAt : new Date(lastActivityAt.toISOString());
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'Hoy';
      if (diffDays === 1) return 'Ayer';
      if (diffDays < 7) return `Hace ${diffDays} día${diffDays === 1 ? '' : 's'}`;
      if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `Hace ${weeks} semana${weeks === 1 ? '' : 's'}`;
      }
      const months = Math.floor(diffDays / 30);
      return `Hace ${months} mes${months === 1 ? '' : 'es'}`;
    } catch {
      return 'Desconocido';
    }
  }

  /**
   * Calculates account age in human-readable format
   */
  private calculateAccountAge(createdAt?: any): string {
    if (!createdAt) return 'Desconocido';

    try {
      const created = createdAt instanceof Date ? createdAt : new Date(createdAt.toISOString());
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - created.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 30) return `${diffDays} días`;
      if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} mes${months === 1 ? '' : 'es'}`;
      }
      const years = Math.floor(diffDays / 365);
      return `${years} año${years === 1 ? '' : 's'}`;
    } catch {
      return 'Desconocido';
    }
  }
}
