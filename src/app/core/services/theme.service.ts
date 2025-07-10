import { Injectable, signal, inject, DOCUMENT, PLATFORM_ID, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
    providedIn: 'root',
})
export class ThemeService {
    private readonly document = inject(DOCUMENT);
    private readonly platformId = inject(PLATFORM_ID);
    private readonly storageKey = 'theme';

    // Signal para el tema actual
    readonly isDarkMode = signal(this.getInitialTheme());

    constructor() {
        // Efecto para aplicar el tema cuando cambie el signal
        effect(() => {
            this.applyTheme(this.isDarkMode());
        });
    }

    private getInitialTheme(): boolean {
        // Solo acceder a localStorage en el navegador
        if (isPlatformBrowser(this.platformId)) {
            try {
                // Verificar localStorage primero
                const stored = localStorage.getItem(this.storageKey);

                // Seguir el patrón recomendado de Tailwind v4.1
                if (stored === 'dark') {
                    return true;
                } else if (stored === 'light') {
                    return false;
                } else {
                    // Si no hay preferencia guardada, usar la preferencia del sistema
                    return window.matchMedia('(prefers-color-scheme: dark)').matches;
                }
            } catch (error) {
                console.warn('Error accessing localStorage or matchMedia:', error);
                return false;
            }
        }

        // En el servidor, usar tema claro por defecto
        return false;
    }

    private applyTheme(isDark: boolean): void {
        if (!isPlatformBrowser(this.platformId)) {
            return; // No aplicar temas en el servidor
        }

        const htmlElement = this.document.documentElement;

        // Aplicar la lógica recomendada por Tailwind v4.1
        if (isDark) {
            htmlElement.classList.add('dark');
            localStorage.setItem(this.storageKey, 'dark');
        } else {
            htmlElement.classList.remove('dark');
            localStorage.setItem(this.storageKey, 'light');
        }
    }

    toggleTheme(): void {
        this.isDarkMode.set(!this.isDarkMode());
    }

    setTheme(isDark: boolean): void {
        this.isDarkMode.set(isDark);
    }

    // Método para respetar la preferencia del sistema
    useSystemTheme(): void {
        if (isPlatformBrowser(this.platformId)) {
            localStorage.removeItem(this.storageKey);
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.isDarkMode.set(systemPrefersDark);
        }
    }
}
