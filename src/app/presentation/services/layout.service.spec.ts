/**
 * @fileoverview LayoutService Test Suite
 *
 * Tests for layout management service in the Presentation Layer.
 * Focuses on UI state management for sidebar, mobile drawer, and responsive behavior.
 *
 * @description
 * Tests the LayoutService that manages layout state across the application.
 * Verifies:
 * - Sidebar collapse/expand functionality
 * - Mobile drawer behavior
 * - Responsive breakpoint handling
 * - Navigation item hover states
 * - Section expand/collapse functionality
 * - LocalStorage persistence
 * - Window resize handling
 * - SSR compatibility
 *
 * @architecture
 * Presentation Layer Testing Strategy:
 * - Mock browser APIs (localStorage, window, document)
 * - Mock Angular platform detection
 * - Focus on UI state management behavior
 * - Test signal reactivity and computed values
 * - Test effect execution for persistence
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Presentation
 */

import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { LayoutService } from './layout.service';

describe('LayoutService', () => {
  let service: LayoutService;
  let mockDocument: jasmine.SpyObj<Document>;
  let mockLocalStorage: jasmine.SpyObj<Storage>;
  let mockWindow: any;

  beforeEach(() => {
    // Create mock objects
    mockDocument = jasmine.createSpyObj('Document', ['createElement']);
    mockLocalStorage = jasmine.createSpyObj('Storage', ['getItem', 'setItem', 'removeItem']);

    // Mock window object
    mockWindow = {
      innerWidth: 1024,
      addEventListener: jasmine.createSpy('addEventListener'),
      removeEventListener: jasmine.createSpy('removeEventListener'),
    };

    // Mock global window and localStorage
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      configurable: true,
    });

    Object.defineProperty(window, 'innerWidth', {
      get: () => mockWindow.innerWidth,
      configurable: true,
    });

    // Reset spies
    mockLocalStorage.getItem.calls.reset();
    mockLocalStorage.setItem.calls.reset();
    mockWindow.addEventListener.calls.reset();
  });

  describe('Service Initialization - Browser Environment', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          LayoutService,
          { provide: DOCUMENT, useValue: mockDocument },
          { provide: PLATFORM_ID, useValue: 'browser' },
        ],
      });
    });

    it('should be created', () => {
      service = TestBed.inject(LayoutService);
      expect(service).toBeTruthy();
    });

    it('should initialize with default values', () => {
      // Arrange
      mockLocalStorage.getItem.and.returnValue(null);

      // Act
      service = TestBed.inject(LayoutService);

      // Assert
      expect(service.sidebarCollapsed()).toBe(false);
      expect(service.mobileDrawerOpen()).toBe(false);
      expect(service.hoveredItemId()).toBe(null);
      expect(service.expandedSectionIds().size).toBe(0);
    });

    it('should initialize sidebar state from localStorage', () => {
      // Arrange
      mockLocalStorage.getItem.and.returnValue('true');

      // Act
      service = TestBed.inject(LayoutService);

      // Assert
      expect(service.sidebarCollapsed()).toBe(true);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('layout.sidebar.collapsed');
    });

    it('should set up window resize listener', () => {
      // Act
      service = TestBed.inject(LayoutService);

      // Assert
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('resize', jasmine.any(Function));
    });

    it('should handle localStorage read errors gracefully', () => {
      // Arrange
      mockLocalStorage.getItem.and.throwError('Storage not available');
      spyOn(console, 'warn');

      // Act
      service = TestBed.inject(LayoutService);

      // Assert
      expect(service).toBeTruthy();
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('Service Initialization - SSR Environment', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          LayoutService,
          { provide: DOCUMENT, useValue: mockDocument },
          { provide: PLATFORM_ID, useValue: 'server' },
        ],
      });
    });

    it('should not access localStorage in SSR', () => {
      // Act
      service = TestBed.inject(LayoutService);

      // Assert
      expect(service).toBeTruthy();
      expect(mockLocalStorage.getItem).not.toHaveBeenCalled();
    });

    it('should not set up window resize listener in SSR', () => {
      // Act
      service = TestBed.inject(LayoutService);

      // Assert
      expect(mockWindow.addEventListener).not.toHaveBeenCalled();
    });
  });

  describe('Sidebar Management', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          LayoutService,
          { provide: DOCUMENT, useValue: mockDocument },
          { provide: PLATFORM_ID, useValue: 'browser' },
        ],
      });
      mockLocalStorage.getItem.and.returnValue(null);
      service = TestBed.inject(LayoutService);
    });

    it('should toggle sidebar collapsed state', () => {
      // Arrange
      expect(service.sidebarCollapsed()).toBe(false);

      // Act
      service.toggleSidebarCollapsed();

      // Assert
      expect(service.sidebarCollapsed()).toBe(true);
    });

    it('should set sidebar collapsed state directly', () => {
      // Act
      service.setSidebarCollapsed(true);

      // Assert
      expect(service.sidebarCollapsed()).toBe(true);

      // Act
      service.setSidebarCollapsed(false);

      // Assert
      expect(service.sidebarCollapsed()).toBe(false);
    });

    it('should persist sidebar state to localStorage', () => {
      // Act
      service.setSidebarCollapsed(true);

      // Assert
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('layout.sidebar.collapsed', 'true');
    });

    it('should handle localStorage write errors gracefully', () => {
      // Arrange
      mockLocalStorage.setItem.and.throwError('Storage full');
      spyOn(console, 'warn');

      // Act
      service.setSidebarCollapsed(true);

      // Assert
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('Mobile Drawer Management', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          LayoutService,
          { provide: DOCUMENT, useValue: mockDocument },
          { provide: PLATFORM_ID, useValue: 'browser' },
        ],
      });
      service = TestBed.inject(LayoutService);
    });

    it('should open mobile drawer', () => {
      // Act
      service.openMobileDrawer();

      // Assert
      expect(service.mobileDrawerOpen()).toBe(true);
    });

    it('should close mobile drawer', () => {
      // Arrange
      service.openMobileDrawer();
      expect(service.mobileDrawerOpen()).toBe(true);

      // Act
      service.closeMobileDrawer();

      // Assert
      expect(service.mobileDrawerOpen()).toBe(false);
    });
  });

  describe('Responsive Behavior', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          LayoutService,
          { provide: DOCUMENT, useValue: mockDocument },
          { provide: PLATFORM_ID, useValue: 'browser' },
        ],
      });
    });

    it('should detect mobile viewport correctly', () => {
      // Arrange - Mobile width
      mockWindow.innerWidth = 767;
      service = TestBed.inject(LayoutService);

      // Assert
      expect(service.isMobile()).toBe(true);
    });

    it('should detect desktop viewport correctly', () => {
      // Arrange - Desktop width
      mockWindow.innerWidth = 1024;
      service = TestBed.inject(LayoutService);

      // Assert
      expect(service.isMobile()).toBe(false);
    });

    it('should auto-close mobile drawer when switching to desktop', () => {
      // Arrange - Start in mobile view with drawer open
      mockWindow.innerWidth = 767;
      service = TestBed.inject(LayoutService);
      service.openMobileDrawer();
      expect(service.mobileDrawerOpen()).toBe(true);

      // Act - Simulate resize to desktop
      mockWindow.innerWidth = 1024;
      // Trigger width update manually since we can't simulate actual resize event
      (service as any)._windowWidth.set(1024);

      // Assert
      expect(service.mobileDrawerOpen()).toBe(false);
    });
  });

  describe('Navigation Item Hover Management', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          LayoutService,
          { provide: DOCUMENT, useValue: mockDocument },
          { provide: PLATFORM_ID, useValue: 'browser' },
        ],
      });
      service = TestBed.inject(LayoutService);
    });

    it('should set hovered item ID', () => {
      // Act
      service.setHoveredItem('item-1');

      // Assert
      expect(service.hoveredItemId()).toBe('item-1');
    });

    it('should clear hovered item ID', () => {
      // Arrange
      service.setHoveredItem('item-1');
      expect(service.hoveredItemId()).toBe('item-1');

      // Act
      service.setHoveredItem(null);

      // Assert
      expect(service.hoveredItemId()).toBe(null);
    });
  });

  describe('Section Expand/Collapse Management', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          LayoutService,
          { provide: DOCUMENT, useValue: mockDocument },
          { provide: PLATFORM_ID, useValue: 'browser' },
        ],
      });
      service = TestBed.inject(LayoutService);
    });

    it('should expand section when toggled first time', () => {
      // Act
      service.toggleSection('section-1');

      // Assert
      expect(service.expandedSectionIds().has('section-1')).toBe(true);
    });

    it('should collapse section when toggled second time', () => {
      // Arrange
      service.toggleSection('section-1');
      expect(service.expandedSectionIds().has('section-1')).toBe(true);

      // Act
      service.toggleSection('section-1');

      // Assert
      expect(service.expandedSectionIds().has('section-1')).toBe(false);
    });

    it('should manage multiple sections independently', () => {
      // Act
      service.toggleSection('section-1');
      service.toggleSection('section-2');

      // Assert
      expect(service.expandedSectionIds().has('section-1')).toBe(true);
      expect(service.expandedSectionIds().has('section-2')).toBe(true);

      // Act
      service.toggleSection('section-1');

      // Assert
      expect(service.expandedSectionIds().has('section-1')).toBe(false);
      expect(service.expandedSectionIds().has('section-2')).toBe(true);
    });
  });

  describe('Navigation Helpers', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          LayoutService,
          { provide: DOCUMENT, useValue: mockDocument },
          { provide: PLATFORM_ID, useValue: 'browser' },
        ],
      });
    });

    it('should close mobile drawer on navigation in mobile view', () => {
      // Arrange - Mobile viewport
      mockWindow.innerWidth = 767;
      service = TestBed.inject(LayoutService);
      service.openMobileDrawer();
      expect(service.mobileDrawerOpen()).toBe(true);

      // Act
      service.onNavigate();

      // Assert
      expect(service.mobileDrawerOpen()).toBe(false);
    });

    it('should not affect drawer on navigation in desktop view', () => {
      // Arrange - Desktop viewport
      mockWindow.innerWidth = 1024;
      service = TestBed.inject(LayoutService);
      service.openMobileDrawer(); // This shouldn't be possible in desktop, but testing edge case

      // Act
      service.onNavigate();

      // Assert - In desktop, isMobile() returns false, so drawer shouldn't be closed
      expect(service.mobileDrawerOpen()).toBe(true);
    });

    it('should clear hovered item on navigation', () => {
      // Arrange
      service = TestBed.inject(LayoutService);
      service.setHoveredItem('item-1');
      expect(service.hoveredItemId()).toBe('item-1');

      // Act
      service.onNavigate();

      // Assert
      expect(service.hoveredItemId()).toBe(null);
    });
  });

  describe('Signal Reactivity', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          LayoutService,
          { provide: DOCUMENT, useValue: mockDocument },
          { provide: PLATFORM_ID, useValue: 'browser' },
        ],
      });
      service = TestBed.inject(LayoutService);
    });

    it('should have reactive computed signals', () => {
      // Act & Assert
      expect(typeof service.sidebarCollapsed).toBe('function');
      expect(typeof service.mobileDrawerOpen).toBe('function');
      expect(typeof service.hoveredItemId).toBe('function');
      expect(typeof service.expandedSectionIds).toBe('function');
      expect(typeof service.isMobile).toBe('function');
    });

    it('should update computed values when signals change', () => {
      // Arrange
      const initialCollapsed = service.sidebarCollapsed();

      // Act
      service.toggleSidebarCollapsed();

      // Assert
      expect(service.sidebarCollapsed()).toBe(!initialCollapsed);
    });

    it('should maintain state consistency across multiple changes', () => {
      // Act - Multiple operations
      service.setSidebarCollapsed(true);
      service.openMobileDrawer();
      service.setHoveredItem('item-1');
      service.toggleSection('section-1');

      // Assert
      expect(service.sidebarCollapsed()).toBe(true);
      expect(service.mobileDrawerOpen()).toBe(true);
      expect(service.hoveredItemId()).toBe('item-1');
      expect(service.expandedSectionIds().has('section-1')).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          LayoutService,
          { provide: DOCUMENT, useValue: mockDocument },
          { provide: PLATFORM_ID, useValue: 'browser' },
        ],
      });
    });

    it('should handle invalid localStorage data gracefully', () => {
      // Arrange
      mockLocalStorage.getItem.and.returnValue('invalid-json');
      spyOn(console, 'warn');

      // Act
      service = TestBed.inject(LayoutService);

      // Assert
      expect(service).toBeTruthy();
      expect(console.warn).toHaveBeenCalled();
    });

    it('should handle same section toggle repeatedly', () => {
      // Arrange
      service = TestBed.inject(LayoutService);

      // Act - Toggle same section multiple times
      service.toggleSection('section-1');
      service.toggleSection('section-1');
      service.toggleSection('section-1');

      // Assert
      expect(service.expandedSectionIds().has('section-1')).toBe(true);
    });

    it('should handle null/undefined section IDs gracefully', () => {
      // Arrange
      service = TestBed.inject(LayoutService);

      // Act & Assert - Should not throw errors
      expect(() => service.toggleSection('')).not.toThrow();
      expect(() => service.setHoveredItem('')).not.toThrow();
    });
  });
});
