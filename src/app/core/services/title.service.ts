import { Injectable, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root',
})
export class TitleService {
    private readonly titleService = inject(Title);
    private readonly router = inject(Router);
    private readonly activatedRoute = inject(ActivatedRoute);

    // El sufijo que se agregará al título del navegador
    private readonly suffix = ' | MAD-AI';

    // Señal reactiva para el título de la página actual (sin el sufijo)
    private readonly _currentTitle = signal<string>('');

    // Señal pública de solo lectura
    readonly currentTitle = this._currentTitle.asReadonly();

    /**
     * Inicializa el servicio y comienza a escuchar los eventos de navegación
     * para actualizar el título automáticamente
     */
    initialize(): void {
        this.router.events
            .pipe(
                filter((event) => event instanceof NavigationEnd),
                map(() => {
                    // Obtiene el título de la ruta activa o su ruta hija más profunda
                    let route = this.activatedRoute;
                    while (route.firstChild) {
                        route = route.firstChild;
                    }
                    return route;
                }),
                filter((route) => route.outlet === 'primary'),
                map((route) => route.snapshot.data['title'] || route.snapshot.title || '')
            )
            .subscribe((title) => {
                // Si el título ya incluye el sufijo, extraemos solo la parte principal
                const mainTitle = title.includes(this.suffix)
                    ? title.replace(this.suffix, '')
                    : title;

                // Actualizamos la señal con el título principal
                this._currentTitle.set(mainTitle);

                // Actualizamos el título del navegador con el sufijo
                this.setFullTitle(mainTitle);
            });
    }

    /**
     * Establece manualmente un título para la página actual
     */
    setTitle(title: string): void {
        this._currentTitle.set(title);
        this.setFullTitle(title);
    }

    /**
     * Actualiza el título del navegador con el sufijo
     */
    private setFullTitle(title: string): void {
        // Solo agregamos el sufijo si no está ya presente
        const fullTitle = title.includes(this.suffix) ? title : title + this.suffix;

        this.titleService.setTitle(fullTitle);
    }
}
