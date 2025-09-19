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
  imports: [
    CommonModule,
    Icon,
  ],
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
      return this.status;
    }

    if (this.statusValue) {
      // Check custom statuses first
      const customStatus = this.customStatuses.find(s => s.value === this.statusValue);
      if (customStatus) {
        return {
          value: customStatus.value,
          label: customStatus.label,
          cssClass: customStatus.cssClass,
          iconName: customStatus.iconName,
        };
      }

      // Use default status mapping
      return this.getDefaultStatusConfig(this.statusValue);
    }

    return null;
  });

  /**
   * Badge CSS classes
   */
  readonly badgeClasses = computed(() => {
    const config = this.statusConfig();
    if (!config) return 'status-badge status-unknown';

    const classes = ['status-badge'];

    classes.push(`size-${this.size}`);
    classes.push(`variant-${this.variant}`);
    classes.push(`status-${config.cssClass}`);

    if (this.clickable) classes.push('clickable');
    if (this.showTooltip) classes.push('has-tooltip');

    return classes.join(' ');
  });

  /**
   * Icon size based on badge size
   */
  readonly iconSize = computed(() => {
    const sizeMap = {
      'xs': 'xs' as const,
      'sm': 'xs' as const,
      'md': 'sm' as const,
      'lg': 'md' as const,
    };
    return sizeMap[this.size];
  });

  /**
   * Tooltip text
   */
  readonly tooltipText = computed(() => {
    const config = this.statusConfig();
    if (!config || !this.showTooltip) return '';

    // Check if custom status has description
    if (this.statusValue) {
      const customStatus = this.customStatuses.find(s => s.value === this.statusValue);
      if (customStatus?.description) {
        return customStatus.description;
      }
    }

    return `Status: ${config.label}`;
  });

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Get default status configuration for built-in statuses
   */
  private getDefaultStatusConfig(statusValue: string): UserStatusDisplay {
    const defaultStatuses: Record<string, UserStatusDisplay> = {
      'active': {
        value: 'active',
        label: 'Active',
        cssClass: 'active',
        iconName: 'check-circle',
        description: 'User account is active and can access the system',
      },
      'inactive': {
        value: 'inactive',
        label: 'Inactive',
        cssClass: 'inactive',
        iconName: 'x-circle',
        description: 'User account is deactivated and cannot access the system',
      },
      'pending': {
        value: 'pending',
        label: 'Pending',
        cssClass: 'pending',
        iconName: 'clock',
        description: 'User account is pending activation or verification',
      },
      'suspended': {
        value: 'suspended',
        label: 'Suspended',
        cssClass: 'suspended',
        iconName: 'alert-circle',
        description: 'User account has been temporarily suspended',
      },
      'banned': {
        value: 'banned',
        label: 'Banned',
        cssClass: 'banned',
        iconName: 'slash',
        description: 'User account has been permanently banned',
      },
      'verified': {
        value: 'verified',
        label: 'Verified',
        cssClass: 'verified',
        iconName: 'shield-check',
        description: 'User account has been verified and approved',
      },
    };

    return defaultStatuses[statusValue.toLowerCase()] || {
      value: statusValue,
      label: statusValue.charAt(0).toUpperCase() + statusValue.slice(1),
      cssClass: 'unknown',
      iconName: 'help-circle',
      description: `User status: ${statusValue}`,
    };
  }

  /**
   * Check if status indicates an active/positive state
   */
  isPositiveStatus(): boolean {
    const config = this.statusConfig();
    if (!config) return false;

    const positiveStatuses = ['active', 'verified', 'approved', 'confirmed'];
    return positiveStatuses.includes(config.value.toLowerCase());
  }

  /**
   * Check if status indicates a warning/attention state
   */
  isWarningStatus(): boolean {
    const config = this.statusConfig();
    if (!config) return false;

    const warningStatuses = ['pending', 'review', 'warning'];
    return warningStatuses.includes(config.value.toLowerCase());
  }

  /**
   * Check if status indicates a negative/error state
   */
  isNegativeStatus(): boolean {
    const config = this.statusConfig();
    if (!config) return false;

    const negativeStatuses = ['inactive', 'suspended', 'banned', 'rejected', 'error'];
    return negativeStatuses.includes(config.value.toLowerCase());
  }
}
