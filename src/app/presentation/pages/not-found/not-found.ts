import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ErrorDisplay } from '@presentation/shared/components/error-view/error-display/error-display';
import { type PageHeaderConfig } from '@presentation/shared/components/page-header/page-header';
import type { ErrorDisplayConfig } from '@presentation/shared/types/error-display.types';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, ErrorDisplay],
  templateUrl: './not-found.html',
  styleUrls: ['./not-found.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {
  private readonly router = inject(Router);

  readonly headerConfig: PageHeaderConfig = {
    title: 'Página no encontrada',
    description: 'La página que estás buscando no existe o ha sido movida.',
    icon: 'exclamation-triangle',
    iconColor: 'warning',
    showBreadcrumbs: false,
  };

  readonly errorConfig: ErrorDisplayConfig = {
    type: 'not-found',
    severity: 'warning',
    title: '404 - Página no encontrada',
    message:
      'Lo sentimos, la página que estás buscando no existe. Es posible que haya sido movida, eliminada o que hayas escrito incorrectamente la URL.',
    icon: 'magnifying-glass-website',
    actions: [
      {
        label: 'Ir al inicio',
        icon: 'filled/home',
        style: 'primary',
        action: () => this.navigateToHome(),
        loading: false,
        disabled: false,
      },
      {
        label: 'Ir atrás',
        icon: 'filled/arrow-left',
        style: 'ghost',
        action: () => this.goBack(),
        loading: false,
        disabled: false,
      },
      {
        label: 'Reportar problema',
        icon: 'filled/bug',
        style: 'danger',
        action: () => this.reportIssue(),
        loading: false,
        disabled: false,
      },
    ],
    showDetails: true,
    details: `URL solicitada: ${
      window.location.pathname
    } Código de error: 404 Fecha: ${new Date().toLocaleString(
      'es-ES'
    )} Si crees que esto es un error, por favor contacta al administrador del sistema.`,
    showIcon: true,
    compact: false,
  };

  private navigateToHome(): void {
    this.router.navigate(['/']);
  }

  private goBack(): void {
    window.history.back();
  }

  private reportIssue(): void {
    // Implement issue reporting logic
    console.log('Reporting 404 issue for:', window.location.pathname);

    // You could integrate with an error reporting service here
    // or open a support form/email client
    const subject = encodeURIComponent('404 Error Report');
    const body = encodeURIComponent(`Encontré un error 404 en la siguiente URL: ${
      window.location.href
    } Por favor, revisa si la página debería existir o si hay un problema con la navegación. Fecha: ${new Date().toLocaleString(
      'es-ES'
    )}
        `);

    window.open(`mailto:support@mad-ai.com?subject=${subject}&body=${body}`, '_blank');
  }
}
