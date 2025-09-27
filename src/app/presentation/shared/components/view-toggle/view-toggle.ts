/**
 * View Toggle Component - Shared UI Component
 *
 * @description
 * Toggle component for switching between different view modes (table, card, grid, etc).
 * Provides a clean, accessible interface for view mode selection with visual feedback.
 *
 * @responsibilities
 * - Display view mode options with icons and labels
 * - Handle view mode selection
 * - Provide visual feedback for active mode
 * - Support keyboard navigation
 * - Emit view change events
 *
 * @architecture
 * Shared UI Component following MAD-AI patterns:
 * - Reusable across different pages
 * - Uses Angular signals for reactive state
 * - Supports accessibility features
 * - Customizable appearance and behavior
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Presentation/Shared
 */

import { ChangeDetectionStrategy, Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

// Shared UI Components
import { Icon } from '@presentation/shared/ui/icon/icon';

/**
 * View mode configuration
 */
export interface ViewMode {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly description: string;
  readonly shortcut?: string;
}

/**
 * View Toggle Component
 *
 * Provides a toggle interface for switching between different view modes
 * with visual feedback and accessibility support.
 */
@Component({
  selector: 'ui-view-toggle',
  standalone: true,
  imports: [CommonModule, Icon],
  templateUrl: './view-toggle.html',
  styleUrl: './view-toggle.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewToggleComponent {
  // ============================================================================
  // Inputs
  // ============================================================================

  /** Available view modes (Spanish, matching roles-list) */
  availableViews = input<ViewMode[]>([
    {
      id: 'cards',
      label: 'Tarjetas',
      icon: 'grid',
      description: 'Vista de tarjetas',
      shortcut: 'T',
    },
    {
      id: 'table',
      label: 'Tabla',
      icon: 'table',
      description: 'Vista de tabla',
      shortcut: 'B',
    },
  ]);

  /** Currently selected view mode */
  selectedView = input<string>('cards');

  /** Whether to use compact layout */
  compact = input<boolean>(false);

  /** Whether to show current view label */
  showLabel = input<boolean>(false);

  /** Custom aria label */
  ariaLabel = input<string>('Selector de vista');

  /** Whether the toggle is disabled */
  disabled = input<boolean>(false);

  // ============================================================================
  // Outputs
  // ============================================================================

  /** Emitted when view mode changes */
  viewChange = output<string>();

  // ============================================================================
  // Computed Properties
  // ============================================================================

  /** Get current view configuration */
  readonly currentView = computed(() => {
    const current = this.selectedView();
    return this.availableViews().find((view) => view.id === current) || this.availableViews()[0];
  });

  /** Get current view label */
  readonly getCurrentViewLabel = computed(() => {
    return this.currentView()?.label || '';
  });

  /** Get available view labels for accessibility */
  readonly availableViewLabels = computed(() => {
    return this.availableViews()
      .map((v) => v.label)
      .join(', ');
  });

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Select a view mode
   */
  selectView(viewId: string): void {
    if (this.disabled() || viewId === this.selectedView()) return;

    this.viewChange.emit(viewId);
  }

  /**
   * Check if view is active
   */
  isActive(viewId: string): boolean {
    return viewId === this.selectedView();
  }

  /**
   * Get tooltip text for view option
   */
  getTooltip(view: ViewMode): string {
    const shortcut = view.shortcut ? ` (${view.shortcut})` : '';
    return `${view.description}${shortcut}`;
  }

  /**
   * Handle keyboard navigation
   */
  onKeyDown(event: KeyboardEvent): void {
    if (this.disabled()) return;

    const views = this.availableViews();
    const currentIndex = views.findIndex((view) => view.id === this.selectedView());

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : views.length - 1;
        this.selectView(views[prevIndex].id);
        break;

      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        const nextIndex = currentIndex < views.length - 1 ? currentIndex + 1 : 0;
        this.selectView(views[nextIndex].id);
        break;

      case 'Home':
        event.preventDefault();
        this.selectView(views[0].id);
        break;

      case 'End':
        event.preventDefault();
        this.selectView(views[views.length - 1].id);
        break;

      default:
        // Check for shortcut keys
        const shortcutView = views.find(
          (view) => view.shortcut && event.key.toLowerCase() === view.shortcut.toLowerCase()
        );
        if (shortcutView) {
          event.preventDefault();
          this.selectView(shortcutView.id);
        }
        break;
    }
  }
}
