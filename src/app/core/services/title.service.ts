import { Injectable, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { BreadcrumbService } from './breadcrumb.service';

@Injectable({
    providedIn: 'root',
})
export class TitleService {
    private readonly titleService = inject(Title);
    private readonly router = inject(Router);
    private readonly activatedRoute = inject(ActivatedRoute);
    private readonly breadcrumbService = inject(BreadcrumbService);

    // El sufijo que se agregará al título del navegador
    private readonly suffix = ' | MAD-AI';

    // Señal reactiva para el título de la página actual (sin el sufijo)
    private readonly _currentTitle = signal<string>('MAD-AI');

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
                    // Obtiene la ruta activa más profunda
                    let route = this.activatedRoute;
                    while (route.firstChild) {
                        route = route.firstChild;
                    }
                    return route;
                }),
                filter((route) => route.outlet === 'primary')
            )
            .subscribe((route) => {
                // Obtener el título
                const routeData = route.snapshot.data;
                const routeTitle = route.snapshot.title;
                let title = routeData['title'] || routeTitle || '';

                // Si no hay título en la ruta actual, buscar en rutas padre
                if (!title) {
                    let currentRoute = route;
                    while (currentRoute.parent && !title) {
                        currentRoute = currentRoute.parent;
                        const parentData = currentRoute.snapshot.data;
                        const parentTitle = currentRoute.snapshot.title;
                        title = parentData['title'] || parentTitle || '';
                    }
                }

                // Fallback basado en la URL si no se encuentra título
                if (!title) {
                    const url = this.router.url;
                    if (url.startsWith('/users')) {
                        title = 'Dashboard de Usuarios';
                    } else if (url.startsWith('/dashboard')) {
                        title = 'Dashboard';
                    } else {
                        title = 'MAD-AI';
                    }
                }

                // Si el título ya incluye el sufijo, extraemos solo la parte principal
                const mainTitle = title.includes(this.suffix)
                    ? title.replace(this.suffix, '')
                    : title;

                // Actualizamos la señal con el título principal
                this._currentTitle.set(mainTitle);

                // Actualizamos el título del navegador con el sufijo
                this.setFullTitle(mainTitle);

                // Actualizar breadcrumbs basándose en la ruta actual
                this.updateBreadcrumbs(route);
            });
    }

    /**
     * Actualiza los breadcrumbs basándose en la ruta actual
     */
    private updateBreadcrumbs(route: ActivatedRoute): void {
        const breadcrumbs = [];
        const url = this.router.url;

        // Breadcrumbs específicos para módulos
        if (url.startsWith('/users')) {
            breadcrumbs.push({
                label: 'Dashboard de Usuarios',
                route: '/users',
            });
        } else if (url.startsWith('/dashboard')) {
            breadcrumbs.push({
                label: 'Dashboard Principal',
                route: '/dashboard',
            });
        }

        this.breadcrumbService.setBreadcrumbs(breadcrumbs);
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
