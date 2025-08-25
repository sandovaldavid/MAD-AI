import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ThemeService } from '@core/cross-cutting/ui-state/theme.service';
import { Icon } from '@shared/ui/icon/icon';

@Component({
  selector: 'ui-theme-toggle',
  standalone: true,
  imports: [Icon],
  templateUrl: './theme-toggle.html',
  styleUrl: './theme-toggle.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggle {
  private themeService = inject(ThemeService);

  protected isDarkMode = this.themeService.isDarkMode;

  onToggle(): void {
    this.themeService.toggleTheme();
  }
}
