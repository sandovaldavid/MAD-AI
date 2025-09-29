import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

// Shared Components
import { Icon } from '@presentation/shared/ui/icon/icon';

import {
  getRoleAccessLevelInfo,
  getRoleAccessLevelIcon,
  type RoleAccessLevelColor,
  type RoleAccessLevelInfo,
} from '../../../../models/roles/accesLevel.models.js';

export type { RoleAccessLevelColor, RoleAccessLevelInfo };

/**
 * AccessLevelIndicator Component
 *
 * Visual indicator component for displaying access levels (1-5) with:
 * - Color-coded badges based on access level
 * - Multiple display variants (badge, chip, bar, circle)
 * - Tooltips with detailed information
 * - Icons and labels
 * - Dark mode support
 * - Accessibility features
 *
 * Access Level Hierarchy (lower number = higher privileges):
 * - Level 1: System Administrator (bg-primary-500)
 * - Level 2: Project Manager (bg-secondary-500)
 * - Level 3: Senior User (bg-info-500)
 * - Level 4: Standard User (bg-warning-500)
 * - Level 5: Basic User (bg-neutral-500)
 *
 * @example Basic usage
 * ```html
 * <app-access-level-indicator
 *   [level]="role.accessLevel"
 *   variant="badge">
 * </app-access-level-indicator>
 * ```
 *
 * @example With tooltip and icon
 * ```html
 * <app-access-level-indicator
 *   [level]="role.accessLevel"
 *   variant="chip"
 *   [showIcon]="true"
 *   [showTooltip]="true"
 *   [showLabel]="true">
 * </app-access-level-indicator>
 * ```
 *
 * @example Progress bar variant
 * ```html
 * <app-access-level-indicator
 *   [level]="role.accessLevel"
 *   variant="bar"
 *   size="lg">
 * </app-access-level-indicator>
 * ```
 */
@Component({
  selector: 'app-access-level-indicator',
  standalone: true,
  imports: [CommonModule, Icon],
  templateUrl: './access-level-indicator.html',
  styleUrl: './access-level-indicator.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessLevelIndicator {
  /** Access level (1-5) to display */
  level = input.required<number>();

  /** Display variant */
  variant = input<'badge' | 'chip' | 'bar' | 'circle' | 'minimal'>('badge');

  /** Size of the indicator */
  size = input<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');

  /** Whether to show an icon */
  showIcon = input<boolean>(true);

  /** Whether to show the label text */
  showLabel = input<boolean>(true);

  /** Whether to show level number */
  showLevel = input<boolean>(true);

  /** Whether to show tooltip on hover */
  showTooltip = input<boolean>(false);

  /** Custom tooltip text (overrides default) */
  customTooltip = input<string | undefined>();

  /** Whether to use compact display */
  compact = input<boolean>(false);

  /** Access level information including colors and labels */
  readonly levelInfo = computed(() => {
    const level = this.level();
    return getRoleAccessLevelInfo(level);
  });

  /** Icon name based on access level */
  readonly iconName = computed(() => {
    const level = this.level();
    return getRoleAccessLevelIcon(level);
  });

  /** Short label for compact display */
  readonly shortLabel = computed(() => {
    const info = this.levelInfo();
    return info.label;
  });

  /** Full label for normal display */
  readonly fullLabel = computed(() => {
    const info = this.levelInfo();
    return info.label;
  });

  /** Tooltip text */
  readonly tooltipText = computed(() => {
    const custom = this.customTooltip();
    if (custom) return custom;

    const info = this.levelInfo();
    const level = this.level();
    return `Nivel ${level} - ${info.label}: ${info.description}`;
  });

  /** CSS classes for the main container */
  readonly containerClasses = computed(() => {
    const variant = this.variant();
    const size = this.size();
    const info = this.levelInfo();

    const baseClasses = 'inline-flex items-center transition-all duration-200';

    // Variant-specific classes
    const variantClasses = {
      badge: `px-2.5 py-0.5 rounded-full text-xs font-medium border ${info.badgeClasses}`,
      chip: `px-3 py-1 rounded-lg text-sm font-medium border ${info.badgeClasses}`,
      bar: 'w-full rounded-md overflow-hidden bg-neutral-200 dark:bg-neutral-700',
      circle: `rounded-full border-2 ${info.ringClasses} ${info.iconBg}`,
      minimal: `text-xs font-medium ${info.iconColor}`,
    };

    // Size-specific classes
    const sizeClasses = {
      xs: variant === 'circle' ? 'w-6 h-6' : 'text-xs',
      sm: variant === 'circle' ? 'w-8 h-8' : 'text-sm',
      md: variant === 'circle' ? 'w-10 h-10' : 'text-sm',
      lg: variant === 'circle' ? 'w-12 h-12' : 'text-base',
      xl: variant === 'circle' ? 'w-16 h-16' : 'text-lg',
    };

    return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`;
  });

  /** CSS classes for the progress bar (bar variant) */
  readonly progressBarClasses = computed(() => {
    const level = this.level();
    const info = this.levelInfo();

    // Calculate width based on privilege level (inverted - level 1 = 100%, level 5 = 20%)
    const width = ((6 - level) / 5) * 100;

    return `h-full transition-all duration-500 ease-out ${
      info.badgeClasses.split(' ')[0]
    } rounded-md`;
  });

  /** Progress bar width percentage */
  readonly progressWidth = computed(() => {
    const level = this.level();
    // Higher privileges = wider bar (inverted scale)
    return ((6 - level) / 5) * 100;
  });

  /** Icon size based on component size */
  readonly iconSize = computed(() => {
    const size = this.size();
    const variant = this.variant();

    if (variant === 'circle') {
      switch (size) {
        case 'xs':
          return 'xs';
        case 'sm':
          return 'sm';
        case 'md':
          return 'md';
        case 'lg':
          return 'lg';
        case 'xl':
          return 'xl';
        default:
          return 'sm';
      }
    }

    // For other variants, use smaller icons
    switch (size) {
      case 'xs':
        return 'xs';
      case 'sm':
        return 'xs';
      case 'md':
        return 'sm';
      case 'lg':
        return 'md';
      case 'xl':
        return 'lg';
      default:
        return 'xs';
    }
  });

  /**
   * Get display label based on compact mode and show label setting
   */
  getDisplayLabel(): string {
    if (!this.showLabel()) return '';

    const compact = this.compact();
    return compact ? this.shortLabel() : this.fullLabel();
  }

  /**
   * Get level display text
   */
  getLevelDisplay(): string {
    if (!this.showLevel()) return '';
    return `L${this.level()}`;
  }

  /**
   * Check if level is valid
   */
  isValidLevel(): boolean {
    const level = this.level();
    return level >= 1 && level <= 5;
  }
}
