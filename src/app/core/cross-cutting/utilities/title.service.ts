import { Injectable, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { BreadcrumbService, BreadcrumbItem } from '../ui-state/breadcrumb.service';

interface RouteData {
  title?: string;
  breadcrumb?: string;
  breadcrumbIcon?: string;
}

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

  // Flag para evitar múltiples inicializaciones
  private isInitialized = false;

  constructor() {
    this.initializeRouteListener();
  }

  /**
   * Configura la escucha de eventos del enrutador para actualizar el título y los breadcrumbs
   */
  private initializeRouteListener(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => this.getDeepestActiveRoute())
      )
      .subscribe((route) => {
        const title = this.extractTitleFromRoute(route);
        this.updateTitle(title);
        this.updateBreadcrumbs(route);
      });
  }

  /**
   * Obtiene la ruta activa más profunda
   */
  private getDeepestActiveRoute(): ActivatedRoute {
    let route = this.activatedRoute;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route;
  }

  /**
   * Extrae el título de los datos de la ruta o lo genera a partir de la URL
   */
  private extractTitleFromRoute(route: ActivatedRoute): string {
    // Primero intenta con la ruta actual
    let title = this.getTitleFromRoute(route);

    // Si no se encuentra, recorre hacia arriba en el árbol de rutas
    if (!title) {
      let currentRoute = route.parent;
      while (currentRoute && !title) {
        title = this.getTitleFromRoute(currentRoute);
        currentRoute = currentRoute.parent;
      }
    }

    // Si aún no hay título, genera uno a partir de la URL
    if (!title) {
      title = this.generateTitleFromUrl();
    }

    return title;
  }

  /**
   * Obtiene el título de los datos de la ruta
   */
  private getTitleFromRoute(route: ActivatedRoute): string {
    if (route && route.snapshot) {
      const routeData = route.snapshot.data as RouteData;
      return routeData?.title || route.snapshot.title || '';
    }
    return '';
  }

  /**
   * Genera un título basado en la URL actual
   */
  private generateTitleFromUrl(): string {
    const url = this.router.url;

    if (url.startsWith('/users')) {
      return 'Dashboard de Usuarios';
    } else if (url.startsWith('/dashboard')) {
      return 'Dashboard';
    }

    return 'MAD-AI';
  }

  /**
   * Actualiza el título tanto en la señal como en el navegador
   */
  private updateTitle(title: string): void {
    // Limpia el título si ya tiene el sufijo
    const cleanTitle = title.includes(this.suffix) ? title.replace(this.suffix, '') : title;

    this._currentTitle.set(cleanTitle);
    this.setDocumentTitle(cleanTitle);
  }

  /**
   * Establece el título del documento con el sufijo
   */
  private setDocumentTitle(title: string): void {
    const fullTitle = title.includes(this.suffix) ? title : `${title}${this.suffix}`;
    this.titleService.setTitle(fullTitle);
  }

  /**
   * Actualiza los breadcrumbs basándose en la ruta actual
   */
  private updateBreadcrumbs(route: ActivatedRoute): void {
    // Genera los breadcrumbs basados en la jerarquía de rutas
    const breadcrumbs = this.generateBreadcrumbs(route);
    this.breadcrumbService.setBreadcrumbs(breadcrumbs);
  }

  /**
   * Genera los breadcrumbs a partir de la jerarquía de rutas
   */
  private generateBreadcrumbs(route: ActivatedRoute): BreadcrumbItem[] {
    const breadcrumbs: BreadcrumbItem[] = [];
    const url = this.router.url;

    // Breadcrumbs base para módulos principales
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

    // Avanzado: Podría agregar lógica para extraer breadcrumbs de los datos de la ruta

    return breadcrumbs;
  }

  /**
   * Establece manualmente un título para la página actual
   */
  setTitle(title: string): void {
    this.updateTitle(title);
  }
}
