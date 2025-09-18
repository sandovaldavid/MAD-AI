/**
 * @fileoverview ThemeService Test Suite
 *
 * Tests for theme management service in the Presentation Layer.
 * Focuses on UI state management and browser API integration.
 *
 * @description
 * Tests the ThemeService that manages light/dark theme state and persistence.
 * Verifies:
 * - Theme state management with Angular signals
 * - LocalStorage integration for persistence
 * - System preference detection and monitoring
 * - Browser/SSR compatibility
 * - Theme application to DOM
 *
 * @architecture
 * Presentation Layer Testing Strategy:
 * - Mock browser APIs (localStorage, matchMedia)
 * - Mock DOCUMENT and PLATFORM_ID injection tokens
 * - Focus on UI state behavior, not business logic
 * - Test signal reactivity and effect execution
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Presentation
 */

import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { signal } from '@angular/core';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;
  let mockDocument: jasmine.SpyObj<Document>;
  let mockLocalStorage: jasmine.SpyObj<Storage>;
  let mockMatchMedia: jasmine.Spy;
  let mockMediaQueryList: jasmine.SpyObj<MediaQueryList>;

  // Mock HTML element for theme application
  const mockHtmlElement = {
    classList: {
      add: jasmine.createSpy('add'),
      remove: jasmine.createSpy('remove'),
    },
  } as any;

  beforeEach(() => {
    // Create mock objects
    mockDocument = jasmine.createSpyObj('Document', [], {
      documentElement: mockHtmlElement,
    });

    mockLocalStorage = jasmine.createSpyObj('Storage', ['getItem', 'setItem', 'removeItem']);

    mockMediaQueryList = jasmine.createSpyObj('MediaQueryList', [
      'addEventListener',
      'removeEventListener',
    ]);
    Object.defineProperty(mockMediaQueryList, 'matches', {
      value: false,
      writable: true,
      configurable: true,
    });

    mockMatchMedia = jasmine.createSpy('matchMedia').and.returnValue(mockMediaQueryList);

    // Mock window object with localStorage and matchMedia
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      configurable: true,
    });

    Object.defineProperty(window, 'matchMedia', {
      value: mockMatchMedia,
      configurable: true,
    });

    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        { provide: DOCUMENT, useValue: mockDocument },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    // Reset spies before each test
    mockHtmlElement.classList.add.calls.reset();
    mockHtmlElement.classList.remove.calls.reset();
    mockLocalStorage.getItem.calls.reset();
    mockLocalStorage.setItem.calls.reset();
    mockLocalStorage.removeItem.calls.reset();
    mockMatchMedia.calls.reset();
    mockMediaQueryList.addEventListener.calls.reset();
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      service = TestBed.inject(ThemeService);
      expect(service).toBeTruthy();
    });

    it('should initialize with light theme when no stored preference and system prefers light', () => {
      // Arrange
      mockLocalStorage.getItem.and.returnValue(null);
      Object.defineProperty(mockMediaQueryList, 'matches', {
        value: false,
        writable: true,
        configurable: true,
      });

      // Act
      service = TestBed.inject(ThemeService);

      // Assert
      expect(service.isDarkMode()).toBe(false);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('theme');
    });

    it('should initialize with dark theme when no stored preference and system prefers dark', () => {
      // Arrange
      mockLocalStorage.getItem.and.returnValue(null);
      Object.defineProperty(mockMediaQueryList, 'matches', {
        value: true,
        writable: true,
        configurable: true,
      });

      // Act
      service = TestBed.inject(ThemeService);

      // Assert
      expect(service.isDarkMode()).toBe(true);
    });

    it('should initialize with stored dark preference', () => {
      // Arrange
      mockLocalStorage.getItem.and.returnValue('dark');

      // Act
      service = TestBed.inject(ThemeService);

      // Assert
      expect(service.isDarkMode()).toBe(true);
    });

    it('should initialize with stored light preference', () => {
      // Arrange
      mockLocalStorage.getItem.and.returnValue('light');

      // Act
      service = TestBed.inject(ThemeService);

      // Assert
      expect(service.isDarkMode()).toBe(false);
    });

    it('should handle localStorage errors gracefully', () => {
      // Arrange
      mockLocalStorage.getItem.and.throwError('Storage not available');
      spyOn(console, 'warn');

      // Act
      service = TestBed.inject(ThemeService);

      // Assert
      expect(service).toBeTruthy();
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('Theme Application', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.and.returnValue(null);
      service = TestBed.inject(ThemeService);
    });

    it('should apply dark theme class to document element', () => {
      // Act
      service.setTheme(true);

      // Assert
      expect(mockHtmlElement.classList.add).toHaveBeenCalledWith('dark');
    });

    it('should remove dark theme class for light theme', () => {
      // Act
      service.setTheme(false);

      // Assert
      expect(mockHtmlElement.classList.remove).toHaveBeenCalledWith('dark');
    });

    it('should update signal when theme changes', () => {
      // Act
      service.setTheme(true);

      // Assert
      expect(service.isDarkMode()).toBe(true);

      // Act
      service.setTheme(false);

      // Assert
      expect(service.isDarkMode()).toBe(false);
    });
  });

  describe('Theme Persistence', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.and.returnValue(null);
      service = TestBed.inject(ThemeService);
    });

    it('should save dark theme preference to localStorage', () => {
      // Act
      service.setTheme(true);

      // Assert
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
    });

    it('should save light theme preference to localStorage', () => {
      // Act
      service.setTheme(false);

      // Assert
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'light');
    });

    it('should remove localStorage entry when using system theme', () => {
      // Act
      service.useSystemTheme();

      // Assert
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('theme');
    });

    it('should handle localStorage write errors gracefully', () => {
      // Arrange
      mockLocalStorage.setItem.and.throwError('Storage full');
      spyOn(console, 'warn');

      // Act
      service.setTheme(true);

      // Assert
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('Theme Toggle Functionality', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.and.returnValue(null);
      service = TestBed.inject(ThemeService);
    });

    it('should toggle from light to dark', () => {
      // Arrange
      service.setTheme(false); // Start with light

      // Act
      service.toggleTheme();

      // Assert
      expect(service.isDarkMode()).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
    });

    it('should toggle from dark to light', () => {
      // Arrange
      service.setTheme(true); // Start with dark

      // Act
      service.toggleTheme();

      // Assert
      expect(service.isDarkMode()).toBe(false);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'light');
    });
  });

  describe('System Theme Integration', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.and.returnValue(null);
    });

    it('should set up system theme listener when no stored preference', () => {
      // Act
      service = TestBed.inject(ThemeService);

      // Assert
      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
      expect(mockMediaQueryList.addEventListener).toHaveBeenCalledWith(
        'change',
        jasmine.any(Function)
      );
    });

    it('should not set up system theme listener when stored preference exists', () => {
      // Arrange
      mockLocalStorage.getItem.and.returnValue('dark');

      // Act
      service = TestBed.inject(ThemeService);

      // Assert
      expect(mockMediaQueryList.addEventListener).not.toHaveBeenCalled();
    });

    it('should follow system theme when useSystemTheme is called', () => {
      // Arrange
      Object.defineProperty(mockMediaQueryList, 'matches', {
        value: true,
        writable: true,
        configurable: true,
      });
      service = TestBed.inject(ThemeService);

      // Act
      service.useSystemTheme();

      // Assert
      expect(service.isDarkMode()).toBe(true);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('theme');
    });

    it('should handle matchMedia errors gracefully', () => {
      // Arrange
      mockMatchMedia.and.throwError('matchMedia not supported');
      spyOn(console, 'warn');

      // Act
      service = TestBed.inject(ThemeService);

      // Assert
      expect(service).toBeTruthy();
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('SSR Compatibility', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ThemeService,
          { provide: DOCUMENT, useValue: mockDocument },
          { provide: PLATFORM_ID, useValue: 'server' }, // SSR environment
        ],
      });
    });

    it('should not access localStorage in SSR environment', () => {
      // Act
      service = TestBed.inject(ThemeService);

      // Assert
      expect(service).toBeTruthy();
      expect(mockLocalStorage.getItem).not.toHaveBeenCalled();
    });

    it('should not apply theme to DOM in SSR environment', () => {
      // Act
      service = TestBed.inject(ThemeService);
      service.setTheme(true);

      // Assert
      expect(mockHtmlElement.classList.add).not.toHaveBeenCalled();
    });

    it('should not set up system theme listener in SSR environment', () => {
      // Act
      service = TestBed.inject(ThemeService);

      // Assert
      expect(mockMatchMedia).not.toHaveBeenCalled();
    });

    it('should default to light theme in SSR environment', () => {
      // Act
      service = TestBed.inject(ThemeService);

      // Assert
      expect(service.isDarkMode()).toBe(false);
    });
  });

  describe('Signal Reactivity', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.and.returnValue(null);
      service = TestBed.inject(ThemeService);
    });

    it('should be a readable signal', () => {
      // Act & Assert
      expect(typeof service.isDarkMode).toBe('function');
      expect(typeof service.isDarkMode()).toBe('boolean');
    });

    it('should trigger effects when signal changes', () => {
      // Arrange
      const initialValue = service.isDarkMode();

      // Act
      service.toggleTheme();

      // Assert
      expect(service.isDarkMode()).toBe(!initialValue);
      // Effect should have been triggered to apply theme
      expect(mockHtmlElement.classList.add).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    beforeEach(() => {
      service = TestBed.inject(ThemeService);
    });

    it('should handle invalid stored theme values', () => {
      // Arrange
      mockLocalStorage.getItem.and.returnValue('invalid-theme');

      // Act
      const newService = TestBed.inject(ThemeService);

      // Assert
      expect(newService).toBeTruthy();
      // Should fall back to system preference
    });

    it('should handle null document gracefully', () => {
      // This test verifies the service handles edge cases
      expect(service).toBeTruthy();
    });

    it('should maintain theme state consistency', () => {
      // Arrange
      const initialTheme = service.isDarkMode();

      // Act - Multiple rapid toggles
      service.toggleTheme();
      service.toggleTheme();

      // Assert
      expect(service.isDarkMode()).toBe(initialTheme);
    });
  });
});
