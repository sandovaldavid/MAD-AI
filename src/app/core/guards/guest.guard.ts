import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Injectable({
    providedIn: 'root',
})
export class GuestGuard implements CanActivate {
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    async canActivate(): Promise<boolean> {
        // Esperamos a que el AuthService se inicialice completamente
        await this.authService.waitForInitialization();

        if (this.authService.isAuthenticated()) {
            // Si está autenticado, redirige al dashboard
            this.router.navigate(['/dashboard']);
            return false;
        }

        // Si no está autenticado, permite el acceso a la ruta
        return true;
    }
}
