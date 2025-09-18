import { Injectable, inject, signal, computed, effect, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

const LAYOUT_STORAGE_KEY = 'layout.sidebar.collapsed';
const MOBILE_BREAKPOINT = 768; // md breakpoint

@Injectable({ providedIn: 'root' })
export class LayoutService {
  private document = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID);

  // Private signals
  private _sidebarCollapsed = signal(false);
  private _mobileDrawerOpen = signal(false);
  private _hoveredItemId = signal<string | null>(null);
  private _expandedSectionIds = signal(new Set<string>());
  private _windowWidth = signal(typeof window !== 'undefined' ? window.innerWidth : 1024);

  // Public computed signals
  readonly sidebarCollapsed = computed(() => this._sidebarCollapsed());
  readonly mobileDrawerOpen = computed(() => this._mobileDrawerOpen());
  readonly hoveredItemId = computed(() => this._hoveredItemId());
  readonly expandedSectionIds = computed(() => this._expandedSectionIds());
  readonly isMobile = computed(() => this._windowWidth() < MOBILE_BREAKPOINT);

  constructor() {
    // Initialize from localStorage (SSR-safe)
    this.initializeFromStorage();

    // Listen to window resize (client-side only)
    if (isPlatformBrowser(this.platformId)) {
      this.setupWindowResize();
    }

    // Persist sidebar collapsed state
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        try {
          const collapsed = this._sidebarCollapsed();
          localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(collapsed));
        } catch (error) {
          console.warn(
            `LayoutService: Error writing to localStorage for key "${LAYOUT_STORAGE_KEY}":`,
            error
          );
        }
      }
    });

    // Auto-close mobile drawer when switching to desktop
    effect(() => {
      if (!this.isMobile() && this._mobileDrawerOpen()) {
        this._mobileDrawerOpen.set(false);
      }
    });
  }

  private initializeFromStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const stored = localStorage.getItem(LAYOUT_STORAGE_KEY);
        if (stored !== null) {
          this._sidebarCollapsed.set(JSON.parse(stored));
        }
      } catch (error) {
        console.warn(
          `LayoutService: Error reading from localStorage for key "${LAYOUT_STORAGE_KEY}":`,
          error
        );
      }
    }
  }

  private setupWindowResize(): void {
    const updateWidth = () => this._windowWidth.set(window.innerWidth);

    window.addEventListener('resize', updateWidth);
    updateWidth(); // Initial value
  }

  // Public API
  toggleSidebarCollapsed(): void {
    this._sidebarCollapsed.update((collapsed) => !collapsed);
  }

  setSidebarCollapsed(collapsed: boolean): void {
    this._sidebarCollapsed.set(collapsed);
  }

  openMobileDrawer(): void {
    this._mobileDrawerOpen.set(true);
  }

  closeMobileDrawer(): void {
    this._mobileDrawerOpen.set(false);
  }

  setHoveredItem(id: string | null): void {
    this._hoveredItemId.set(id);
  }

  toggleSection(sectionId: string): void {
    this._expandedSectionIds.update((sections) => {
      const newSections = new Set(sections);
      if (newSections.has(sectionId)) {
        newSections.delete(sectionId);
      } else {
        newSections.add(sectionId);
      }
      return newSections;
    });
  }

  // Navigation helpers
  onNavigate(): void {
    // Close mobile drawer on navigation
    if (this.isMobile()) {
      this.closeMobileDrawer();
    }

    // Clear hovered item
    this.setHoveredItem(null);
  }
}
