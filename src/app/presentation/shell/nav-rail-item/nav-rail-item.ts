import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { NavItem } from '@presentation/navigation/types';
import { LayoutService } from '../../services/layout.service';
import { Icon } from '@presentation/shared/ui/icon/icon';

@Component({
  selector: 'app-nav-rail-item',
  standalone: true,
  imports: [CommonModule, RouterModule, Icon],
  templateUrl: './nav-rail-item.html',
  styleUrl: './nav-rail-item.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavRailItem {
  private layoutService = inject(LayoutService);

  // Inputs
  item = input.required<NavItem>();
  collapsed = input.required<boolean>();
  active = input.required<boolean>();

  // Outputs
  hover = output<string>();
  leave = output<void>();

  // Internal state - made public for template access
  readonly hovering = computed(() => this.layoutService.hoveredItemId() === this.item().id);
  readonly showTooltip = computed(() => this.collapsed() && this.hovering());
  readonly tooltipId = computed(() => `tooltip-${this.item().id}`);

  onMouseEnter(): void {
    if (this.collapsed()) {
      this.hover.emit(this.item().id);
    }
  }

  onMouseLeave(): void {
    if (this.collapsed()) {
      this.leave.emit();
    }
  }

  onFocus(): void {
    if (this.collapsed()) {
      this.hover.emit(this.item().id);
    }
  }

  onBlur(): void {
    if (this.collapsed()) {
      this.leave.emit();
    }
  }

  onClick(): void {
    this.layoutService.onNavigate();
  }
}
