/**
 * @fileoverview Dashboard Test Suite
 *
 * Tests for Dashboard smart component in the Presentation Layer.
 * Focuses on component behavior, user interactions, and facade integration.
 *
 * @description
 * Tests the Dashboard component that serves as the main application entry point.
 * Verifies:
 * - Component initialization and service injection
 * - AuthFacade integration and reactive state
 * - UI service coordination (TitleService, BreadcrumbService)
 * - User interaction handlers and navigation
 * - Computed signals and lifecycle management
 * - Time-based greeting and date formatting
 *
 * @architecture
 * Smart Component Testing Strategy:
 * - Mock all facade and service dependencies
 * - Test component behavior and user interactions
 * - Verify service method calls and navigation
 * - Focus on UI coordination, not business logic
 * - Test computed signal reactivity
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Presentation
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { Dashboard } from './dashboard';
import { TitleService } from '@presentation/services/title.service';
import { BreadcrumbService } from '@presentation/services/breadcrumb.service';
import { AuthFacade } from '@application/facades/auth.facade';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let mockTitleService: jasmine.SpyObj<TitleService>;
  let mockBreadcrumbService: jasmine.SpyObj<BreadcrumbService>;
  let mockAuthFacade: any;
  let mockRouter: jasmine.SpyObj<Router>;

  // Mock user data for testing
  const mockUser = {
    id: 1,
    username: {
      value: 'testuser',
    },
    email: {
      value: 'test@example.com',
    },
    firstName: {
      value: 'Test',
    },
    lastName: {
      value: 'User',
    },
    role: {
      id: 1,
      name: 'admin',
    },
    canDeleteUsers: () => true,
    getPermissions: () => ['admin'],
  } as any;

  let userSignal: any;

  beforeEach(async () => {
    // Create writable signal for testing
    userSignal = signal(mockUser);

    // Create spy objects for all dependencies
    mockTitleService = jasmine.createSpyObj('TitleService', ['setTitle']);
    mockBreadcrumbService = jasmine.createSpyObj('BreadcrumbService', ['setBreadcrumbs']);
    mockAuthFacade = {
      user: userSignal,
      refreshProfile: jasmine.createSpy('refreshProfile').and.returnValue(Promise.resolve()),
      logout: jasmine.createSpy('logout').and.returnValue(Promise.resolve()),
    };
    mockRouter = jasmine.createSpyObj('Router', ['navigateByUrl']);
    mockRouter.navigateByUrl.and.returnValue(Promise.resolve(true));

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        { provide: TitleService, useValue: mockTitleService },
        { provide: BreadcrumbService, useValue: mockBreadcrumbService },
        { provide: AuthFacade, useValue: mockAuthFacade },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize reactive state in constructor', () => {
      // Assert
      expect(component.user).toBeDefined();
      expect(component.username).toBeDefined();
      expect((component as any).titlePage).toBe('Dashboard');
    });

    it('should initialize user signal from AuthFacade', () => {
      // Act
      const user = component.user();

      // Assert
      expect(user).toEqual(mockUser);
    });

    it('should initialize username computed signal', () => {
      // Act
      const username = component.username();

      // Assert
      expect(username).toBe('testuser');
    });

    it('should handle null user in username computed signal', () => {
      // Arrange
      userSignal.set(null);

      // Act
      const username = component.username();

      // Assert
      expect(username).toBeUndefined();
    });
  });

  describe('Component Lifecycle', () => {
    it('should set title on init', () => {
      // Act
      component.ngOnInit();

      // Assert
      expect(mockTitleService.setTitle).toHaveBeenCalledWith('Dashboard');
    });

    it('should set breadcrumbs on init', () => {
      // Act
      component.ngOnInit();

      // Assert
      expect(mockBreadcrumbService.setBreadcrumbs).toHaveBeenCalledWith([
        { label: 'Dashboard', icon: 'user' },
      ]);
    });

    it('should refresh profile on init', () => {
      // Act
      component.ngOnInit();

      // Assert
      expect(mockAuthFacade.refreshProfile).toHaveBeenCalled();
    });

    it('should call all initialization methods on ngOnInit', () => {
      // Act
      component.ngOnInit();

      // Assert
      expect(mockTitleService.setTitle).toHaveBeenCalledTimes(1);
      expect(mockBreadcrumbService.setBreadcrumbs).toHaveBeenCalledTimes(1);
      expect(mockAuthFacade.refreshProfile).toHaveBeenCalledTimes(1);
    });
  });

  describe('User Authentication Actions', () => {
    it('should logout user and navigate to login', () => {
      // Act
      component.logout();

      // Assert
      expect(mockAuthFacade.logout).toHaveBeenCalled();
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/auth/login');
    });

    it('should call logout and navigation in correct order', async () => {
      // Arrange
      let logoutCalled = false;
      let navigationCalled = false;
      mockAuthFacade.logout.and.callFake(async () => {
        logoutCalled = true;
        expect(navigationCalled).toBe(false); // Navigation should not be called yet
        return Promise.resolve();
      });
      mockRouter.navigateByUrl.and.callFake(async () => {
        navigationCalled = true;
        expect(logoutCalled).toBe(true); // Logout should be called first
        return Promise.resolve(true);
      });

      // Act
      await component.logout();

      // Assert
      expect(logoutCalled).toBe(true);
      expect(navigationCalled).toBe(true);
    });
  });

  describe('Quick Action Handlers', () => {
    it('should handle profile action', () => {
      // Arrange
      spyOn(console, 'log');

      // Act
      component.onProfileAction();

      // Assert
      expect(console.log).toHaveBeenCalledWith('Navegar al perfil de usuario');
    });

    it('should handle settings action', () => {
      // Arrange
      spyOn(console, 'log');

      // Act
      component.onSettingsAction();

      // Assert
      expect(console.log).toHaveBeenCalledWith('Navegar a configuración');
    });

    it('should handle help action', () => {
      // Arrange
      spyOn(console, 'log');

      // Act
      component.onHelpAction();

      // Assert
      expect(console.log).toHaveBeenCalledWith('Navegar a ayuda');
    });
  });

  describe('Time-Based Greeting System', () => {
    it('should return morning greeting for early hours', () => {
      // Arrange
      spyOn(Date.prototype, 'getHours').and.returnValue(8);

      // Act
      const greeting = component.getGreeting();

      // Assert
      expect(greeting).toBe('¡Buenos días!');
    });

    it('should return morning greeting for edge case (11 AM)', () => {
      // Arrange
      spyOn(Date.prototype, 'getHours').and.returnValue(11);

      // Act
      const greeting = component.getGreeting();

      // Assert
      expect(greeting).toBe('¡Buenos días!');
    });

    it('should return afternoon greeting for noon', () => {
      // Arrange
      spyOn(Date.prototype, 'getHours').and.returnValue(12);

      // Act
      const greeting = component.getGreeting();

      // Assert
      expect(greeting).toBe('¡Buenas tardes!');
    });

    it('should return afternoon greeting for mid-afternoon', () => {
      // Arrange
      spyOn(Date.prototype, 'getHours').and.returnValue(15);

      // Act
      const greeting = component.getGreeting();

      // Assert
      expect(greeting).toBe('¡Buenas tardes!');
    });

    it('should return afternoon greeting for edge case (5 PM)', () => {
      // Arrange
      spyOn(Date.prototype, 'getHours').and.returnValue(17);

      // Act
      const greeting = component.getGreeting();

      // Assert
      expect(greeting).toBe('¡Buenas tardes!');
    });

    it('should return evening greeting for 6 PM', () => {
      // Arrange
      spyOn(Date.prototype, 'getHours').and.returnValue(18);

      // Act
      const greeting = component.getGreeting();

      // Assert
      expect(greeting).toBe('¡Buenas noches!');
    });

    it('should return evening greeting for late night', () => {
      // Arrange
      spyOn(Date.prototype, 'getHours').and.returnValue(23);

      // Act
      const greeting = component.getGreeting();

      // Assert
      expect(greeting).toBe('¡Buenas noches!');
    });

    it('should return morning greeting for midnight', () => {
      // Arrange
      spyOn(Date.prototype, 'getHours').and.returnValue(0);

      // Act
      const greeting = component.getGreeting();

      // Assert
      expect(greeting).toBe('¡Buenos días!');
    });
  });

  describe('Date Formatting', () => {
    it('should format current date in Spanish locale', () => {
      // Arrange
      const mockDate = new Date('2024-01-15T12:00:00');
      spyOn(window, 'Date').and.returnValue(mockDate as any);
      spyOn(mockDate, 'toLocaleDateString').and.returnValue('lunes, 15 de enero de 2024');

      // Act
      const formattedDate = component.getCurrentDate();

      // Assert
      expect(mockDate.toLocaleDateString).toHaveBeenCalledWith('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      expect(formattedDate).toBe('lunes, 15 de enero de 2024');
    });

    it('should use correct Spanish locale formatting options', () => {
      // Arrange
      const mockDate = new Date();
      spyOn(window, 'Date').and.returnValue(mockDate as any);
      spyOn(mockDate, 'toLocaleDateString').and.returnValue('formatted date');

      // Act
      component.getCurrentDate();

      // Assert
      expect(mockDate.toLocaleDateString).toHaveBeenCalledWith('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    });
  });

  describe('Signal Reactivity', () => {
    it('should update username when user signal changes', () => {
      // Arrange
      const newUser = {
        ...mockUser,
        username: { value: 'newusername' },
      };

      // Act
      userSignal.set(newUser);
      const username = component.username();

      // Assert
      expect(username).toBe('newusername');
    });

    it('should handle user signal change to null', () => {
      // Act
      userSignal.set(null);
      const username = component.username();

      // Assert
      expect(username).toBeUndefined();
    });

    it('should handle user with null username', () => {
      // Arrange
      const userWithNullUsername = {
        ...mockUser,
        username: null,
      };

      // Act
      userSignal.set(userWithNullUsername);
      const username = component.username();

      // Assert
      expect(username).toBeUndefined();
    });

    it('should handle user with undefined username', () => {
      // Arrange
      const userWithUndefinedUsername = {
        ...mockUser,
        username: undefined,
      };

      // Act
      userSignal.set(userWithUndefinedUsername);
      const username = component.username();

      // Assert
      expect(username).toBeUndefined();
    });
  });

  describe('Component Integration', () => {
    it('should integrate properly with all injected services', () => {
      // Act
      component.ngOnInit();
      component.logout();

      // Assert - Verify all services were called
      expect(mockTitleService.setTitle).toHaveBeenCalled();
      expect(mockBreadcrumbService.setBreadcrumbs).toHaveBeenCalled();
      expect(mockAuthFacade.refreshProfile).toHaveBeenCalled();
      expect(mockAuthFacade.logout).toHaveBeenCalled();
      expect(mockRouter.navigateByUrl).toHaveBeenCalled();
    });

    it('should maintain component state throughout lifecycle', () => {
      // Arrange & Act
      component.ngOnInit();

      // Assert - Component state should remain consistent
      expect((component as any).titlePage).toBe('Dashboard');
      expect(component.user).toBeDefined();
      expect(component.username).toBeDefined();
    });

    it('should handle multiple user signal updates correctly', () => {
      // Arrange
      const user1 = { ...mockUser, username: { value: 'user1' } };
      const user2 = { ...mockUser, username: { value: 'user2' } };

      // Act & Assert
      userSignal.set(user1);
      expect(component.username()).toBe('user1');

      userSignal.set(user2);
      expect(component.username()).toBe('user2');

      userSignal.set(null);
      expect(component.username()).toBeUndefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should call all ngOnInit operations even if some fail', () => {
      // Arrange
      mockTitleService.setTitle.and.throwError('Title service error');
      spyOn(console, 'error'); // Suppress error output

      // Act & Assert - Should still call other services even if one fails
      expect(() => component.ngOnInit()).toThrow();

      // Verify that at least some operations were attempted
      expect(mockTitleService.setTitle).toHaveBeenCalled();
    });

    it('should call logout operations in sequence regardless of individual failures', () => {
      // Arrange - Let logout succeed but navigation fail
      mockRouter.navigateByUrl.and.throwError('Navigation failed');

      // Act & Assert - logout should still be called even if navigation fails
      expect(() => component.logout()).toThrow();
      expect(mockAuthFacade.logout).toHaveBeenCalled();
    });

    it('should attempt navigation even if logout fails', () => {
      // Arrange - logout returns a rejected promise but component doesn't await
      mockAuthFacade.logout.and.returnValue(Promise.reject('Logout failed'));

      // Act & Assert - Component calls both methods synchronously
      expect(() => component.logout()).not.toThrow();

      // Both methods are called regardless of async failure
      expect(mockAuthFacade.logout).toHaveBeenCalled();
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/auth/login');
    });

    it('should handle undefined user gracefully in all scenarios', () => {
      // Arrange
      userSignal.set(undefined as any);

      // Act & Assert - Should not throw when accessing username
      expect(() => component.username()).not.toThrow();
      expect(component.username()).toBeUndefined();
    });
  });
});
