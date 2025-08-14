export class NavItem {
    constructor(
        public readonly id: string,
        public readonly label: string,
        public readonly icon: string,
        public readonly route?: string,
        public readonly activeMatch?: string | RegExp,
        public readonly badge?: string | number,
        public readonly requireRoles?: string[],
        public readonly children?: NavItem[]
    ) {}

    static create(data: {
        id: string;
        label: string;
        icon: string;
        route?: string;
        activeMatch?: string | RegExp;
        badge?: string | number;
        requireRoles?: string[];
        children?: NavItem[];
    }): NavItem {
        return new NavItem(
            data.id,
            data.label,
            data.icon,
            data.route,
            data.activeMatch,
            data.badge,
            data.requireRoles,
            data.children
        );
    }

    hasPermission(userRoles: string[]): boolean {
        if (!this.requireRoles || this.requireRoles.length === 0) {
            return true;
        }
        return this.requireRoles.some((role) => userRoles.includes(role));
    }

    isActive(currentRoute: string): boolean {
        if (this.route === currentRoute) {
            return true;
        }

        if (this.activeMatch) {
            if (typeof this.activeMatch === 'string') {
                return currentRoute.startsWith(this.activeMatch);
            } else {
                return this.activeMatch.test(currentRoute);
            }
        }

        return this.children?.some((child) => child.isActive(currentRoute)) ?? false;
    }
}
