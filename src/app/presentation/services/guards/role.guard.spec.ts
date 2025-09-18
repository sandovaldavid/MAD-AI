/**
 * @fileoverview RoleGuard Test Suite
 *
 * Tests for role-based route protection guard in the Presentation Layer.
 * Focuses on authorization logic without business rules, following
 * Presentation Layer testing guidelines.
 *
 * @description
 * Tests the roleGuard functional guard that protects routes based on user roles.
 * Verifies:
 * - Proper AuthFacade injection and usage
 * - Role-based access control logic
 * - Admin access bypass functionality
 * - Edge cases and error scenarios
 *
 * @architecture
 * Presentation Layer Testing Strategy:
 * - Mock AuthFacade completely
 * - Focus on routing authorization behavior
 * - No business logic testing (delegated to Application layer)
 * - Verify guard decision-making process
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Presentation
 */

import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { roleGuard } from './role.guard';
import { AuthFacade } from '@application/facades/auth.facade';

describe('RoleGuard', () => {
  let mockAuthFacade: jasmine.SpyObj<AuthFacade>;
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;

  // Mock user objects for testing
  const mockAdminUser = {
    id: 'user-1',
    email: 'admin@test.com',
    role: {
      id: 'role-1',
      name: 'admin',
      canAccessAdmin: jasmine.createSpy('canAccessAdmin').and.returnValue(true),
    },
  } as any;

  const mockManagerUser = {
    id: 'user-2',
    email: 'manager@test.com',
    role: {
      id: 'role-2',
      name: 'manager',
      canAccessAdmin: jasmine.createSpy('canAccessAdmin').and.returnValue(false),
    },
  } as any;

  const mockRegularUser = {
    id: 'user-3',
    email: 'user@test.com',
    role: {
      id: 'role-3',
      name: 'user',
      canAccessAdmin: jasmine.createSpy('canAccessAdmin').and.returnValue(false),
    },
  } as any;

  beforeEach(() => {
    // Create spy object for AuthFacade
    mockAuthFacade = jasmine.createSpyObj('AuthFacade', ['user']);

    // Configure TestBed with mock provider
    TestBed.configureTestingModule({
      providers: [{ provide: AuthFacade, useValue: mockAuthFacade }],
    });

    // Create mock route objects
    mockRoute = {} as ActivatedRouteSnapshot;
    mockState = {} as RouterStateSnapshot;
  });

  describe('Role-Based Access Control', () => {
    it('should allow access when user has exact role match', () => {
      // Arrange
      mockAuthFacade.user.and.returnValue(mockManagerUser);
      const guard = roleGuard('manager');

      // Act
      const canActivate = TestBed.runInInjectionContext(() => guard(mockRoute, mockState));

      // Assert
      expect(canActivate).toBe(true);
      expect(mockAuthFacade.user).toHaveBeenCalled();
    });

    it('should allow access with case-insensitive role matching', () => {
      // Arrange
      mockAuthFacade.user.and.returnValue(mockManagerUser);
      const guard = roleGuard('MANAGER'); // Different case

      // Act
      const canActivate = TestBed.runInInjectionContext(() => guard(mockRoute, mockState));

      // Assert
      expect(canActivate).toBe(true);
    });

    it('should deny access when user role does not match', () => {
      // Arrange
      mockAuthFacade.user.and.returnValue(mockRegularUser);
      const guard = roleGuard('manager');

      // Act
      const canActivate = TestBed.runInInjectionContext(() => guard(mockRoute, mockState));

      // Assert
      expect(canActivate).toBe(false);
      expect(mockRegularUser.role.canAccessAdmin).toHaveBeenCalled();
    });

    it('should deny access when user is null', () => {
      // Arrange
      mockAuthFacade.user.and.returnValue(null);
      const guard = roleGuard('admin');

      // Act
      const canActivate = TestBed.runInInjectionContext(() => guard(mockRoute, mockState));

      // Assert
      expect(canActivate).toBe(false);
      expect(mockAuthFacade.user).toHaveBeenCalled();
    });

    it('should deny access when user is undefined', () => {
      // Arrange
      mockAuthFacade.user.and.returnValue(null);
      const guard = roleGuard('admin');

      // Act
      const canActivate = TestBed.runInInjectionContext(() => guard(mockRoute, mockState));

      // Assert
      expect(canActivate).toBe(false);
    });
  });

  describe('Admin Access Bypass', () => {
    it('should allow access when user has admin privileges regardless of role name', () => {
      // Arrange
      const userWithAdminAccess = {
        ...mockRegularUser,
        role: {
          ...mockRegularUser.role,
          canAccessAdmin: jasmine.createSpy('canAccessAdmin').and.returnValue(true),
        },
      };
      mockAuthFacade.user.and.returnValue(userWithAdminAccess);
      const guard = roleGuard('manager');

      // Act
      const canActivate = TestBed.runInInjectionContext(() => guard(mockRoute, mockState));

      // Assert
      expect(canActivate).toBe(true);
      expect(userWithAdminAccess.role.canAccessAdmin).toHaveBeenCalled();
    });

    it('should allow admin user to access any role-protected route', () => {
      // Arrange
      mockAuthFacade.user.and.returnValue(mockAdminUser);
      const guard = roleGuard('manager');

      // Act
      const canActivate = TestBed.runInInjectionContext(() => guard(mockRoute, mockState));

      // Assert
      expect(canActivate).toBe(true);
      expect(mockAdminUser.role.canAccessAdmin).toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle user with null role name gracefully', () => {
      // Arrange
      const userWithNullRoleName = {
        ...mockRegularUser,
        role: {
          ...mockRegularUser.role,
          name: null,
          canAccessAdmin: jasmine.createSpy('canAccessAdmin').and.returnValue(false),
        },
      };
      mockAuthFacade.user.and.returnValue(userWithNullRoleName);
      const guard = roleGuard('manager');

      // Act
      const canActivate = TestBed.runInInjectionContext(() => guard(mockRoute, mockState));

      // Assert
      expect(canActivate).toBe(false);
      expect(userWithNullRoleName.role.canAccessAdmin).toHaveBeenCalled();
    });

    it('should handle user with undefined role name gracefully', () => {
      // Arrange
      const userWithUndefinedRoleName = {
        ...mockRegularUser,
        role: {
          ...mockRegularUser.role,
          name: undefined,
          canAccessAdmin: jasmine.createSpy('canAccessAdmin').and.returnValue(false),
        },
      };
      mockAuthFacade.user.and.returnValue(userWithUndefinedRoleName);
      const guard = roleGuard('manager');

      // Act
      const canActivate = TestBed.runInInjectionContext(() => guard(mockRoute, mockState));

      // Assert
      expect(canActivate).toBe(false);
    });

    it('should handle empty string role name', () => {
      // Arrange
      const userWithEmptyRoleName = {
        ...mockRegularUser,
        role: {
          ...mockRegularUser.role,
          name: '',
          canAccessAdmin: jasmine.createSpy('canAccessAdmin').and.returnValue(false),
        },
      };
      mockAuthFacade.user.and.returnValue(userWithEmptyRoleName);
      const guard = roleGuard('manager');

      // Act
      const canActivate = TestBed.runInInjectionContext(() => guard(mockRoute, mockState));

      // Assert
      expect(canActivate).toBe(false);
    });

    it('should handle whitespace in role names correctly', () => {
      // Arrange
      const userWithWhitespaceRole = {
        ...mockRegularUser,
        role: {
          ...mockRegularUser.role,
          name: '  manager  ',
          canAccessAdmin: jasmine.createSpy('canAccessAdmin').and.returnValue(false),
        },
      };
      mockAuthFacade.user.and.returnValue(userWithWhitespaceRole);
      const guard = roleGuard('manager');

      // Act
      const canActivate = TestBed.runInInjectionContext(() => guard(mockRoute, mockState));

      // Assert
      expect(canActivate).toBe(false); // Whitespace should not be trimmed
    });
  });

  describe('Guard Factory Function', () => {
    it('should create different guard instances for different roles', () => {
      // Arrange
      const adminGuard = roleGuard('admin');
      const managerGuard = roleGuard('manager');

      // Act & Assert
      expect(adminGuard).toBeDefined();
      expect(managerGuard).toBeDefined();
      expect(adminGuard).not.toBe(managerGuard);
    });

    it('should maintain role requirement in closure', () => {
      // Arrange
      mockAuthFacade.user.and.returnValue(mockManagerUser);
      const adminGuard = roleGuard('admin');
      const managerGuard = roleGuard('manager');

      // Act
      const adminResult = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));
      const managerResult = TestBed.runInInjectionContext(() => managerGuard(mockRoute, mockState));

      // Assert
      expect(adminResult).toBe(false); // Manager user cannot access admin route
      expect(managerResult).toBe(true); // Manager user can access manager route
    });
  });

  describe('AuthFacade Integration', () => {
    it('should call AuthFacade.user() exactly once per guard execution', () => {
      // Arrange
      mockAuthFacade.user.and.returnValue(mockAdminUser);
      const guard = roleGuard('admin');

      // Act
      TestBed.runInInjectionContext(() => guard(mockRoute, mockState));

      // Assert
      expect(mockAuthFacade.user).toHaveBeenCalledTimes(1);
    });

    it('should not cache user between different guard executions', () => {
      // Arrange
      const guard = roleGuard('admin');
      mockAuthFacade.user.and.returnValue(mockAdminUser);

      // Act - First execution
      TestBed.runInInjectionContext(() => guard(mockRoute, mockState));

      // Change user and execute again
      mockAuthFacade.user.and.returnValue(mockRegularUser);
      TestBed.runInInjectionContext(() => guard(mockRoute, mockState));

      // Assert
      expect(mockAuthFacade.user).toHaveBeenCalledTimes(2);
    });
  });
});
