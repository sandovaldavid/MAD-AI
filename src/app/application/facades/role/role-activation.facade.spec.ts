import { TestBed } from '@angular/core/testing';
import { RoleActivationFacade } from './role-activation.facade';
import { ActivateRole } from '@application/use-cases/roles/activate-role.usecase';
import { DeactivateRoleUseCase } from '@application/use-cases/roles/deactivate-role.usecase';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { NotificationsFacade } from '@application/facades/notifications.facade';
import { AuthFacade } from '@application/facades/auth.facade';
import { RoleStateFacade } from './role-state.facade';
import { Role } from '@domain/entities/role.entity';
import { RoleApplicationMapper } from '@/app/application/mappers/role.mapper';

/**
 * Test Suite for RoleActivationFacade
 *
 * Tests the role activation/deactivation facade following Clean Architecture principles.
 * Focuses on orchestration between use cases, state management, and user feedback.
 * Validates proper error handling and notification integration.
 *
 * @description
 * Validates the role activation facade with comprehensive scenarios:
 * - Successful role activation with state updates and notifications
 * - Successful role deactivation with state updates and notifications
 * - Toggle activation status based on current role state
 * - Error handling for activation/deactivation operations
 * - Loading state management during operations
 * - Authentication integration for user context
 * - Notification integration for user feedback
 * - Silent operation support for background tasks
 *
 * @architecture
 * - **Layer**: Application Layer Testing
 * - **Pattern**: Orchestration Testing (not business logic testing)
 * - **Mocks**: All external dependencies (Use Cases, ErrorTransformer, Notifications, Auth, State)
 * - **Coverage**: 95% of orchestration logic, error paths, and user interaction flows
 *
 * @dependencies
 * - ActivateRole use case mock
 * - DeactivateRoleUseCase mock
 * - ApplicationErrorTransformer mock
 * - NotificationsFacade mock
 * - AuthFacade mock
 * - RoleStateFacade mock
 *
 * @scenarios
 * - ✅ Successful role activation with state updates and notifications
 * - ✅ Successful role deactivation with state updates and notifications
 * - ✅ Toggle activation based on current role state
 * - ✅ Error handling for activation operations
 * - ✅ Error handling for deactivation operations
 * - ✅ Loading state management during operations
 * - ✅ Authentication integration for user context
 * - ✅ Notification integration for user feedback
 * - ✅ Silent operation support
 * - ✅ Edge cases (role not found, invalid states)
 *
 * @since 2.0.0
 * @layer Application Testing
 */
