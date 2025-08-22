import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ThemeService } from '@core/cross-cutting/ui-state/theme.service';
import { Icon } from '@shared/ui/icon/icon';

@Component({
    selector: 'ui-theme-toggle',
    standalone: true,
    imports: [Icon],
    template: `
        <button
            type="button"
            class="theme-toggle"
            (click)="onToggle()"
            [attr.aria-label]="isDarkMode() ? 'Switch to light mode' : 'Switch to dark mode'"
            [attr.aria-pressed]="isDarkMode()"
        >
            <ui-icon
                [name]="isDarkMode() ? 'outline/sun' : 'outline/moon'"
                size="md"
                class="theme-toggle__icon"
            />
        </button>
    `,
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
