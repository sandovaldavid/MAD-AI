import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Injectable({
    providedIn: 'root',
})
export class AuthGuard implements CanActivate {
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    async canActivate(): Promise<boolean> {
        // Esperamos a que el AuthService se inicialice completamente
        await this.authService.waitForInitialization();

        if (this.authService.isAuthenticated()) {
            return true;
        }

        this.router.navigate(['/auth/login']);
        return false;
    }
}
