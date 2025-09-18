/**
 * @fileoverview User Presentation Mapper
 *
 * This file contains the mapper that transforms Application layer types
 * to Presentation layer models for user-related views.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2025-01-01
 */

import { Injectable } from '@angular/core';
import {
  UserTableRowView,
  UserCardView,
  UserProfileView,
  UserStatisticsView,
  RoleBadgeView,
  StatusBadgeView,
  PermissionView,
  RoleCountView,
  BadgeColor,
  ButtonColor,
  UserStatus,
  TableAction,
} from '../models/user.models';

@Injectable({
  providedIn: 'root',
})
export class UserPresentationMapper {
  /**
   * Maps application user summary to table row view
   */
  toTableRow(user: any): UserTableRowView {
    return {
      id: user.id,
      displayName: this.formatDisplayName(user.firstName, user.lastName),
      email: user.email,
      username: user.username,
      roleBadge: this.toRoleBadge(user.role),
      statusBadge: this.toStatusBadge(user.status),
      lastLogin: this.formatDate(user.lastLogin),
      createdAt: this.formatDate(user.createdAt),
      actions: this.getTableActions(user),
    };
  }

  /**
   * Maps application users to table rows
   */
  toTableRows(users: any[]): UserTableRowView[] {
    return users.map((user) => this.toTableRow(user));
  }

  /**
   * Maps application user to card view
   */
  toCardView(user: any): UserCardView {
    return {
      id: user.id,
      avatarUrl: user.avatarUrl,
      displayName: this.formatDisplayName(user.firstName, user.lastName),
      email: user.email,
      role: user.role?.name || 'No Role',
      status: this.mapUserStatus(user.status),
      joinDate: this.formatDate(user.createdAt),
      lastActivity: this.formatDate(user.lastLogin),
    };
  }

  /**
   * Maps application user to profile view
   */
  toProfileView(user: any): UserProfileView {
    return {
      id: user.id,
      displayName: this.formatDisplayName(user.firstName, user.lastName),
      email: user.email,
      username: user.username,
      role: this.toRoleBadge(user.role),
      status: this.toStatusBadge(user.status),
      avatarUrl: user.avatarUrl,
      joinDate: this.formatDate(user.createdAt),
      lastLogin: this.formatDate(user.lastLogin),
      permissions: this.toPermissions(user.permissions || []),
      statistics: this.toUserStatistics(user.statistics),
    };
  }

  /**
   * Maps application statistics to user statistics view
   */
  toUserStatistics(stats: any): UserStatisticsView {
    return {
      totalUsers: stats?.totalUsers || 0,
      activeUsers: stats?.activeUsers || 0,
      inactiveUsers: stats?.inactiveUsers || 0,
      newUsersThisMonth: stats?.newUsersThisMonth || 0,
      usersByRole: (stats?.usersByRole || []).map((role: any) => ({
        roleName: role.name,
        count: role.count,
        percentage: role.percentage,
      })),
    };
  }

  /**
   * Maps role to badge view
   */
  private toRoleBadge(role: any): RoleBadgeView {
    if (!role) {
      return {
        label: 'No Role',
        color: 'secondary' as BadgeColor,
        icon: 'user',
      };
    }

    return {
      label: role.displayName || role.name,
      color: this.getRoleColor(role.name),
      icon: role.icon || 'shield',
    };
  }

  /**
   * Maps status to badge view
   */
  private toStatusBadge(status: string): StatusBadgeView {
    const statusConfig = this.getStatusConfig(status);

    return {
      label: statusConfig.label,
      color: statusConfig.color,
      icon: statusConfig.icon,
    };
  }

  /**
   * Maps permissions to permission views
   */
  private toPermissions(permissions: any[]): PermissionView[] {
    return permissions.map((permission) => ({
      id: permission.id,
      name: permission.name,
      description: permission.description,
      category: permission.category,
      granted: permission.granted,
    }));
  }

  /**
   * Gets table actions for user
   */
  private getTableActions(user: any): TableAction[] {
    const actions: TableAction[] = [
      {
        label: 'Edit',
        icon: 'pencil',
        color: 'primary' as ButtonColor,
        action: 'edit',
      },
      {
        label: 'View',
        icon: 'eye',
        color: 'info' as ButtonColor,
        action: 'view',
      },
    ];

    // Add status-specific actions
    if (user.status === 'active') {
      actions.push({
        label: 'Deactivate',
        icon: 'pause',
        color: 'warning' as ButtonColor,
        action: 'deactivate',
      });
    } else {
      actions.push({
        label: 'Activate',
        icon: 'play',
        color: 'success' as ButtonColor,
        action: 'activate',
      });
    }

    actions.push({
      label: 'Delete',
      icon: 'trash',
      color: 'danger' as ButtonColor,
      action: 'delete',
    });

    return actions;
  }

  /**
   * Formats display name from first and last name
   */
  private formatDisplayName(firstName: string, lastName: string): string {
    return `${firstName} ${lastName}`.trim();
  }

  /**
   * Formats date for display
   */
  private formatDate(date: string | Date): string {
    if (!date) return 'Never';

    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Maps user status
   */
  private mapUserStatus(status: string): UserStatus {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'active';
      case 'inactive':
        return 'inactive';
      case 'pending':
        return 'pending';
      case 'suspended':
        return 'suspended';
      default:
        return 'inactive';
    }
  }

  /**
   * Gets role color based on role name
   */
  private getRoleColor(roleName: string): BadgeColor {
    const colorMap: Record<string, BadgeColor> = {
      admin: 'danger',
      manager: 'warning',
      user: 'info',
      viewer: 'secondary',
      editor: 'success',
    };

    return colorMap[roleName?.toLowerCase()] || 'secondary';
  }

  /**
   * Gets status configuration
   */
  private getStatusConfig(status: string): { label: string; color: BadgeColor; icon: string } {
    switch (status?.toLowerCase()) {
      case 'active':
        return { label: 'Active', color: 'success', icon: 'check-circle' };
      case 'inactive':
        return { label: 'Inactive', color: 'secondary', icon: 'pause' };
      case 'pending':
        return { label: 'Pending', color: 'warning', icon: 'clock' };
      case 'suspended':
        return { label: 'Suspended', color: 'danger', icon: 'x-circle' };
      default:
        return { label: 'Unknown', color: 'secondary', icon: 'question-mark-circle' };
    }
  }
}
