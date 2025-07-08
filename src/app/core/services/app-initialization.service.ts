import { Injectable, inject, signal, computed } from '@angular/core';
import { AuthService } from '@core/services/auth.service';

@Injectable({
    providedIn: 'root',
})
export class AppInitializationService {
    private readonly authService = inject(AuthService);
    private readonly _isInitialized = signal<boolean>(false);

    readonly isInitialized = computed(() => this._isInitialized());

    async initialize(): Promise<void> {
        try {
            // Esperamos a que el AuthService se inicialice
            await this.authService.waitForInitialization();

            // Marcamos como inicializado
            this._isInitialized.set(true);
        } catch (error) {
            console.error('Error during app initialization:', error);
            // Incluso si hay error, marcamos como inicializado para que la app pueda continuar
            this._isInitialized.set(true);
        }
    }
}