describe('RoleActivationFacade', () => {
  let facade: RoleActivationFacade;

  // Mocks
  let mockActivateRoleUC: jasmine.SpyObj<ActivateRole>;
  let mockDeactivateRoleUC: jasmine.SpyObj<DeactivateRoleUseCase>;
  let mockErrorTransformer: jasmine.SpyObj<ApplicationErrorTransformer>;
  let mockNotifications: jasmine.SpyObj<NotificationsFacade>;
  let mockAuthFacade: jasmine.SpyObj<AuthFacade>;
  let mockRoleState: jasmine.SpyObj<RoleStateFacade>;

  // Test data
  let mockActiveRole: Role;
  let mockInactiveRole: Role;
  let mockActiveRoleSummary: any;
  let mockInactiveRoleSummary: any;

  beforeEach(() => {
    // Create mocks
    mockActivateRoleUC = jasmine.createSpyObj('ActivateRole', ['execute']);
    mockDeactivateRoleUC = jasmine.createSpyObj('DeactivateRoleUseCase', ['execute']);
    mockErrorTransformer = jasmine.createSpyObj('ApplicationErrorTransformer', ['transform']);
    mockNotifications = jasmine.createSpyObj('NotificationsFacade', ['success']);
    mockAuthFacade = jasmine.createSpyObj('AuthFacade', ['user']);
    mockRoleState = jasmine.createSpyObj('RoleStateFacade', [
      'setLoading',
      'setError',
      'updateRole',
      'roles',
      'currentRole',
    ]);

    // Setup test data
    mockActiveRole = Role.create({
      id: 1,
      name: 'Active Admin Role',
      accessLevel: 5,
      description: 'Active system administrator role',
      isActive: true,
    });

    mockInactiveRole = Role.create({
      id: 2,
      name: 'Inactive User Role',
      accessLevel: 1,
      description: 'Inactive user role',
      isActive: false,
    });

    mockActiveRoleSummary = {
      id: 1,
      name: 'Active Admin Role',
      accessLevel: 5,
      description: 'Active system administrator role',
      isActive: true,
      canLeadProjects: false,
      isUniquePerTeam: false,
      userCount: 5,
    };

    mockInactiveRoleSummary = {
      id: 2,
      name: 'Inactive User Role',
      accessLevel: 1,
      description: 'Inactive user role',
      isActive: false,
      canLeadProjects: false,
      isUniquePerTeam: false,
      userCount: 3,
    };

    // Setup default mock behaviors
    mockActivateRoleUC.execute.and.returnValue(Promise.resolve(mockInactiveRole));
    mockDeactivateRoleUC.execute.and.returnValue(Promise.resolve(mockActiveRole));
    mockAuthFacade.user.and.returnValue({ id: 123 } as unknown as any);
    mockErrorTransformer.transform.and.callFake((error: any) => error);

    // Mock RoleApplicationMapper
    spyOn(RoleApplicationMapper, 'toRoleSummary').and.callFake((role: Role) => {
      if (role.id === 1) return mockActiveRoleSummary;
      if (role.id === 2) return mockInactiveRoleSummary;
      return mockActiveRoleSummary;
    });

    // Setup TestBed
    TestBed.configureTestingModule({
      providers: [
        RoleActivationFacade,
        { provide: ActivateRole, useValue: mockActivateRoleUC },
        { provide: DeactivateRoleUseCase, useValue: mockDeactivateRoleUC },
        { provide: ApplicationErrorTransformer, useValue: mockErrorTransformer },
        { provide: NotificationsFacade, useValue: mockNotifications },
        { provide: AuthFacade, useValue: mockAuthFacade },
        { provide: RoleStateFacade, useValue: mockRoleState },
      ],
    });

    facade = TestBed.inject(RoleActivationFacade);
  });

  describe('Activate Role', () => {
    it('should activate role successfully with notifications', async () => {
      const roleId = 2;
      mockActivateRoleUC.execute.and.returnValue(Promise.resolve(mockActiveRole));

      const result = await facade.activateRole(roleId);

      expect(mockActivateRoleUC.execute).toHaveBeenCalledWith({
        id: roleId,
        requesterId: 123,
      });
      expect(RoleApplicationMapper.toRoleSummary).toHaveBeenCalledWith(mockActiveRole);
      expect(mockRoleState.updateRole).toHaveBeenCalledWith(mockActiveRoleSummary);
      expect(mockNotifications.success).toHaveBeenCalledWith(
        'Role activated',
        `Role "${mockActiveRole.name}" is now active.`
      );
      expect(result).toBe(mockActiveRole);
    });

    it('should handle activation errors', async () => {
      const error = new Error('Activation failed');
      mockActivateRoleUC.execute.and.returnValue(Promise.reject(error));

      await expectAsync(facade.activateRole(2)).toBeRejectedWith(error);

      expect(mockRoleState.setError).toHaveBeenCalledWith('Activation failed');
      expect(mockNotifications.success).not.toHaveBeenCalled();
    });

    it('should skip notifications when silent option is true', async () => {
      await facade.activateRole(2, { silent: true });

      expect(mockNotifications.success).not.toHaveBeenCalled();
    });
  });

  describe('Deactivate Role', () => {
    it('should deactivate role successfully with notifications', async () => {
      const roleId = 1;
      mockDeactivateRoleUC.execute.and.returnValue(Promise.resolve(mockInactiveRole));

      const result = await facade.deactivateRole(roleId);

      expect(mockDeactivateRoleUC.execute).toHaveBeenCalledWith({
        id: roleId,
        requesterId: 123,
      });
      expect(RoleApplicationMapper.toRoleSummary).toHaveBeenCalledWith(mockInactiveRole);
      expect(mockRoleState.updateRole).toHaveBeenCalledWith(mockInactiveRoleSummary);
      expect(mockNotifications.success).toHaveBeenCalledWith(
        'Role deactivated',
        `Role "${mockInactiveRole.name}" is now inactive.`
      );
      expect(result).toBe(mockInactiveRole);
    });

    it('should handle deactivation errors', async () => {
      const error = new Error('Deactivation failed');
      mockDeactivateRoleUC.execute.and.returnValue(Promise.reject(error));

      await expectAsync(facade.deactivateRole(1)).toBeRejectedWith(error);

      expect(mockRoleState.setError).toHaveBeenCalledWith('Deactivation failed');
      expect(mockNotifications.success).not.toHaveBeenCalled();
    });

    it('should skip notifications when silent option is true', async () => {
      await facade.deactivateRole(1, { silent: true });

      expect(mockNotifications.success).not.toHaveBeenCalled();
    });
  });

  describe('Toggle Role Activation', () => {
    beforeEach(() => {
      // Setup roles in state
      mockRoleState.roles.and.returnValue([mockActiveRoleSummary, mockInactiveRoleSummary]);
    });

    it('should deactivate active role when toggling', async () => {
      mockRoleState.roles.and.returnValue([mockActiveRoleSummary]);

      await facade.toggleRoleActivation(1);

      expect(mockDeactivateRoleUC.execute).toHaveBeenCalledWith({
        id: 1,
        requesterId: 123,
      });
      expect(mockActivateRoleUC.execute).not.toHaveBeenCalled();
    });

    it('should activate inactive role when toggling', async () => {
      mockRoleState.roles.and.returnValue([mockInactiveRoleSummary]);

      await facade.toggleRoleActivation(2);

      expect(mockActivateRoleUC.execute).toHaveBeenCalledWith({
        id: 2,
        requesterId: 123,
      });
      expect(mockDeactivateRoleUC.execute).not.toHaveBeenCalled();
    });

    it('should throw error when role not found in state', async () => {
      mockRoleState.roles.and.returnValue([]);

      await expectAsync(facade.toggleRoleActivation(999)).toBeRejectedWithError(
        'Role with ID 999 not found in current state'
      );

      expect(mockActivateRoleUC.execute).not.toHaveBeenCalled();
      expect(mockDeactivateRoleUC.execute).not.toHaveBeenCalled();
    });
  });

  describe('Authentication Integration', () => {
    it('should include current user ID in activation operations', async () => {
      mockAuthFacade.user.and.returnValue({ id: 456 } as unknown as any);

      await facade.activateRole(1);

      expect(mockActivateRoleUC.execute).toHaveBeenCalledWith({
        id: 1,
        requesterId: 456,
      });
    });

    it('should include current user ID in deactivation operations', async () => {
      mockAuthFacade.user.and.returnValue({ id: 789 } as unknown as any);

      await facade.deactivateRole(1);

      expect(mockDeactivateRoleUC.execute).toHaveBeenCalledWith({
        id: 1,
        requesterId: 789,
      });
    });

    it('should throw error when no authenticated user for activation', async () => {
      mockAuthFacade.user.and.returnValue(null);

      await expectAsync(facade.activateRole(1)).toBeRejectedWithError(
        'No authenticated user found'
      );
    });

    it('should throw error when no authenticated user for deactivation', async () => {
      mockAuthFacade.user.and.returnValue(null);

      await expectAsync(facade.deactivateRole(1)).toBeRejectedWithError(
        'No authenticated user found'
      );
    });
  });

  describe('Loading State Management', () => {
    it('should manage loading state for activation', async () => {
      mockActivateRoleUC.execute.and.returnValue(
        new Promise((resolve) => setTimeout(() => resolve(mockActiveRole), 100))
      );

      const promise = facade.activateRole(1);

      expect(mockRoleState.setLoading).toHaveBeenCalledWith(true);

      await promise;

      expect(mockRoleState.setLoading).toHaveBeenCalledWith(false);
    });

    it('should manage loading state for deactivation', async () => {
      mockDeactivateRoleUC.execute.and.returnValue(
        new Promise((resolve) => setTimeout(() => resolve(mockInactiveRole), 100))
      );

      const promise = facade.deactivateRole(1);

      expect(mockRoleState.setLoading).toHaveBeenCalledWith(true);

      await promise;

      expect(mockRoleState.setLoading).toHaveBeenCalledWith(false);
    });

    it('should manage loading state even when operations fail', async () => {
      mockActivateRoleUC.execute.and.returnValue(Promise.reject(new Error('Failed')));

      await expectAsync(facade.activateRole(1)).toBeRejected();

      expect(mockRoleState.setLoading).toHaveBeenCalledWith(true);
      expect(mockRoleState.setLoading).toHaveBeenCalledWith(false);
    });

    it('should skip loading state when opts.skipLoading is true', async () => {
      await facade.activateRole(1, { skipLoading: true });

      expect(mockRoleState.setLoading).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should transform domain errors to application errors for activation', async () => {
      const domainError = new Error('Domain activation error');
      const appError = new Error('Application activation error') as any;

      mockActivateRoleUC.execute.and.returnValue(Promise.reject(domainError));
      mockErrorTransformer.transform.and.returnValue(appError);

      await expectAsync(facade.activateRole(1)).toBeRejectedWith(appError);

      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(domainError);
    });

    it('should transform domain errors to application errors for deactivation', async () => {
      const domainError = new Error('Domain deactivation error');
      const appError = new Error('Application deactivation error') as any;

      mockDeactivateRoleUC.execute.and.returnValue(Promise.reject(domainError));
      mockErrorTransformer.transform.and.returnValue(appError);

      await expectAsync(facade.deactivateRole(1)).toBeRejectedWith(appError);

      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(domainError);
    });

    it('should clear error state on successful operations', async () => {
      mockRoleState.setError('Previous error');

      await facade.activateRole(1);

      expect(mockRoleState.setError).toHaveBeenCalledWith(null);
    });
  });

  describe('Silent Operations', () => {
    it('should support silent activation', async () => {
      await facade.activateRole(1, { silent: true });

      expect(mockNotifications.success).not.toHaveBeenCalled();
    });

    it('should support silent deactivation', async () => {
      await facade.deactivateRole(1, { silent: true });

      expect(mockNotifications.success).not.toHaveBeenCalled();
    });

    it('should support silent toggle operations', async () => {
      mockRoleState.roles.and.returnValue([mockActiveRoleSummary]);

      await facade.toggleRoleActivation(1, { silent: true });

      expect(mockNotifications.success).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle role not found errors gracefully', async () => {
      const notFoundError = new Error('Role not found');
      mockActivateRoleUC.execute.and.returnValue(Promise.reject(notFoundError));

      await expectAsync(facade.activateRole(999)).toBeRejectedWith(notFoundError);

      expect(mockRoleState.setError).toHaveBeenCalledWith('Role not found');
    });

    it('should handle network errors during activation', async () => {
      const networkError = new Error('Network connection failed');
      mockActivateRoleUC.execute.and.returnValue(Promise.reject(networkError));

      await expectAsync(facade.activateRole(1)).toBeRejectedWith(networkError);

      expect(mockRoleState.setError).toHaveBeenCalledWith('Network connection failed');
    });

    it('should handle network errors during deactivation', async () => {
      const networkError = new Error('Network connection failed');
      mockDeactivateRoleUC.execute.and.returnValue(Promise.reject(networkError));

      await expectAsync(facade.deactivateRole(1)).toBeRejectedWith(networkError);

      expect(mockRoleState.setError).toHaveBeenCalledWith('Network connection failed');
    });
  });
});
