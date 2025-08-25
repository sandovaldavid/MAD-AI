import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NavSection } from '@presentation/navigation/types';
import { NavigationService } from '@presentation/navigation/navigation.service';
import { LayoutService } from '@core/cross-cutting/ui-state/layout.service';
import { NavRailItem } from '../nav-rail-item/nav-rail-item';

@Component({
  selector: 'app-nav-rail-section',
  standalone: true,
  imports: [CommonModule, NavRailItem],
  templateUrl: './nav-rail-section.html',
  styleUrl: './nav-rail-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavRailSection {
  private layoutService = inject(LayoutService);
  protected navigationService = inject(NavigationService);

  // Inputs
  section = input.required<NavSection>();
  collapsed = input.required<boolean>();

  onItemHover(itemId: string): void {
    this.layoutService.setHoveredItem(itemId);
  }

  onItemLeave(): void {
    this.layoutService.setHoveredItem(null);
  }
}
