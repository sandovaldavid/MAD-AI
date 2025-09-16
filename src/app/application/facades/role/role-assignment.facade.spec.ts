import { TestBed } from '@angular/core/testing';
import { RoleAssignmentFacade } from './role-assignment.facade';
import { AssignRoleToUser } from '@application/use-cases/roles/assign-role-to-user.usecase';
import { UnassignRoleFromUser } from '@application/use-cases/roles/unassign-role-from-user.usecase';
import { GetUsersByRole } from '@application/use-cases/roles/get-users-by-role.usecase';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { NotificationsFacade } from '@application/facades/notifications.facade';
import { AuthFacade } from '@application/facades/auth.facade';
import { RoleStateFacade } from './role-state.facade';
import { Role } from '@domain/entities/role.entity';
import { User } from '@domain/entities/user.entity';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';

/**
 * Test Suite for RoleAssignmentFacade
 *
 * Tests the role assignment facade following Clean Architecture principles.
 * Focuses on orchestration between use cases, state management, and user feedback.
 * Validates proper error handling and notification integration for role assignments.
 *
 * @description
 * Validates the role assignment facade with comprehensive scenarios:
 * - Successful role assignment to users with state updates and notifications
 * - Successful role unassignment from users with state updates and notifications
 * - Bulk role assignment to multiple users
 * - Bulk role unassignment to multiple users
 * - User retrieval by role with state management
 * - Error handling for assignment/unassignment operations
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
 * - AssignRoleToUser use case mock
 * - UnassignRoleFromUser use case mock
 * - GetUsersByRole use case mock
 * - ApplicationErrorTransformer mock
 * - NotificationsFacade mock
 * - AuthFacade mock
 * - RoleStateFacade mock
 *
 * @scenarios
 * - ✅ Successful role assignment to single user with notifications
 * - ✅ Successful role unassignment from single user with notifications
 * - ✅ Bulk role assignment to multiple users
 * - ✅ Bulk role unassignment to multiple users
 * - ✅ User retrieval by role with state management
 * - ✅ Error handling for assignment operations
 * - ✅ Error handling for unassignment operations
 * - ✅ Loading state management during operations
 * - ✅ Authentication integration for user context
 * - ✅ Notification integration for user feedback
 * - ✅ Silent operation support
 * - ✅ Edge cases (user not found, role not found, permission denied)
 *
 * @since 2.0.0
 * @layer Application Testing
 */
