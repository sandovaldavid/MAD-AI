import {
    ChangeDetectionStrategy,
    Component,
    inject,
    signal,
    computed,
    ElementRef,
    ViewChild,
    effect,
} from '@angular/core';
import { Router } from '@angular/router';
import { TitleService } from '@core/services/title.service';
import { ThemeService } from '@core/services/theme.service';
import { BreadcrumbService, BreadcrumbItem } from '@core/services/breadcrumb.service';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { SidebarService } from '@core/services/sidebar.service';
import { HeaderIconComponent } from './icons/header-icon';

@Component({
    selector: 'app-header',
    templateUrl: './header.html',
    styleUrl: './header.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [HeaderIconComponent],
})
export class HeaderComponent {
    @ViewChild('searchInput') private searchInput?: ElementRef<HTMLInputElement>;

    private readonly titleService = inject(TitleService);
    private readonly themeService = inject(ThemeService);
    private readonly breadcrumbService = inject(BreadcrumbService);
    private readonly authService = inject(AuthService);
    private readonly notificationService = inject(NotificationService);
    private readonly sidebarService = inject(SidebarService);
    private readonly router = inject(Router);

    // UI state signals
    protected readonly isUserMenuOpen = signal(false);
    protected readonly isNotificationsOpen = signal(false);
    protected readonly isSearchExpanded = signal(false);
    protected readonly searchQuery = signal('');

    // Service signals
    protected readonly pageTitle = this.titleService.currentTitle;
    protected readonly breadcrumbs = this.breadcrumbService.breadcrumbs;
    protected readonly isDarkMode = this.themeService.isDarkMode;
    protected readonly user = this.authService.user;

    // Computed properties
    protected readonly notificationCount = computed(() => {
        // TODO: Connect to real notification service
        return 3; // Placeholder
    });

    protected readonly userDisplayName = computed(() => {
        const user = this.user();
        if (!user) return 'User';
        return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'User';
    });

    protected readonly userEmail = computed(() => {
        const user = this.user();
        return user?.email || '';
    });

    protected readonly userInitials = computed(() => {
        const user = this.user();
        if (!user) return 'U';

        const firstInitial = user.first_name?.charAt(0)?.toUpperCase() || '';
        const lastInitial = user.last_name?.charAt(0)?.toUpperCase() || '';

        return firstInitial + lastInitial || user.email?.charAt(0)?.toUpperCase() || 'U';
    });

    constructor() {
        // Auto-focus search input when expanded
        effect(() => {
            if (this.isSearchExpanded() && this.searchInput) {
                setTimeout(() => this.searchInput?.nativeElement.focus(), 100);
            }
        });

        // Close dropdowns when clicking outside
        effect(() => {
            const handleClickOutside = (event: Event) => {
                const target = event.target as Element;
                if (
                    !target.closest('.user-menu-container') &&
                    !target.closest('.notification-container')
                ) {
                    this.closeAllDropdowns();
                }
            };

            if (this.isUserMenuOpen() || this.isNotificationsOpen() || this.isSearchExpanded()) {
                document.addEventListener('click', handleClickOutside);
                return () => document.removeEventListener('click', handleClickOutside);
            }

            return () => {};
        });
    }

    // Sidebar methods
    protected toggleSidebar(): void {
        this.sidebarService.toggle();
    }

    // Theme methods
    protected toggleTheme(): void {
        this.themeService.toggleTheme();
    }

    // Search methods
    protected toggleSearch(): void {
        this.isSearchExpanded.update((expanded) => !expanded);
        if (!this.isSearchExpanded()) {
            this.searchQuery.set('');
        }
        this.closeOtherDropdowns();
    }

    protected collapseSearch(): void {
        this.isSearchExpanded.set(false);
        this.searchQuery.set('');
    }

    protected onSearchInput(event: Event): void {
        const target = event.target as HTMLInputElement;
        this.searchQuery.set(target.value);
    }

    protected performSearch(): void {
        const query = this.searchQuery().trim();
        if (query) {
            // TODO: Implement search logic
            console.log('Searching for:', query);
            this.router.navigate(['/search'], { queryParams: { q: query } });
            this.collapseSearch();
        }
    }

    // Breadcrumb methods
    protected navigateToBreadcrumb(item: BreadcrumbItem): void {
        if (item.route) {
            this.router.navigate([item.route]);
        }
    }

    // Notification methods
    protected toggleNotifications(): void {
        this.isNotificationsOpen.update((open) => !open);
        this.closeOtherDropdowns();
    }

    protected markAllAsRead(): void {
        // TODO: Implement mark all as read
        console.log('Mark all notifications as read');
        // this.notificationService.markAllAsRead();
    }

    // User menu methods
    protected toggleUserMenu(): void {
        this.isUserMenuOpen.update((open) => !open);
        this.closeOtherDropdowns();
    }

    protected navigateToProfile(): void {
        this.router.navigate(['/profile']);
        this.closeAllDropdowns();
    }

    protected navigateToSettings(): void {
        this.router.navigate(['/profile/settings']);
        this.closeAllDropdowns();
    }

    protected handleLogout(): void {
        this.authService.logout().subscribe(() => {
            this.router.navigate(['/auth/login']);
        });
    }

    // Helper methods
    private closeOtherDropdowns(): void {
        // Close other dropdowns when opening one
        if (this.isSearchExpanded()) {
            this.isUserMenuOpen.set(false);
            this.isNotificationsOpen.set(false);
        } else if (this.isUserMenuOpen()) {
            this.isNotificationsOpen.set(false);
            this.isSearchExpanded.set(false);
        } else if (this.isNotificationsOpen()) {
            this.isUserMenuOpen.set(false);
            this.isSearchExpanded.set(false);
        }
    }

    private closeAllDropdowns(): void {
        this.isUserMenuOpen.set(false);
        this.isNotificationsOpen.set(false);
        this.isSearchExpanded.set(false);
        this.searchQuery.set('');
    }
}
