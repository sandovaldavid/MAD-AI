import { Injectable, inject, computed } from '@angular/core';
import { Router } from '@angular/router';

import { AuthFacade } from './auth.facade';
import { NavSection } from '@domain/entities/nav-section.entity';
import { NavItem } from '@domain/entities/nav-item.entity';
import { NAV_SECTIONS } from '@presentation/navigation/nav.config';

@Injectable({ providedIn: 'root' })
export class NavigationFacade {
    private authFacade = inject(AuthFacade);
    private router = inject(Router);

    // Computed filtered sections based on user roles
    readonly sections = computed(() => {
        const user = this.authFacade.user();
        if (!user) {
            return [];
        }

        const userRoles = [user.role.name];
        
        return NAV_SECTIONS
            .map(section => NavSection.create({
                id: section.id,
                title: section.title,
                items: section.getFilteredItems(userRoles)
            }))
            .filter(section => section.hasVisibleItems(userRoles));
    });

    // Get current active item based on route
    readonly activeItemId = computed(() => {
        const currentRoute = this.router.url;
        
        for (const section of this.sections()) {
            for (const item of section.items) {
                if (item.isActive(currentRoute)) {
                    return item.id;
                }
            }
        }
        
        return null;
    });

    // Check if specific item is active
    isItemActive(itemId: string): boolean {
        return this.activeItemId() === itemId;
    }

    // Get item by ID across all sections
    getItemById(itemId: string): NavItem | null {
        for (const section of this.sections()) {
            const item = section.items.find(item => item.id === itemId);
            if (item) {
                return item;
            }
        }
        return null;
    }

    // Navigate to item route
    navigateToItem(itemId: string): void {
        const item = this.getItemById(itemId);
        if (item?.route) {
            this.router.navigate([item.route]);
        }
    }
}