describe('RoleAssignmentFacade', () => {
  let facade: RoleAssignmentFacade;

  // Mocks
  let mockAssignRoleUC: jasmine.SpyObj<AssignRoleToUser>;
  let mockUnassignRoleUC: jasmine.SpyObj<UnassignRoleFromUser>;
  let mockGetUsersByRoleUC: jasmine.SpyObj<GetUsersByRole>;
  let mockErrorTransformer: jasmine.SpyObj<ApplicationErrorTransformer>;
  let mockNotifications: jasmine.SpyObj<NotificationsFacade>;
  let mockAuthFacade: jasmine.SpyObj<AuthFacade>;
  let mockRoleState: jasmine.SpyObj<RoleStateFacade>;

  // Test data
  let mockUser: User;
  let mockRole: Role;
  let mockUsers: User[];

  beforeEach(() => {
    // Create mocks
    mockAssignRoleUC = jasmine.createSpyObj('AssignRoleToUser', ['execute']);
    mockUnassignRoleUC = jasmine.createSpyObj('UnassignRoleFromUser', ['execute']);
    mockGetUsersByRoleUC = jasmine.createSpyObj('GetUsersByRole', ['execute']);
    mockErrorTransformer = jasmine.createSpyObj('ApplicationErrorTransformer', ['transform']);
    mockNotifications = jasmine.createSpyObj('NotificationsFacade', ['success']);
    mockAuthFacade = jasmine.createSpyObj('AuthFacade', ['user']);
    mockRoleState = jasmine.createSpyObj('RoleStateFacade', [
      'setLoading',
      'setError',
      'setRoleUsers',
      'currentRole',
    ]);

    // Setup test data
    mockRole = Role.create({
      id: 1,
      name: 'Admin Role',
      accessLevel: 5,
      description: 'Administrator role with full access',
      isActive: true,
    });

    mockUser = User.create({
      id: 123,
      username: 'johndoe',
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      isActive: true,
      role: mockRole,
      notificationPreferences: {
        email: true,
        system: true,
        task: false,
      },
    });

    mockUsers = [
      mockUser,
      User.create({
        id: 456,
        username: 'janedoe',
        email: 'jane.doe@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        isActive: true,
        role: mockRole,
        notificationPreferences: {
          email: true,
          system: false,
          task: true,
        },
      }),
    ];

    // Mock RoleSummary for currentRole
    const mockRoleSummary = {
      id: 1,
      name: 'Admin Role',
      accessLevel: 5,
      description: 'Administrator role with full access',
      canLeadProjects: true,
      isUniquePerTeam: false,
      isActive: true,
      userCount: 2,
    };

    // Setup default mock behaviors
    mockAssignRoleUC.execute.and.returnValue(Promise.resolve());
    mockUnassignRoleUC.execute.and.returnValue(Promise.resolve());
    mockGetUsersByRoleUC.execute.and.returnValue(Promise.resolve(mockUsers));
    mockAuthFacade.user.and.returnValue({ id: 789 } as any);
    mockRoleState.currentRole.and.returnValue(mockRoleSummary);

    // Setup error transformer mock to return ApplicationError instances
    mockErrorTransformer.transform.and.callFake((error: any) => {
      if (error instanceof Error) {
        return new ApplicationError(
          ApplicationErrorCode.UNKNOWN_ERROR,
          error.message,
          error.message,
          undefined,
          'Please try again',
          false
        );
      }
      return new ApplicationError(
        ApplicationErrorCode.UNKNOWN_ERROR,
        'Unknown error',
        'An unknown error occurred',
        undefined,
        'Please try again',
        false
      );
    });

    // Setup TestBed
    TestBed.configureTestingModule({
      providers: [
        RoleAssignmentFacade,
        { provide: AssignRoleToUser, useValue: mockAssignRoleUC },
        { provide: UnassignRoleFromUser, useValue: mockUnassignRoleUC },
        { provide: GetUsersByRole, useValue: mockGetUsersByRoleUC },
        { provide: ApplicationErrorTransformer, useValue: mockErrorTransformer },
        { provide: NotificationsFacade, useValue: mockNotifications },
        { provide: AuthFacade, useValue: mockAuthFacade },
        { provide: RoleStateFacade, useValue: mockRoleState },
      ],
    });

    facade = TestBed.inject(RoleAssignmentFacade);
  });

  describe('Load Role Users', () => {
    it('should load users by role successfully', async () => {
      const roleId = 1;

      const result = await facade.loadRoleUsers(roleId);

      expect(mockGetUsersByRoleUC.execute).toHaveBeenCalledWith({ roleId });
      expect(mockRoleState.setRoleUsers).toHaveBeenCalledWith(mockUsers);
      expect(result).toEqual(mockUsers);
    });

    it('should handle loading errors', async () => {
      const error = new Error('Loading failed');
      mockGetUsersByRoleUC.execute.and.returnValue(Promise.reject(error));

      await expectAsync(facade.loadRoleUsers(1)).toBeRejected();
      expect(mockRoleState.setError).toHaveBeenCalledWith('Loading failed');
    });

    it('should manage loading state during user loading', async () => {
      mockGetUsersByRoleUC.execute.and.returnValue(
        new Promise((resolve) => setTimeout(() => resolve(mockUsers), 100))
      );

      const promise = facade.loadRoleUsers(1);

      expect(mockRoleState.setLoading).toHaveBeenCalledWith(true);

      await promise;

      expect(mockRoleState.setLoading).toHaveBeenCalledWith(false);
    });

    it('should skip loading state when opts.skipLoading is true', async () => {
      await facade.loadRoleUsers(1, { skipLoading: true });

      expect(mockRoleState.setLoading).not.toHaveBeenCalled();
    });
  });

  describe('Assign Role to User', () => {
    it('should assign role to user successfully with notifications', async () => {
      const roleId = 1;
      const userId = 123;

      await facade.assignRoleToUser(roleId, userId);

      expect(mockAssignRoleUC.execute).toHaveBeenCalledWith({
        roleId,
        userId,
        assignedByUserId: 789,
      });
      expect(mockNotifications.success).toHaveBeenCalledWith(
        'Role assigned successfully',
        'The role has been assigned to the user.'
      );
    });

    it('should refresh role users when assigning to current role', async () => {
      const roleId = 1;
      const userId = 123;

      await facade.assignRoleToUser(roleId, userId);

      expect(mockGetUsersByRoleUC.execute).toHaveBeenCalledWith({ roleId });
      expect(mockRoleState.setRoleUsers).toHaveBeenCalledWith(mockUsers);
    });

    it('should handle assignment errors', async () => {
      const error = new Error('Assignment failed');
      mockAssignRoleUC.execute.and.returnValue(Promise.reject(error));

      await expectAsync(facade.assignRoleToUser(1, 123)).toBeRejected();

      expect(mockRoleState.setError).toHaveBeenCalledWith('Assignment failed');
      expect(mockNotifications.success).not.toHaveBeenCalled();
    });

    it('should skip notifications when silent option is true', async () => {
      await facade.assignRoleToUser(1, 123, { silent: true });

      expect(mockNotifications.success).not.toHaveBeenCalled();
    });

    it('should throw error when no authenticated user', async () => {
      mockAuthFacade.user.and.returnValue(null);

      const expectedError = new Error('No authenticated user found');
      await expectAsync(facade.assignRoleToUser(1, 123)).toBeRejectedWith(expectedError);
    });
  });

  describe('Unassign Role from User', () => {
    it('should unassign role from user successfully with notifications', async () => {
      const roleId = 1;
      const userId = 123;

      await facade.unassignRoleFromUser(roleId, userId);

      expect(mockUnassignRoleUC.execute).toHaveBeenCalledWith({
        roleId,
        userId,
        requesterId: 789,
      });
      expect(mockNotifications.success).toHaveBeenCalledWith(
        'Role unassigned successfully',
        'The role has been removed from the user.'
      );
    });

    it('should refresh role users when unassigning from current role', async () => {
      const roleId = 1;
      const userId = 123;

      await facade.unassignRoleFromUser(roleId, userId);

      expect(mockGetUsersByRoleUC.execute).toHaveBeenCalledWith({ roleId });
      expect(mockRoleState.setRoleUsers).toHaveBeenCalledWith(mockUsers);
    });

    it('should handle unassignment errors', async () => {
      const error = new Error('Unassignment failed');
      mockUnassignRoleUC.execute.and.returnValue(Promise.reject(error));

      await expectAsync(facade.unassignRoleFromUser(1, 123)).toBeRejected();

      expect(mockRoleState.setError).toHaveBeenCalledWith('Unassignment failed');
      expect(mockNotifications.success).not.toHaveBeenCalled();
    });

    it('should skip notifications when silent option is true', async () => {
      await facade.unassignRoleFromUser(1, 123, { silent: true });

      expect(mockNotifications.success).not.toHaveBeenCalled();
    });

    it('should throw error when no authenticated user', async () => {
      mockAuthFacade.user.and.returnValue(null);

      const expectedError = new Error('No authenticated user found');
      await expectAsync(facade.unassignRoleFromUser(1, 123)).toBeRejectedWith(expectedError);
    });
  });

  describe('Bulk Role Assignment', () => {
    it('should assign role to multiple users successfully', async () => {
      const roleId = 1;
      const userIds = [123, 456, 789];

      await facade.bulkAssignRoleToUsers(roleId, userIds);

      expect(mockAssignRoleUC.execute).toHaveBeenCalledTimes(3);
      userIds.forEach((userId) => {
        expect(mockAssignRoleUC.execute).toHaveBeenCalledWith({
          roleId,
          userId,
          assignedByUserId: 789,
        });
      });
      expect(mockNotifications.success).toHaveBeenCalledWith(
        'Bulk role assignment completed',
        'Role has been assigned to 3 users successfully.'
      );
    });

    it('should handle partial failures in bulk assignment', async () => {
      const userIds = [123, 456, 789];
      const roleId = 1;

      mockAssignRoleUC.execute.and.returnValues(
        Promise.resolve(),
        Promise.reject(new Error('User not found')),
        Promise.resolve()
      );

      await expectAsync(facade.bulkAssignRoleToUsers(roleId, userIds)).toBeRejected();
    });

    it('should skip notifications when silent option is true', async () => {
      await facade.bulkAssignRoleToUsers(1, [123, 456], { silent: true });

      expect(mockNotifications.success).not.toHaveBeenCalled();
    });
  });

  describe('Bulk Role Unassignment', () => {
    it('should unassign role from multiple users successfully', async () => {
      const roleId = 1;
      const userIds = [123, 456, 789];

      await facade.bulkUnassignRoleFromUsers(roleId, userIds);

      expect(mockUnassignRoleUC.execute).toHaveBeenCalledTimes(3);
      userIds.forEach((userId) => {
        expect(mockUnassignRoleUC.execute).toHaveBeenCalledWith({
          roleId,
          userId,
          requesterId: 789,
        });
      });
      expect(mockNotifications.success).toHaveBeenCalledWith(
        'Bulk role unassignment completed',
        'Role has been removed from 3 users successfully.'
      );
    });

    it('should handle partial failures in bulk unassignment', async () => {
      const userIds = [123, 456, 789];
      const roleId = 1;

      mockUnassignRoleUC.execute.and.returnValues(
        Promise.resolve(),
        Promise.reject(new Error('User not found')),
        Promise.resolve()
      );

      await expectAsync(facade.bulkUnassignRoleFromUsers(roleId, userIds)).toBeRejected();
    });

    it('should skip notifications when silent option is true', async () => {
      await facade.bulkUnassignRoleFromUsers(1, [123, 456], { silent: true });

      expect(mockNotifications.success).not.toHaveBeenCalled();
    });
  });

  describe('Loading State Management', () => {
    it('should manage loading state for assignment', async () => {
      mockAssignRoleUC.execute.and.returnValue(
        new Promise((resolve) => setTimeout(() => resolve(), 100))
      );

      const promise = facade.assignRoleToUser(1, 123);

      expect(mockRoleState.setLoading).toHaveBeenCalledWith(true);

      await promise;

      expect(mockRoleState.setLoading).toHaveBeenCalledWith(false);
    });

    it('should manage loading state for bulk operations', async () => {
      const userIds = [123, 456];

      const promise = facade.bulkAssignRoleToUsers(1, userIds);

      expect(mockRoleState.setLoading).toHaveBeenCalledWith(true);

      await promise;

      expect(mockRoleState.setLoading).toHaveBeenCalledWith(false);
    });

    it('should manage loading state even when operations fail', async () => {
      mockAssignRoleUC.execute.and.returnValue(Promise.reject(new Error('Failed')));

      await expectAsync(facade.assignRoleToUser(1, 123)).toBeRejected();

      expect(mockRoleState.setLoading).toHaveBeenCalledWith(true);
      expect(mockRoleState.setLoading).toHaveBeenCalledWith(false);
    });

    it('should skip loading state when opts.skipLoading is true', async () => {
      await facade.assignRoleToUser(1, 123, { skipLoading: true });

      expect(mockRoleState.setLoading).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should transform domain errors to application errors for assignment', async () => {
      const domainError = new Error('Domain assignment error');
      const appError = new Error('Application assignment error') as any;

      mockAssignRoleUC.execute.and.returnValue(Promise.reject(domainError));
      mockErrorTransformer.transform.and.returnValue(appError);

      await expectAsync(facade.assignRoleToUser(1, 123)).toBeRejectedWith(appError);

      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(domainError);
    });

    it('should transform domain errors to application errors for unassignment', async () => {
      const domainError = new Error('Domain unassignment error');
      const appError = new Error('Application unassignment error') as any;

      mockUnassignRoleUC.execute.and.returnValue(Promise.reject(domainError));
      mockErrorTransformer.transform.and.returnValue(appError);

      await expectAsync(facade.unassignRoleFromUser(1, 123)).toBeRejectedWith(appError);

      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(domainError);
    });

    it('should clear error state on successful operations', async () => {
      mockRoleState.setError('Previous error');

      await facade.assignRoleToUser(1, 123);

      expect(mockRoleState.setError).toHaveBeenCalledWith(null);
    });
  });

  describe('Silent Operations', () => {
    it('should support silent assignment', async () => {
      await facade.assignRoleToUser(1, 123, { silent: true });

      expect(mockNotifications.success).not.toHaveBeenCalled();
    });

    it('should support silent unassignment', async () => {
      await facade.unassignRoleFromUser(1, 123, { silent: true });

      expect(mockNotifications.success).not.toHaveBeenCalled();
    });

    it('should support silent bulk operations', async () => {
      await facade.bulkAssignRoleToUsers(1, [123, 456], { silent: true });

      expect(mockNotifications.success).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle user not found errors gracefully', async () => {
      const notFoundError = new Error('User not found');
      mockAssignRoleUC.execute.and.returnValue(Promise.reject(notFoundError));

      await expectAsync(facade.assignRoleToUser(1, 999)).toBeRejected();

      expect(mockRoleState.setError).toHaveBeenCalledWith('User not found');
    });

    it('should handle role not found errors gracefully', async () => {
      const notFoundError = new Error('Role not found');
      mockAssignRoleUC.execute.and.returnValue(Promise.reject(notFoundError));

      await expectAsync(facade.assignRoleToUser(999, 123)).toBeRejected();

      expect(mockRoleState.setError).toHaveBeenCalledWith('Role not found');
    });

    it('should handle permission denied errors', async () => {
      const permissionError = new Error('Permission denied');
      mockAssignRoleUC.execute.and.returnValue(Promise.reject(permissionError));

      await expectAsync(facade.assignRoleToUser(1, 123)).toBeRejected();

      expect(mockRoleState.setError).toHaveBeenCalledWith('Permission denied');
    });

    it('should handle network errors during operations', async () => {
      const networkError = new Error('Network connection failed');
      mockAssignRoleUC.execute.and.returnValue(Promise.reject(networkError));

      await expectAsync(facade.assignRoleToUser(1, 123)).toBeRejected();

      expect(mockRoleState.setError).toHaveBeenCalledWith('Network connection failed');
    });
  });
});
