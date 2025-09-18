import { Injectable, inject, signal, computed } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import { AuthFacade } from '@application/facades/auth.facade';
import { NAV_SECTIONS } from './nav.config';
import { NavSection, NavItem } from './types';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly router = inject(Router);
  private readonly authFacade = inject(AuthFacade);

  private readonly _currentPath = signal<string>('/');

  readonly currentPath = computed(() => this._currentPath());

  // Filter sections based on user roles using Application layer business logic
  readonly accessibleSections = computed(() => {
    return this.authFacade.filterNavigationSections(NAV_SECTIONS);
  });

  constructor() {
    this.initializeRouter();
  }

  private initializeRouter(): void {
    // Set initial path
    this._currentPath.set(this.router.url);

    // Listen to route changes
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this._currentPath.set(event.url);
      });
  }

  isItemActive(item: NavItem): boolean {
    const currentPath = this._currentPath();
    const matchPath = item.activeMatch || item.route;

    if (matchPath === '/') {
      return currentPath === '/';
    }

    return currentPath.startsWith(matchPath);
  }
}
