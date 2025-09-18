import {
  Component,
  Input,
  computed,
  signal,
  inject,
  OnInit,
  ChangeDetectionStrategy,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// Application layer imports
import { RolesFacade } from '@application/facades/role';

// Presentation layer imports
import { RoleModel } from '../../models/role.model';
import { getRoleAccessLevelInfo } from '../../types/role-colors.type';

// Shared UI Components
import { Icon } from '@presentation/shared/ui/icon/icon';

export interface RoleStatsConfig {
  showTrends?: boolean;
  showDistribution?: boolean;
  showUserCounts?: boolean;
  showRecentActivity?: boolean;
  compact?: boolean;
  refreshInterval?: number; // in minutes
}

export interface RoleStatsData {
  total: number;
  active: number;
  inactive: number;
  totalUsers: number;
  avgUsersPerRole: number;
  distributionByLevel: {
    level: number;
    count: number;
    percentage: number;
    users: number;
    color: string;
    label: string;
  }[];
  trends: {
    totalChange: number;
    activeChange: number;
    userChange: number;
    period: string;
  };
  recentActivity: {
    action: string;
    roleName: string;
    timestamp: Date;
    user?: string;
  }[];
}

@Component({
  selector: 'app-role-stats',
  standalone: true,
  imports: [CommonModule, Icon],
  templateUrl: './role-stats.html',
  styleUrls: ['./role-stats.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleStatsComponent implements OnInit, OnDestroy {
  private readonly rolesFacade = inject(RolesFacade);

  // Input configuration
  @Input() config = signal<RoleStatsConfig>({
    showTrends: true,
    showDistribution: true,
    showUserCounts: true,
    showRecentActivity: true,
    compact: false,
    refreshInterval: 5,
  });

  // Internal state
  private readonly _loading = signal(false);
  private readonly _lastUpdated = signal<Date | null>(null);
  private readonly _error = signal<string | null>(null);

  // Auto-refresh interval
  private refreshIntervalId: number | null = null;

  // Computed properties
  readonly loading = computed(() => this._loading() || this.rolesFacade.loading());
  readonly lastUpdated = computed(() => this._lastUpdated());
  readonly error = computed(() => this._error() || this.rolesFacade.error());

  readonly statsData = computed((): RoleStatsData => {
    const roles = this.rolesFacade.roles();
    const total = roles.length;
    const active = roles.filter((r) => r.isActive).length;
    const inactive = total - active;
    const totalUsers = roles.reduce((sum, r) => sum + (r.userCount || 0), 0);
    const avgUsersPerRole = total > 0 ? totalUsers / total : 0;

    // Distribution by access level
    const levelCounts = new Map<number, { count: number; users: number }>();
    roles.forEach((role) => {
      const current = levelCounts.get(role.accessLevel) || { count: 0, users: 0 };
      levelCounts.set(role.accessLevel, {
        count: current.count + 1,
        users: current.users + (role.userCount || 0),
      });
    });

    const distributionByLevel = Array.from(levelCounts.entries())
      .map(([level, data]) => {
        const levelInfo = getRoleAccessLevelInfo(level);
        return {
          level,
          count: data.count,
          percentage: total > 0 ? Math.round((data.count / total) * 100) : 0,
          users: data.users,
          color: levelInfo.color,
          label: levelInfo.label,
        };
      })
      .sort((a, b) => a.level - b.level);

    // Mock trends data (in real app, this would come from historical data)
    const trends = {
      totalChange: Math.floor(Math.random() * 6) - 3, // -3 to +3
      activeChange: Math.floor(Math.random() * 4) - 2, // -2 to +2
      userChange: Math.floor(Math.random() * 20) - 10, // -10 to +10
      period: 'last 7 days',
    };

    // Mock recent activity (in real app, this would come from audit logs)
    const recentActivity = [
      {
        action: 'Created',
        roleName: 'Project Manager',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        user: 'John Doe',
      },
      {
        action: 'Modified',
        roleName: 'Senior User',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        user: 'Jane Smith',
      },
      {
        action: 'Activated',
        roleName: 'Standard User',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
        user: 'Admin',
      },
    ];

    return {
      total,
      active,
      inactive,
      totalUsers,
      avgUsersPerRole,
      distributionByLevel,
      trends,
      recentActivity,
    };
  });

  ngOnInit() {
    this.refreshStats();
    this.setupAutoRefresh();
  }

  ngOnDestroy() {
    if (this.refreshIntervalId) {
      clearInterval(this.refreshIntervalId);
    }
  }

  async refreshStats() {
    this._loading.set(true);
    this._error.set(null);

    try {
      await this.rolesFacade.refresh();
      this._lastUpdated.set(new Date());
    } catch (error: any) {
      this._error.set(error?.message || 'Failed to refresh statistics');
    } finally {
      this._loading.set(false);
    }
  }

  private setupAutoRefresh() {
    const intervalMinutes = this.config().refreshInterval;
    if (intervalMinutes && intervalMinutes > 0) {
      this.refreshIntervalId = window.setInterval(
        () => {
          this.refreshStats();
        },
        intervalMinutes * 60 * 1000
      );
    }
  }

  // Template helper methods
  getActivePercentage(): number {
    const stats = this.statsData();
    return stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0;
  }

  getInactivePercentage(): number {
    const stats = this.statsData();
    return stats.total > 0 ? Math.round((stats.inactive / stats.total) * 100) : 0;
  }

  formatLastUpdated(): string {
    const lastUpdated = this.lastUpdated();
    if (!lastUpdated) return '';

    const now = new Date();
    const diffMs = now.getTime() - lastUpdated.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;

    return lastUpdated.toLocaleDateString();
  }

  formatTimestamp(timestamp: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  }

  getActivityIcon(action: string): string {
    const iconMap: Record<string, string> = {
      Created: 'plus',
      Modified: 'pencil',
      Deleted: 'trash',
      Activated: 'check',
      Deactivated: 'x-mark',
      Assigned: 'user-plus',
    };
    return iconMap[action] || 'info';
  }

  getActivityIconClass(action: string): string {
    const classMap: Record<string, string> = {
      Created: 'success',
      Modified: 'info',
      Deleted: 'danger',
      Activated: 'success',
      Deactivated: 'warning',
      Assigned: 'primary',
    };
    return classMap[action] || 'neutral';
  }

  // Action handlers
  onCreateRole() {
    // Emit event or navigate to create role page
    console.log('Navigate to create role');
  }

  onManageRoles() {
    // Emit event or navigate to roles management page
    console.log('Navigate to manage roles');
  }

  onExportStats() {
    // Export statistics as PDF/Excel
    console.log('Export statistics');
  }

  // Template helper for Math functions
  Math = Math;
}
