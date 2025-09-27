/**
 * User Status Badge Component - Dumb Component
 *
 * @description
 * Pure presentation component that displays user status in a badge format.
 * Receives status data through inputs and provides a consistent visual
 * representation of user states with appropriate styling and icons.
 *
 * @responsibilities
 * - Display user status with appropriate colors and icons
 * - Support different badge sizes and variants
 * - Provide accessibility features (ARIA labels)
 * - Handle different status types (active, inactive, pending, suspended)
 * - Support custom status configurations
 * - Provide hover states and animations
 *
 * @architecture
 * Dumb Component following MAD-AI patterns:
 * - No dependency injection or business logic
 * - All data received through @Input properties
 * - Pure presentation logic only
 * - No direct service calls or state management
 * - Reusable across different contexts
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Presentation
 */

import { ChangeDetectionStrategy, Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

// Shared UI Components
import { Icon } from '@presentation/shared/ui/icon/icon';

// Local Imports
import type { UserStatusDisplay } from '../../types';
import {
  mapStringToUserStatus,
  getUserStatusInfo,
  getUserStatusBadgeClasses,
  getUserStatusIcon,
} from '../../types/user-colors.type';

/**
 * Status configuration for custom statuses
 */
export interface StatusConfig {
  readonly value: string;
  readonly label: string;
  readonly cssClass: string;
  readonly iconName: string;
  readonly description?: string;
}

/**
 * User Status Badge Component
 *
 * Displays user status in a visually consistent badge format
 * with appropriate colors, icons, and accessibility support.
 * Supports multiple size variants and custom status configurations.
 */
@Component({
  selector: 'app-user-status-badge',
  standalone: true,
  imports: [CommonModule, Icon],
  templateUrl: './user-status-badge.html',
  styleUrl: './user-status-badge.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserStatusBadgeComponent {
  // ============================================================================
  // Input Properties
  // ============================================================================

  /**
   * User status display data
   */
  @Input() status: UserStatusDisplay | null = null;

  /**
   * Alternative status value (for simple string statuses)
   */
  @Input() statusValue: string = '';

  /**
   * Badge size variant
   */
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' = 'sm';

  /**
   * Badge style variant
   */
  @Input() variant: 'solid' | 'outline' | 'subtle' = 'subtle';

  /**
   * Whether to show the status icon
   */
  @Input() showIcon: boolean = true;

  /**
   * Whether to show the status label text
   */
  @Input() showLabel: boolean = true;

  /**
   * Custom status configurations
   */
  @Input() customStatuses: StatusConfig[] = [];

  /**
   * Whether the badge is clickable
   */
  @Input() clickable: boolean = false;

  /**
   * Whether to show tooltip on hover
   */
  @Input() showTooltip: boolean = false;

  // ============================================================================
  // Computed Properties
  // ============================================================================

  /**
   * Resolved status configuration
   */
  readonly statusConfig = computed(() => {
    if (this.status) {
      // If status is already a UserStatusDisplay, map to centralized config
      const statusType = mapStringToUserStatus(this.status.value);
      return getUserStatusInfo(statusType);
    }

    if (this.statusValue) {
      // Check custom statuses first
      const customStatus = this.customStatuses.find((s) => s.value === this.statusValue);
      if (customStatus) {
        return {
          status: customStatus.value,
          color: 'neutral',
          label: customStatus.label,
          description: customStatus.description || '',
          iconName: customStatus.iconName,
          iconBg: '',
          iconColor: '',
          badgeClasses: customStatus.cssClass,
          ringClasses: '',
        };
      }
      // Use centralized config for known statuses
      const statusType = mapStringToUserStatus(this.statusValue);
      return getUserStatusInfo(statusType);
    }
    return null;
  });

  /**
   * Badge CSS classes
   */
  readonly badgeClasses = computed(() => {
    const config = this.statusConfig();
    if (!config) return 'status-badge status-unknown';

    // Use getUserStatusBadgeClasses for known statuses
    let baseClasses = '';
    if (config.status) {
      baseClasses = getUserStatusBadgeClasses(mapStringToUserStatus(config.status));
    } else if (config.badgeClasses) {
      baseClasses = config.badgeClasses;
    }
    const classes = [baseClasses, `status-badge`, `size-${this.size}`, `variant-${this.variant}`];
    if (this.clickable) classes.push('clickable');
    if (this.showTooltip) classes.push('has-tooltip');
    return classes.join(' ');
  });
  /**
   * Icon name for the badge, using centralized helper
   */
  readonly iconName = computed(() => {
    const config = this.statusConfig();
    if (!config) return 'help-circle';
    if (config.status) {
      return getUserStatusIcon(mapStringToUserStatus(config.status));
    }
    return config.iconName || 'help-circle';
  });

  /**
   * Icon size based on badge size
   */
  readonly iconSize = computed(() => {
    const sizeMap = {
      xs: 'xs' as const,
      sm: 'xs' as const,
      md: 'sm' as const,
      lg: 'md' as const,
    };
    return sizeMap[this.size];
  });

  /**
   * Tooltip text
   */
  readonly tooltipText = computed(() => {
    const config = this.statusConfig();
    if (!config || !this.showTooltip) return '';
    if (config.description) return config.description;
    return `Estado: ${config.label}`;
  });

  // ============================================================================
  // Helper Methods
  // ============================================================================

  // Removed local getDefaultStatusConfig; now uses centralized config

  /**
   * Check if status indicates an active/positive state
   */
  isPositiveStatus(): boolean {
    const config = this.statusConfig();
    if (!config) return false;
    return config.color === 'successful';
  }

  /**
   * Check if status indicates a warning/attention state
   */
  isWarningStatus(): boolean {
    const config = this.statusConfig();
    if (!config) return false;
    return config.color === 'warning';
  }

  /**
   * Check if status indicates a negative/error state
   */
  isNegativeStatus(): boolean {
    const config = this.statusConfig();
    if (!config) return false;
    return config.color === 'error';
  }
}
