import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { TokenService } from '@core/services/token.service';

@Injectable({
    providedIn: 'root',
})
export class AuthGuard implements CanActivate {
    private readonly tokenService = inject(TokenService);
    private readonly router = inject(Router);

    canActivate(): boolean {
        // Verificación inmediata usando solo localStorage/sessionStorage
        if (this.tokenService.isAuthenticated()) {
            return true;
        }

        // Redirección inmediata si no está autenticado
        this.router.navigate(['/auth/login']);
        return false;
    }
}
