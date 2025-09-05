import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LayoutService } from '../../services/layout.service';
import { Icon } from '@presentation/shared/ui/icon/icon';

@Component({
  selector: 'app-nav-rail-toggler',
  standalone: true,
  imports: [CommonModule, Icon],
  templateUrl: './nav-rail-toggler.html',
  styleUrl: './nav-rail-toggler.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavRailToggler {
  private layoutService = inject(LayoutService);

  // Inputs
  collapsed = input.required<boolean>();

  // Computed properties
  readonly buttonLabel = computed(() =>
    this.collapsed() ? 'Expandir navegación' : 'Contraer navegación'
  );

  onToggle(): void {
    this.layoutService.toggleSidebarCollapsed();
  }
}
