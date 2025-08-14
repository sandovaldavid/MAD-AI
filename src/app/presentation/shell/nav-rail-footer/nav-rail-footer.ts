import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { AuthFacade } from '@application/facades/auth.facade';
import { ThemeService } from '@core/services/theme.service';
import { Button } from '@shared/ui/button/button';

@Component({
    selector: 'app-nav-rail-footer',
    standalone: true,
    imports: [CommonModule, Button],
    templateUrl: './nav-rail-footer.html',
    styleUrl: './nav-rail-footer.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavRailFooter {
    protected authFacade = inject(AuthFacade);
    private themeService = inject(ThemeService);
    private router = inject(Router);

    // Inputs
    collapsed = input.required<boolean>();

    // Computed properties
    readonly user = computed(() => this.authFacade.user());
    readonly isDarkMode = computed(() => this.themeService.isDarkMode());

    readonly themeButtonLabel = computed(() =>
        this.isDarkMode() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
    );

    readonly profileButtonLabel = computed(
        () => `Perfil de ${this.user()?.firstName || 'usuario'}`
    );

    onThemeToggle(): void {
        this.themeService.toggleTheme();
    }

    onProfileClick(): void {
        this.router.navigate(['/profile']);
    }

    async onLogout(): Promise<void> {
        try {
            await this.authFacade.logout();
            this.router.navigate(['/auth/login']);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }
}
