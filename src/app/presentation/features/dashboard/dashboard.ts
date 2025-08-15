import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TitleService } from '@core/services/title.service';
import { BreadcrumbService } from '@core/services/breadcrumb.service';
import { Button } from '@/app/shared/ui/button/button';
import { Icon } from '@/app/shared/ui/icon/icon';
import { AuthFacade } from '@/app/application/facades/auth.facade';
import { User } from '@/app/domain/entities/user.entity';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [Button, Icon],
})
export class Dashboard {
    readonly User: User | null;
    readonly username: string | undefined;
    protected readonly titlePage = 'Dashboard';

    constructor(
        private titleService: TitleService,
        private breadcrumbService: BreadcrumbService,
        public authFacade: AuthFacade,
        private router: Router
    ) {
        this.User = this.authFacade.user();
        this.username = this.User?.username;
    }

    async ngOnInit(): Promise<void> {
        this.titleService.setTitle(this.titlePage);
        this.breadcrumbService.setBreadcrumbs([{ label: this.titlePage, icon: 'user' }]);
        await this.authFacade.refreshProfile();
    }

    async logout() {
        await this.authFacade.logout();
        await this.router.navigateByUrl('/auth/login');
    }

    // Métodos para las acciones rápidas
    onProfileAction(): void {
        // TODO: Implementar navegación al perfil
        console.log('Navegar al perfil de usuario');
    }

    onSettingsAction(): void {
        // TODO: Implementar navegación a configuración
        console.log('Navegar a configuración');
    }

    onHelpAction(): void {
        // TODO: Implementar navegación a ayuda
        console.log('Navegar a ayuda');
    }

    // Método para obtener el saludo basado en la hora del día
    getGreeting(): string {
        const hour = new Date().getHours();
        if (hour < 12) {
            return '¡Buenos días!';
        } else if (hour < 18) {
            return '¡Buenas tardes!';
        } else {
            return '¡Buenas noches!';
        }
    }

    // Método para obtener la fecha actual formateada
    getCurrentDate(): string {
        return new Date().toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }
}
