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

    // Filter sections based on user roles - simple computed
    readonly accessibleSections = computed(() => {
        const user = this.authFacade.user();
        
        if (!user) {
            // If no user, only show items without role requirements
            return NAV_SECTIONS.map(section => ({
                ...section,
                items: section.items.filter(item => !item.requireRoles || item.requireRoles.length === 0)
            })).filter(section => section.items.length > 0);
        }

        const userRoles = [user.role.name];
        const isAdmin = user.isAdministrator();

        return NAV_SECTIONS.map(section => ({
            ...section,
            items: section.items.filter(item => 
                !item.requireRoles || 
                item.requireRoles.length === 0 || 
                isAdmin ||
                item.requireRoles.some(role => userRoles.includes(role))
            )
        })).filter(section => section.items.length > 0);
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
