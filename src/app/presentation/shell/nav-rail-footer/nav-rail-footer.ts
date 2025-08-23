import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { AuthFacade } from '@application/facades/auth.facade';
import { Icon } from '@shared/ui/icon/icon';
import { ThemeToggle } from '@shared/ui/theme-toggle/theme-toggle';

@Component({
    selector: 'app-nav-rail-footer',
    standalone: true,
    imports: [CommonModule, Icon, ThemeToggle],
    templateUrl: './nav-rail-footer.html',
    styleUrl: './nav-rail-footer.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavRailFooter {
    protected authFacade = inject(AuthFacade);
    private router = inject(Router);

    // Inputs
    collapsed = input.required<boolean>();

    // Computed properties
    readonly user = computed(() => this.authFacade.user());

    readonly profileButtonLabel = computed(
        () => `Perfil de ${this.user()?.firstName || 'usuario'}`
    );

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
