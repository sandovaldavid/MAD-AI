/**
 * @fileoverview Role Presentation Mapper
 *
 * This file contains the mapper that transforms Application layer types
 * to Presentation layer models for role-related views.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2025-01-01
 */

import { Injectable } from '@angular/core';
import {
  RoleTableRowView,
  RoleCardView,
  RoleDetailView,
  RoleStatisticsView,
  RoleUserView,
  StatusBadgeView,
  BadgeColor,
  ButtonColor,
  RoleStatus,
  TableAction,
} from '../models/role.models';

@Injectable({
  providedIn: 'root',
})
export class RolePresentationMapper {
  /**
   * Maps application role to table row view
   */
  toTableRow(role: any): RoleTableRowView {
    return {
      id: role.id,
      name: role.name,
      displayName: role.displayName || role.name,
      description: role.description,
      userCount: role.userCount || 0,
      permissionCount: role.permissions?.length || 0,
      statusBadge: this.toStatusBadge(role.status, role.isSystemRole),
      createdAt: this.formatDate(role.createdAt),
      updatedAt: this.formatDate(role.updatedAt),
      actions: this.getTableActions(role),
    };
  }

  /**
   * Maps application roles to table rows
   */
  toTableRows(roles: any[]): RoleTableRowView[] {
    return roles.map((role) => this.toTableRow(role));
  }

  /**
   * Maps application role to card view
   */
  toCardView(role: any): RoleCardView {
    return {
      id: role.id,
      name: role.name,
      displayName: role.displayName || role.name,
      description: role.description,
      color: role.color || this.getDefaultColor(role.name),
      icon: role.icon || 'shield',
      userCount: role.userCount || 0,
      permissionCount: role.permissions?.length || 0,
      isSystemRole: role.isSystemRole || false,
      status: this.mapRoleStatus(role.status, role.isSystemRole),
    };
  }

  /**
   * Maps application role to detail view
   */
  toDetailView(role: any): RoleDetailView {
    return {
      id: role.id,
      name: role.name,
      displayName: role.displayName || role.name,
      description: role.description,
      color: role.color || this.getDefaultColor(role.name),
      icon: role.icon || 'shield',
      permissions: this.toPermissions(role.permissions || []),
      users: (role.users || []).map((user: any) => this.toRoleUser(user)),
      statistics: this.toStatistics(role.statistics),
      createdAt: this.formatDate(role.createdAt),
      updatedAt: this.formatDate(role.updatedAt),
      createdBy: role.createdBy,
      isSystemRole: role.isSystemRole || false,
      status: this.mapRoleStatus(role.status, role.isSystemRole),
    };
  }

  /**
   * Maps application statistics to role statistics view
   */
  toStatistics(stats: any): RoleStatisticsView {
    return {
      totalUsers: stats?.totalUsers || 0,
      activeUsers: stats?.activeUsers || 0,
      permissionsGranted: stats?.permissionsGranted || 0,
      permissionsDenied: stats?.permissionsDenied || 0,
      recentActivity: (stats?.recentActivity || []).map((activity: any) => ({
        id: activity.id,
        action: activity.action,
        description: activity.description,
        timestamp: this.formatDate(activity.timestamp),
        performedBy: activity.performedBy,
      })),
    };
  }

  /**
   * Maps user to role user view
   */
  private toRoleUser(user: any): RoleUserView {
    return {
      id: user.id,
      displayName: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      avatarUrl: user.avatarUrl,
      assignedAt: this.formatDate(user.assignedAt),
      status: user.status || 'active',
    };
  }

  /**
   * Maps permissions to permission views
   */
  private toPermissions(permissions: any[]) {
    return permissions.map((permission) => ({
      id: permission.id,
      name: permission.name,
      description: permission.description,
      category: permission.category,
      granted: permission.granted,
      required: permission.required || false,
    }));
  }

  /**
   * Maps status to badge view
   */
  private toStatusBadge(status: string, isSystemRole?: boolean): StatusBadgeView {
    const statusConfig = this.getStatusConfig(status, isSystemRole);

    return {
      label: statusConfig.label,
      color: statusConfig.color,
      icon: statusConfig.icon,
    };
  }

  /**
   * Gets table actions for role
   */
  private getTableActions(role: any): TableAction[] {
    const actions: TableAction[] = [
      {
        label: 'View',
        icon: 'eye',
        color: 'info' as ButtonColor,
        action: 'view',
      },
    ];

    // Don't allow editing system roles
    if (!role.isSystemRole) {
      actions.unshift({
        label: 'Edit',
        icon: 'pencil',
        color: 'primary' as ButtonColor,
        action: 'edit',
      });
    }

    // Add role-specific actions
    actions.push({
      label: 'Assign Users',
      icon: 'user-group',
      color: 'success' as ButtonColor,
      action: 'assign-users',
    });

    actions.push({
      label: 'Manage Permissions',
      icon: 'shield',
      color: 'warning' as ButtonColor,
      action: 'manage-permissions',
    });

    // Don't allow deleting system roles
    if (!role.isSystemRole) {
      actions.push({
        label: 'Duplicate',
        icon: 'copy',
        color: 'secondary' as ButtonColor,
        action: 'duplicate',
      });

      actions.push({
        label: 'Delete',
        icon: 'trash',
        color: 'danger' as ButtonColor,
        action: 'delete',
      });
    }

    return actions;
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
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Maps role status
   */
  private mapRoleStatus(status: string, isSystemRole?: boolean): RoleStatus {
    if (isSystemRole) return 'system';

    switch (status?.toLowerCase()) {
      case 'active':
        return 'active';
      case 'inactive':
        return 'inactive';
      default:
        return 'active';
    }
  }

  /**
   * Gets default color for role
   */
  private getDefaultColor(roleName: string): string {
    const colorMap: Record<string, string> = {
      admin: '#dc3545',
      manager: '#ffc107',
      user: '#17a2b8',
      viewer: '#6c757d',
      editor: '#28a745',
    };

    return colorMap[roleName?.toLowerCase()] || '#6c757d';
  }

  /**
   * Gets status configuration
   */
  private getStatusConfig(
    status: string,
    isSystemRole?: boolean
  ): { label: string; color: BadgeColor; icon: string } {
    if (isSystemRole) {
      return { label: 'System', color: 'danger', icon: 'crown' };
    }

    switch (status?.toLowerCase()) {
      case 'active':
        return { label: 'Active', color: 'success', icon: 'check-circle' };
      case 'inactive':
        return { label: 'Inactive', color: 'secondary', icon: 'pause' };
      default:
        return { label: 'Active', color: 'success', icon: 'check-circle' };
    }
  }
}
