import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MainSidebar } from '@presentation/shell/main-sidebar/main-sidebar';
import { LayoutService } from '@core/cross-cutting/ui-state/layout.service';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, MainSidebar],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayout {
  private readonly layoutService = inject(LayoutService);

  readonly sidebarCollapsed = computed(() => this.layoutService.sidebarCollapsed());
}
