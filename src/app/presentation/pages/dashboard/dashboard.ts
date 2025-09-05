import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TitleService } from '@presentation/services/title.service';
import { BreadcrumbService } from '@presentation/services/breadcrumb.service';
import { Button } from '@presentation/shared/ui/button/button';
import { Icon } from '@presentation/shared/ui/icon/icon';
import { AuthFacade } from '@application/facades/auth.facade';
import { User } from '@domain/entities/user.entity';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Icon],
})
export class Dashboard implements OnInit {
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
    this.username = this.User?.username?.value; // ✅ Corrección: usar .value del value object
  }

  ngOnInit(): void {
    this.titleService.setTitle(this.titlePage);
    this.breadcrumbService.setBreadcrumbs([{ label: this.titlePage, icon: 'user' }]);
    // Delegar refresh de perfil al facade (operación compleja)
    this.authFacade.refreshProfile();
  }

  logout(): void {
    // Delegar logout al facade (operación compleja)
    this.authFacade.logout();
    this.router.navigateByUrl('/auth/login');
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
