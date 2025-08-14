import { NavItem } from './nav-item.entity';

export class NavSection {
    constructor(
        public readonly id: string,
        public readonly title: string,
        public readonly items: NavItem[]
    ) {}

    static create(data: { id: string; title: string; items: NavItem[] }): NavSection {
        return new NavSection(data.id, data.title, data.items);
    }

    getFilteredItems(userRoles: string[]): NavItem[] {
        return this.items.filter((item) => item.hasPermission(userRoles));
    }

    hasVisibleItems(userRoles: string[]): boolean {
        return this.getFilteredItems(userRoles).length > 0;
    }
}
