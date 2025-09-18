import { Injectable, signal, inject, DOCUMENT, PLATFORM_ID, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly storageKey = 'theme';

  // Signal para el tema actual
  readonly isDarkMode = signal<boolean>(false);

  constructor() {
    // Initialize theme state
    this.isDarkMode.set(this.getInitialTheme());

    // Efecto para aplicar el tema cuando cambie el signal
    effect(() => {
      this.applyTheme(this.isDarkMode());
    });

    // Set up system theme change listener
    this.setupSystemThemeListener();
  }

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private getStoredThemePreference(): ThemeMode | null {
    if (!this.isBrowser) {
      return null;
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      return (stored as ThemeMode) || null;
    } catch (error) {
      console.warn(
        `ThemeService: Error reading from localStorage for key "${this.storageKey}":`,
        error
      );
      return null;
    }
  }

  private getSystemPreference(): boolean {
    if (!this.isBrowser) {
      return false;
    }

    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (error) {
      console.warn('Error accessing matchMedia:', error);
      return false;
    }
  }

  private getInitialTheme(): boolean {
    const storedPreference = this.getStoredThemePreference();

    if (storedPreference === 'dark') {
      return true;
    } else if (storedPreference === 'light') {
      return false;
    } else {
      return this.getSystemPreference();
    }
  }

  private setupSystemThemeListener(): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      // Only attach listener if using system preference
      if (this.getStoredThemePreference() === null) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        // Modern event listener
        const handler = (event: MediaQueryListEvent) => {
          if (this.getStoredThemePreference() === null) {
            this.isDarkMode.set(event.matches);
          }
        };

        mediaQuery.addEventListener('change', handler);
      }
    } catch (error) {
      console.warn('Error setting up system theme listener:', error);
    }
  }

  private applyTheme(isDark: boolean): void {
    if (!this.isBrowser) {
      return;
    }

    const htmlElement = this.document.documentElement;

    if (isDark) {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
  }

  private saveThemePreference(mode: ThemeMode): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      if (mode === 'system') {
        localStorage.removeItem(this.storageKey);
      } else {
        localStorage.setItem(this.storageKey, mode);
      }
    } catch (error) {
      console.warn(
        `ThemeService: Error writing to localStorage for key "${this.storageKey}":`,
        error
      );
    }
  }

  toggleTheme(): void {
    const newValue = !this.isDarkMode();
    this.isDarkMode.set(newValue);
    this.saveThemePreference(newValue ? 'dark' : 'light');
  }

  setTheme(isDark: boolean): void {
    this.isDarkMode.set(isDark);
    this.saveThemePreference(isDark ? 'dark' : 'light');
  }

  useSystemTheme(): void {
    this.saveThemePreference('system');
    this.isDarkMode.set(this.getSystemPreference());
  }
}
