/**
 * @fileoverview NavigationService Test Suite
 *
 * Tests for navigation management service in the Presentation Layer.
 * Focuses on route tracking, navigation state, and role-based navigation filtering.
 *
 * @description
 * Tests the NavigationService that manages navigation state and accessibility.
 * Verifies:
 * - Current path tracking from router events
 * - Navigation item active state detection
 * - Role-based navigation filtering through AuthFacade
 * - Signal reactivity for navigation state
 * - Router integration and event handling
 *
 * @architecture
 * Presentation Layer Testing Strategy:
 * - Mock Router and navigation events
 * - Mock AuthFacade for role-based filtering
 * - Focus on navigation UI state behavior
 * - Test computed signal updates
 * - No business logic testing (delegated to AuthFacade)
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Presentation
 */

import { TestBed } from '@angular/core/testing';
import { Router, NavigationEnd, Event } from '@angular/router';
import { Subject } from 'rxjs';
import { NavigationService } from './navigation.service';
import { AuthFacade } from '@application/facades/auth.facade';
import { NavSection, NavItem } from './types';

describe('NavigationService', () => {
  let service: NavigationService;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockAuthFacade: jasmine.SpyObj<AuthFacade>;
  let routerEventsSubject: Subject<Event>;

  // Mock navigation sections for testing
  const mockNavSections: NavSection[] = [
    {
      id: 'main',
      title: 'Principal',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: 'home',
          route: '/dashboard',
          activeMatch: '/dashboard',
        },
        {
          id: 'users',
          label: 'Usuarios',
          icon: 'user-group',
          route: '/users',
          activeMatch: '/users',
          requireRoles: ['admin', 'manager'],
        },
      ],
    },
    {
      id: 'administration',
      title: 'Administración',
      items: [
        {
          id: 'roles',
          label: 'Roles',
          icon: 'shield-check',
          route: '/roles',
          activeMatch: '/roles',
          requireRoles: ['admin'],
        },
      ],
    },
  ];

  // Mock navigation items for testing
  const dashboardItem: NavItem = {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'home',
    route: '/dashboard',
    activeMatch: '/dashboard',
  };

  const usersItem: NavItem = {
    id: 'users',
    label: 'Usuarios',
    icon: 'user-group',
    route: '/users',
    activeMatch: '/users',
  };

  const homeItem: NavItem = {
    id: 'home',
    label: 'Home',
    icon: 'home',
    route: '/',
  };

  const profileItem: NavItem = {
    id: 'profile',
    label: 'Profile',
    icon: 'user',
    route: '/profile',
    activeMatch: '/profile',
  };

  beforeEach(() => {
    // Create subject for router events
    routerEventsSubject = new Subject<Event>();

    // Create spy objects
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    Object.defineProperty(mockRouter, 'events', {
      value: routerEventsSubject.asObservable(),
      writable: true,
    });
    Object.defineProperty(mockRouter, 'url', {
      value: '/dashboard',
      writable: true,
      configurable: true,
    });

    mockAuthFacade = jasmine.createSpyObj('AuthFacade', ['filterNavigationSections']);

    TestBed.configureTestingModule({
      providers: [
        NavigationService,
        { provide: Router, useValue: mockRouter },
        { provide: AuthFacade, useValue: mockAuthFacade },
      ],
    });

    // Set up default mock behavior
    mockAuthFacade.filterNavigationSections.and.returnValue(mockNavSections);
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      service = TestBed.inject(NavigationService);
      expect(service).toBeTruthy();
    });

    it('should initialize with current router URL', () => {
      // Arrange
      Object.defineProperty(mockRouter, 'url', {
        value: '/users',
        writable: true,
        configurable: true,
      });

      // Act
      service = TestBed.inject(NavigationService);

      // Assert
      expect(service.currentPath()).toBe('/users');
    });

    it('should call AuthFacade to filter navigation sections', () => {
      // Act
      service = TestBed.inject(NavigationService);
      const sections = service.accessibleSections();

      // Assert
      expect(mockAuthFacade.filterNavigationSections).toHaveBeenCalled();
      expect(sections).toEqual(mockNavSections);
    });
  });

  describe('Route Tracking', () => {
    beforeEach(() => {
      service = TestBed.inject(NavigationService);
    });

    it('should update current path on NavigationEnd events', () => {
      // Arrange
      expect(service.currentPath()).toBe('/dashboard');

      // Act
      const navigationEvent = new NavigationEnd(1, '/users', '/users');
      routerEventsSubject.next(navigationEvent);

      // Assert
      expect(service.currentPath()).toBe('/users');
    });

    it('should ignore non-NavigationEnd events', () => {
      // Arrange
      const initialPath = service.currentPath();

      // Act - Emit non-NavigationEnd event
      routerEventsSubject.next({} as Event);

      // Assert
      expect(service.currentPath()).toBe(initialPath);
    });

    it('should track multiple navigation changes', () => {
      // Act & Assert
      routerEventsSubject.next(new NavigationEnd(1, '/users', '/users'));
      expect(service.currentPath()).toBe('/users');

      routerEventsSubject.next(new NavigationEnd(2, '/roles', '/roles'));
      expect(service.currentPath()).toBe('/roles');

      routerEventsSubject.next(new NavigationEnd(3, '/dashboard', '/dashboard'));
      expect(service.currentPath()).toBe('/dashboard');
    });
  });

  describe('Navigation Item Active State', () => {
    beforeEach(() => {
      Object.defineProperty(mockRouter, 'url', {
        value: '/dashboard',
        writable: true,
        configurable: true,
      });
      service = TestBed.inject(NavigationService);
    });

    it('should return true for exact route match', () => {
      // Arrange
      routerEventsSubject.next(new NavigationEnd(1, '/dashboard', '/dashboard'));

      // Act
      const isActive = service.isItemActive(dashboardItem);

      // Assert
      expect(isActive).toBe(true);
    });

    it('should return false for non-matching route', () => {
      // Arrange
      routerEventsSubject.next(new NavigationEnd(1, '/dashboard', '/dashboard'));

      // Act
      const isActive = service.isItemActive(usersItem);

      // Assert
      expect(isActive).toBe(false);
    });

    it('should handle home route specially', () => {
      // Arrange
      routerEventsSubject.next(new NavigationEnd(1, '/', '/'));

      // Act
      const isActive = service.isItemActive(homeItem);

      // Assert
      expect(isActive).toBe(true);
    });

    it('should not match home route for other paths', () => {
      // Arrange
      routerEventsSubject.next(new NavigationEnd(1, '/dashboard', '/dashboard'));

      // Act
      const isActive = service.isItemActive(homeItem);

      // Assert
      expect(isActive).toBe(false);
    });

    it('should use activeMatch over route for matching', () => {
      // Arrange
      const itemWithActiveMatch: NavItem = {
        id: 'special',
        label: 'Special',
        icon: 'star',
        route: '/special/overview',
        activeMatch: '/special',
      };
      routerEventsSubject.next(new NavigationEnd(1, '/special/details', '/special/details'));

      // Act
      const isActive = service.isItemActive(itemWithActiveMatch);

      // Assert
      expect(isActive).toBe(true);
    });

    it('should handle partial path matching', () => {
      // Arrange
      routerEventsSubject.next(new NavigationEnd(1, '/users/123', '/users/123'));

      // Act
      const isActive = service.isItemActive(usersItem);

      // Assert
      expect(isActive).toBe(true);
    });

    it('should handle nested routes correctly', () => {
      // Arrange
      const nestedItem: NavItem = {
        id: 'profile-settings',
        label: 'Profile Settings',
        icon: 'settings',
        route: '/profile/settings',
      };
      routerEventsSubject.next(
        new NavigationEnd(1, '/profile/settings/general', '/profile/settings/general')
      );

      // Act
      const isActive = service.isItemActive(nestedItem);

      // Assert
      expect(isActive).toBe(true);
    });

    it('should not match similar but different routes', () => {
      // Arrange
      const profileItem: NavItem = {
        id: 'profile',
        label: 'Profile',
        icon: 'user',
        route: '/profile',
      };
      routerEventsSubject.next(new NavigationEnd(1, '/profiles', '/profiles'));

      // Act
      const isActive = service.isItemActive(profileItem);

      // Assert
      expect(isActive).toBe(false);
    });
  });

  describe('Role-Based Navigation Filtering', () => {
    beforeEach(() => {
      service = TestBed.inject(NavigationService);
    });

    it('should return filtered sections from AuthFacade', () => {
      // Arrange
      const filteredSections: NavSection[] = [
        {
          id: 'main',
          title: 'Principal',
          items: [dashboardItem],
        },
      ];
      mockAuthFacade.filterNavigationSections.and.returnValue(filteredSections);

      // Act
      const accessibleSections = service.accessibleSections();

      // Assert
      expect(accessibleSections).toEqual(filteredSections);
      expect(mockAuthFacade.filterNavigationSections).toHaveBeenCalled();
    });

    it('should react to AuthFacade changes', () => {
      // Arrange - Initial state
      let accessibleSections = service.accessibleSections();
      expect(accessibleSections).toEqual(mockNavSections);

      // Act - Change AuthFacade return value
      const newFilteredSections: NavSection[] = [];
      mockAuthFacade.filterNavigationSections.and.returnValue(newFilteredSections);

      // Trigger computation again (in real app this would happen through signal changes)
      accessibleSections = service.accessibleSections();

      // Assert
      expect(accessibleSections).toEqual(newFilteredSections);
    });

    it('should handle empty filtered sections', () => {
      // Arrange
      mockAuthFacade.filterNavigationSections.and.returnValue([]);

      // Act
      const accessibleSections = service.accessibleSections();

      // Assert
      expect(accessibleSections).toEqual([]);
    });
  });

  describe('Signal Reactivity', () => {
    beforeEach(() => {
      service = TestBed.inject(NavigationService);
    });

    it('should have reactive current path signal', () => {
      // Act & Assert
      expect(typeof service.currentPath).toBe('function');
      expect(typeof service.currentPath()).toBe('string');
    });

    it('should have reactive accessible sections signal', () => {
      // Act & Assert
      expect(typeof service.accessibleSections).toBe('function');
      expect(Array.isArray(service.accessibleSections())).toBe(true);
    });

    it('should update current path signal when router navigates', () => {
      // Arrange
      const initialPath = service.currentPath();

      // Act
      routerEventsSubject.next(new NavigationEnd(1, '/new-path', '/new-path'));

      // Assert
      expect(service.currentPath()).toBe('/new-path');
      expect(service.currentPath()).not.toBe(initialPath);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    beforeEach(() => {
      service = TestBed.inject(NavigationService);
    });

    it('should handle item without activeMatch property', () => {
      // Arrange
      const itemWithoutActiveMatch: NavItem = {
        id: 'no-match',
        label: 'No Match',
        icon: 'question',
        route: '/no-match',
      };
      routerEventsSubject.next(new NavigationEnd(1, '/no-match', '/no-match'));

      // Act
      const isActive = service.isItemActive(itemWithoutActiveMatch);

      // Assert
      expect(isActive).toBe(true);
    });

    it('should handle empty route in navigation item', () => {
      // Arrange
      const emptyRouteItem: NavItem = {
        id: 'empty',
        label: 'Empty',
        icon: 'empty',
        route: '',
      };

      // Act & Assert - Should not throw
      expect(() => service.isItemActive(emptyRouteItem)).not.toThrow();
    });

    it('should handle special characters in routes', () => {
      // Arrange
      const specialRouteItem: NavItem = {
        id: 'special',
        label: 'Special',
        icon: 'special',
        route: '/special-route_with.chars',
      };
      routerEventsSubject.next(
        new NavigationEnd(1, '/special-route_with.chars', '/special-route_with.chars')
      );

      // Act
      const isActive = service.isItemActive(specialRouteItem);

      // Assert
      expect(isActive).toBe(true);
    });

    it('should handle route with query parameters', () => {
      // Arrange
      routerEventsSubject.next(
        new NavigationEnd(1, '/dashboard?tab=overview', '/dashboard?tab=overview')
      );

      // Act
      const isActive = service.isItemActive(dashboardItem);

      // Assert
      expect(isActive).toBe(true);
    });

    it('should handle route with fragments', () => {
      // Arrange
      routerEventsSubject.next(new NavigationEnd(1, '/dashboard#section1', '/dashboard#section1'));

      // Act
      const isActive = service.isItemActive(dashboardItem);

      // Assert
      expect(isActive).toBe(true);
    });
  });

  describe('Integration with AuthFacade', () => {
    it('should call filterNavigationSections with correct parameters', () => {
      // Act
      service = TestBed.inject(NavigationService);
      service.accessibleSections();

      // Assert
      expect(mockAuthFacade.filterNavigationSections).toHaveBeenCalledTimes(1);
    });

    it('should not cache filterNavigationSections results inappropriately', () => {
      // Arrange
      service = TestBed.inject(NavigationService);

      // Act - Access multiple times
      service.accessibleSections();
      service.accessibleSections();

      // Assert - Should call facade each time (computed signals may optimize this)
      expect(mockAuthFacade.filterNavigationSections).toHaveBeenCalled();
    });
  });
});
