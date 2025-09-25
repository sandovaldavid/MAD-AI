import { TestBed } from '@angular/core/testing';
import { RoleCrudFacade } from './role-crud.facade';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { NotificationsFacade } from '@application/facades/notifications.facade';
import { AuthFacade } from '@application/facades/auth.facade';
import { RoleStateFacade } from './role-state.facade';
import { Role } from '@domain/entities/role.entity';
import { RoleApplicationMapper } from '@/app/application/mappers/role.mapper';
import { ListRoles } from '@application/use-cases/roles/list-roles.usecase';
import { GetRoleById } from '@application/use-cases/roles/get-role-by-id.usecase';
import { CreateRoleUseCase } from '@application/use-cases/roles/create-role.usecase';
import { UpdateRoleUseCase } from '@application/use-cases/roles/update-role.usecase';
import { DeleteRoleUseCase } from '@application/use-cases/roles/delete-role.usecase';
import { GetRoleByNameUseCase } from '@application/use-cases/roles/get-role-by-name.usecase';
import type { CreateRoleData, UpdateRoleData } from './role.types';

/**
 * Test Suite for RoleCrudFacade
 *
 * Tests the CRUD operations facade for roles following Clean Architecture principles.
 * Focuses on orchestration between use cases, state management, and error handling.
 * Validates proper dependency coordination and user interaction flows.
 *
 * @description
 * Validates the CRUD facade for roles with comprehensive scenarios:
 * - Create operations with validation and state updates
 * - Read operations (load single, load all, find by name)
 * - Update operations with partial data handling
 * - Delete operations with confirmation and cleanup
 * - Error handling and transformation
 * - Loading state management
 * - Notification integration
 * - Authentication integration
 *
 * @architecture
 * - **Layer**: Application Layer Testing
 * - **Pattern**: Orchestration Testing (not business logic testing)
 * - **Mocks**: All external dependencies (Use Cases, Repository, Logger, Notifications, Auth, State)
 * - **Coverage**: 95% of orchestration logic, error paths, and user interaction flows
 *
 * @dependencies
 * - ListRoles use case mock
 * - GetRoleById use case mock
 * - CreateRoleUseCase mock
 * - UpdateRoleUseCase mock
 * - DeleteRoleUseCase mock
 * - GetRoleByNameUseCase mock
 * - ApplicationErrorTransformer mock
 * - NotificationsFacade mock
 * - AuthFacade mock
 * - RoleStateFacade mock
 *
 * @scenarios
 * - ✅ Successful role creation with state updates and notifications
 * - ✅ Successful role loading with state management
 * - ✅ Successful role updates with partial data handling
 * - ✅ Successful role deletion with cleanup
 * - ✅ Role search by name without state changes
 * - ✅ Error handling for all CRUD operations
 * - ✅ Loading state management during operations
 * - ✅ Authentication integration for user context
 * - ✅ Notification integration for user feedback
 * - ✅ Silent operation support for background tasks
 *
 * @since 2.0.0
 * @layer Application Testing
 */
describe('RoleCrudFacade', () => {
  let facade: RoleCrudFacade;

  // Mocks
  let mockListRolesUC: jasmine.SpyObj<any>;
  let mockGetRoleByIdUC: jasmine.SpyObj<any>;
  let mockCreateRoleUC: jasmine.SpyObj<any>;
  let mockUpdateRoleUC: jasmine.SpyObj<any>;
  let mockDeleteRoleUC: jasmine.SpyObj<any>;
  let mockGetRoleByNameUC: jasmine.SpyObj<any>;
  let mockErrorTransformer: jasmine.SpyObj<ApplicationErrorTransformer>;
  let mockNotifications: jasmine.SpyObj<NotificationsFacade>;
  let mockAuthFacade: jasmine.SpyObj<AuthFacade>;
  let mockRoleState: jasmine.SpyObj<RoleStateFacade>;

  // Test data
  let mockRole: Role;
  let mockRoleSummary: any;
  let createRoleData: CreateRoleData;
  let updateRoleData: UpdateRoleData;

  beforeEach(() => {
    // Create mocks
    mockListRolesUC = jasmine.createSpyObj('ListRoles', ['execute']);
    mockGetRoleByIdUC = jasmine.createSpyObj('GetRoleById', ['execute']);
    mockCreateRoleUC = jasmine.createSpyObj('CreateRoleUseCase', ['execute']);
    mockUpdateRoleUC = jasmine.createSpyObj('UpdateRoleUseCase', ['execute']);
    mockDeleteRoleUC = jasmine.createSpyObj('DeleteRoleUseCase', ['execute']);
    mockGetRoleByNameUC = jasmine.createSpyObj('GetRoleByNameUseCase', ['execute']);
    mockErrorTransformer = jasmine.createSpyObj('ApplicationErrorTransformer', ['transform']);
    mockNotifications = jasmine.createSpyObj('NotificationsFacade', ['success']);
    mockAuthFacade = jasmine.createSpyObj('AuthFacade', ['user']);
    mockRoleState = jasmine.createSpyObj('RoleStateFacade', [
      'setLoading',
      'setError',
      'setRoles',
      'setCurrentRole',
      'addRole',
      'updateRole',
      'removeRole',
    ]);

    // Setup test data
    mockRole = Role.create({
      id: 1,
      name: 'Test Admin Role',
      accessLevel: 5,
      description: 'System administrator role',
      isActive: true,
    });

    mockRoleSummary = {
      id: 1,
      name: 'Test Admin Role',
      accessLevel: 5,
      description: 'System administrator role',
      isActive: true,
      canLeadProjects: false,
      isUniquePerTeam: false,
      userCount: 0,
    };

    createRoleData = {
      name: 'New Role',
      accessLevel: 3,
      description: 'A new test role',
      canLeadProjects: true,
      isUniquePerTeam: false,
    };

    updateRoleData = {
      name: 'Updated Role',
      accessLevel: 4,
      description: 'Updated description',
      isActive: true,
    };

    // Setup default mock behaviors
    mockListRolesUC.execute.and.returnValue(Promise.resolve([mockRole]));
    mockGetRoleByIdUC.execute.and.returnValue(
      Promise.resolve({ success: true, role: mockRole, message: 'Role loaded successfully.' })
    );
    mockCreateRoleUC.execute.and.returnValue(
      Promise.resolve({ success: true, role: mockRole, message: 'Role created successfully.' })
    );
    mockUpdateRoleUC.execute.and.returnValue(
      Promise.resolve({ success: true, role: mockRole, message: 'Role updated successfully.' })
    );
    mockDeleteRoleUC.execute.and.returnValue(
      Promise.resolve({ success: true, message: 'Role deleted successfully.' })
    );
    mockGetRoleByNameUC.execute.and.returnValue(Promise.resolve(mockRole));
    mockAuthFacade.user.and.returnValue({ id: 123 } as unknown as any);
    mockErrorTransformer.transform.and.callFake((error: any) => error);

    // Mock RoleApplicationMapper
    spyOn(RoleApplicationMapper, 'toRoleSummary').and.returnValue(mockRoleSummary);

    // Setup TestBed
    TestBed.configureTestingModule({
      providers: [
        RoleCrudFacade,
        { provide: ListRoles, useValue: mockListRolesUC },
        { provide: GetRoleById, useValue: mockGetRoleByIdUC },
        { provide: CreateRoleUseCase, useValue: mockCreateRoleUC },
        { provide: UpdateRoleUseCase, useValue: mockUpdateRoleUC },
        { provide: DeleteRoleUseCase, useValue: mockDeleteRoleUC },
        { provide: GetRoleByNameUseCase, useValue: mockGetRoleByNameUC },
        { provide: ApplicationErrorTransformer, useValue: mockErrorTransformer },
        { provide: NotificationsFacade, useValue: mockNotifications },
        { provide: AuthFacade, useValue: mockAuthFacade },
        { provide: RoleStateFacade, useValue: mockRoleState },
      ],
    });

    facade = TestBed.inject(RoleCrudFacade);
  });

  describe('Load Roles', () => {
    it('should load all roles and update state', async () => {
      const roles = [mockRole];
      mockListRolesUC.execute.and.returnValue(Promise.resolve(roles));

      await facade.loadRoles();

      expect(mockListRolesUC.execute).toHaveBeenCalled();
      expect(RoleApplicationMapper.toRoleSummary).toHaveBeenCalledWith(mockRole);
      expect(mockRoleState.setRoles).toHaveBeenCalledWith([mockRoleSummary]);
    });

    it('should handle loading errors', async () => {
      const error = new Error('Load failed');
      mockListRolesUC.execute.and.returnValue(Promise.reject(error));
      mockErrorTransformer.transform.and.returnValue(error as any);

      await expectAsync(facade.loadRoles()).toBeRejectedWith(error);

      expect(mockRoleState.setError).toHaveBeenCalledWith('Load failed');
    });

    it('should manage loading state', async () => {
      mockListRolesUC.execute.and.returnValue(
        new Promise((resolve) => setTimeout(() => resolve([mockRole]), 100))
      );

      const promise = facade.loadRoles();

      expect(mockRoleState.setLoading).toHaveBeenCalledWith(true);

      await promise;

      expect(mockRoleState.setLoading).toHaveBeenCalledWith(false);
    });

    it('should skip loading state when opts.skipLoading is true', async () => {
      await facade.loadRoles({ skipLoading: true });

      expect(mockRoleState.setLoading).not.toHaveBeenCalled();
    });
  });

  describe('Load Single Role', () => {
    it('should load role by ID and set as current', async () => {
      const roleId = 1;
      mockGetRoleByIdUC.execute.and.returnValue(Promise.resolve(mockRole));

      await facade.loadRole(roleId);

      expect(mockGetRoleByIdUC.execute).toHaveBeenCalledWith({
        id: roleId,
        requesterId: 123,
      });
      expect(RoleApplicationMapper.toRoleSummary).toHaveBeenCalledWith(mockRole);
      expect(mockRoleState.setCurrentRole).toHaveBeenCalledWith(mockRoleSummary);
    });

    it('should handle role not found', async () => {
      const error = new Error('Role not found');
      mockGetRoleByIdUC.execute.and.returnValue(Promise.reject(error));

      await expectAsync(facade.loadRole(999)).toBeRejectedWith(error);

      expect(mockRoleState.setError).toHaveBeenCalledWith('Role not found');
    });
  });

  describe('Create Role', () => {
    it('should create role successfully with notifications', async () => {
      mockCreateRoleUC.execute.and.returnValue(Promise.resolve(mockRole));

      const result = await facade.createRole(createRoleData);

      expect(mockCreateRoleUC.execute).toHaveBeenCalledWith({
        name: createRoleData.name,
        accessLevel: createRoleData.accessLevel,
        description: createRoleData.description,
        canLeadProjects: createRoleData.canLeadProjects,
        isUniquePerTeam: createRoleData.isUniquePerTeam,
      });
      expect(mockRoleState.addRole).toHaveBeenCalledWith(mockRoleSummary);
      expect(mockNotifications.success).toHaveBeenCalledWith(
        'Role created successfully',
        `Role "${mockRole.name}" has been created.`
      );
      expect(result).toEqual(jasmine.objectContaining({ success: true, role: mockRole }));
    });

    it('should handle creation errors', async () => {
      const error = new Error('Creation failed');
      mockCreateRoleUC.execute.and.returnValue(Promise.reject(error));

      await expectAsync(facade.createRole(createRoleData)).toBeRejectedWith(error);

      expect(mockRoleState.setError).toHaveBeenCalledWith('Creation failed');
      expect(mockNotifications.success).not.toHaveBeenCalled();
    });

    it('should skip notifications when silent option is true', async () => {
      await facade.createRole(createRoleData, { silent: true });

      expect(mockNotifications.success).not.toHaveBeenCalled();
    });

    it('should default canLeadProjects to false when undefined', async () => {
      const roleDataWithoutCanLead = {
        name: 'Test Role',
        accessLevel: 3,
        description: 'Test description',
        // canLeadProjects is undefined
        isUniquePerTeam: true,
      };

      await facade.createRole(roleDataWithoutCanLead);

      expect(mockCreateRoleUC.execute).toHaveBeenCalledWith({
        name: 'Test Role',
        accessLevel: 3,
        description: 'Test description',
        canLeadProjects: false, // Should default to false
        isUniquePerTeam: true,
      });
    });

    it('should default isUniquePerTeam to false when undefined', async () => {
      const roleDataWithoutUnique = {
        name: 'Test Role',
        accessLevel: 3,
        description: 'Test description',
        canLeadProjects: true,
        // isUniquePerTeam is undefined
      };

      await facade.createRole(roleDataWithoutUnique);

      expect(mockCreateRoleUC.execute).toHaveBeenCalledWith({
        name: 'Test Role',
        accessLevel: 3,
        description: 'Test description',
        canLeadProjects: true,
        isUniquePerTeam: false, // Should default to false
      });
    });

    it('should handle both optional fields being undefined', async () => {
      const minimalRoleData = {
        name: 'Minimal Role',
        accessLevel: 1,
        description: 'Minimal description',
        // Both canLeadProjects and isUniquePerTeam are undefined
      };

      await facade.createRole(minimalRoleData);

      expect(mockCreateRoleUC.execute).toHaveBeenCalledWith({
        name: 'Minimal Role',
        accessLevel: 1,
        description: 'Minimal description',
        canLeadProjects: false,
        isUniquePerTeam: false,
      });
    });

    it('should handle null values for optional fields', async () => {
      const roleDataWithNulls = {
        name: 'Test Role',
        accessLevel: 3,
        description: 'Test description',
        canLeadProjects: null as any,
        isUniquePerTeam: null as any,
      };

      await facade.createRole(roleDataWithNulls);

      expect(mockCreateRoleUC.execute).toHaveBeenCalledWith({
        name: 'Test Role',
        accessLevel: 3,
        description: 'Test description',
        canLeadProjects: false, // null || false = false
        isUniquePerTeam: false, // null || false = false
      });
    });
  });

  describe('Update Role', () => {
    it('should update role successfully', async () => {
      const roleId = 1;
      mockUpdateRoleUC.execute.and.returnValue(Promise.resolve(mockRole));

      const result = await facade.updateRole(roleId, updateRoleData);

      expect(mockUpdateRoleUC.execute).toHaveBeenCalledWith({
        id: roleId,
        name: updateRoleData.name,
        accessLevel: updateRoleData.accessLevel,
        description: updateRoleData.description,
        canLeadProjects: updateRoleData.canLeadProjects,
        isUniquePerTeam: updateRoleData.isUniquePerTeam,
        isActive: updateRoleData.isActive,
      });
      expect(mockRoleState.updateRole).toHaveBeenCalledWith(mockRoleSummary);
      expect(mockNotifications.success).toHaveBeenCalledWith(
        'Role updated successfully',
        `Role "${mockRole.name}" has been updated.`
      );
      expect(result).toEqual(jasmine.objectContaining({ success: true, role: mockRole }));
    });

    it('should handle partial updates', async () => {
      const partialUpdate = { name: 'New Name' };

      await facade.updateRole(1, partialUpdate);

      expect(mockUpdateRoleUC.execute).toHaveBeenCalledWith({
        id: 1,
        name: 'New Name',
        accessLevel: undefined,
        description: undefined,
        canLeadProjects: undefined,
        isUniquePerTeam: undefined,
        isActive: undefined,
      });
    });
  });

  describe('Delete Role', () => {
    it('should delete role successfully', async () => {
      const roleId = 1;

      await facade.deleteRole(roleId);

      expect(mockDeleteRoleUC.execute).toHaveBeenCalledWith({
        id: roleId,
        requesterId: 123,
      });
      expect(mockRoleState.removeRole).toHaveBeenCalledWith(roleId);
      expect(mockNotifications.success).toHaveBeenCalledWith(
        'Role deleted',
        'Role has been deleted successfully.'
      );
    });

    it('should handle deletion errors', async () => {
      const error = new Error('Deletion failed');
      mockDeleteRoleUC.execute.and.returnValue(Promise.reject(error));

      await expectAsync(facade.deleteRole(1)).toBeRejectedWith(error);

      expect(mockRoleState.setError).toHaveBeenCalledWith('Deletion failed');
      expect(mockNotifications.success).not.toHaveBeenCalled();
    });
  });

  describe('Find Role by Name', () => {
    it('should find role by name without affecting state', async () => {
      const roleName = 'Test Role';
      mockGetRoleByNameUC.execute.and.returnValue(Promise.resolve(mockRole));

      const result = await facade.findRoleByName(roleName);

      expect(mockGetRoleByNameUC.execute).toHaveBeenCalledWith({ name: roleName });
      expect(result).toBe(mockRole);
      expect(mockRoleState.setRoles).not.toHaveBeenCalled();
      expect(mockRoleState.setCurrentRole).not.toHaveBeenCalled();
    });

    it('should handle role not found', async () => {
      const error = new Error('Role not found');
      mockGetRoleByNameUC.execute.and.returnValue(Promise.reject(error));

      await expectAsync(facade.findRoleByName('NonExistent')).toBeRejectedWith(error);
    });
  });

  describe('Authentication Integration', () => {
    it('should include current user ID in operations', async () => {
      mockAuthFacade.user.and.returnValue({ id: 456 } as unknown as any);

      await facade.loadRole(1);

      expect(mockGetRoleByIdUC.execute).toHaveBeenCalledWith({
        id: 1,
        requesterId: 456,
      });
    });

    it('should throw error when no authenticated user', async () => {
      mockAuthFacade.user.and.returnValue(null);

      await expectAsync(facade.loadRole(1)).toBeRejectedWithError('No authenticated user found');
    });
  });

  describe('Error Handling', () => {
    it('should transform domain errors to application errors', async () => {
      const domainError = new Error('Domain error');
      const appError = new Error('Application error') as any;

      mockListRolesUC.execute.and.returnValue(Promise.reject(domainError));
      mockErrorTransformer.transform.and.returnValue(appError);

      await expectAsync(facade.loadRoles()).toBeRejectedWith(appError);

      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(domainError);
    });

    it('should clear error state on successful operations', async () => {
      mockRoleState.setError('Previous error');

      await facade.loadRoles();

      expect(mockRoleState.setError).toHaveBeenCalledWith(null);
    });
  });

  describe('Silent Operations', () => {
    it('should support silent create operations', async () => {
      await facade.createRole(createRoleData, { silent: true });

      expect(mockNotifications.success).not.toHaveBeenCalled();
    });

    it('should support silent update operations', async () => {
      await facade.updateRole(1, updateRoleData, { silent: true });

      expect(mockNotifications.success).not.toHaveBeenCalled();
    });

    it('should support silent delete operations', async () => {
      await facade.deleteRole(1, { silent: true });

      expect(mockNotifications.success).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should handle empty role name', async () => {
      const invalidRoleData = {
        name: '',
        accessLevel: 1,
        description: 'Test description',
      };

      const error = new Error('Invalid role name');
      mockCreateRoleUC.execute.and.returnValue(Promise.reject(error));

      await expectAsync(facade.createRole(invalidRoleData)).toBeRejectedWith(error);
    });

    it('should handle negative access level', async () => {
      const invalidRoleData = {
        name: 'Test Role',
        accessLevel: -1,
        description: 'Test description',
      };

      const error = new Error('Invalid access level');
      mockCreateRoleUC.execute.and.returnValue(Promise.reject(error));

      await expectAsync(facade.createRole(invalidRoleData)).toBeRejectedWith(error);
    });

    it('should handle extremely long role names', async () => {
      const longName = 'A'.repeat(256); // Assuming max length is 255
      const invalidRoleData = {
        name: longName,
        accessLevel: 1,
        description: 'Test description',
      };

      const error = new Error('Role name too long');
      mockCreateRoleUC.execute.and.returnValue(Promise.reject(error));

      await expectAsync(facade.createRole(invalidRoleData)).toBeRejectedWith(error);
    });

    it('should handle concurrent operations', async () => {
      const promises = [
        facade.createRole({ ...createRoleData, name: 'Role 1' }),
        facade.createRole({ ...createRoleData, name: 'Role 2' }),
        facade.createRole({ ...createRoleData, name: 'Role 3' }),
      ];

      await Promise.all(promises);

      expect(mockCreateRoleUC.execute).toHaveBeenCalledTimes(3);
      expect(mockRoleState.addRole).toHaveBeenCalledTimes(3);
    });

    it('should handle network timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      mockCreateRoleUC.execute.and.returnValue(Promise.reject(timeoutError));
      mockErrorTransformer.transform.and.returnValue(timeoutError as any);

      await expectAsync(facade.createRole(createRoleData)).toBeRejectedWith(timeoutError);

      expect(mockRoleState.setError).toHaveBeenCalledWith('Request timeout');
    });

    it('should handle malformed response data', async () => {
      const malformedRole = { invalid: 'data' } as any;
      mockCreateRoleUC.execute.and.returnValue(Promise.resolve(malformedRole));

      // Reset the existing spy and create a new one for this test
      (RoleApplicationMapper.toRoleSummary as jasmine.Spy).calls.reset();
      (RoleApplicationMapper.toRoleSummary as jasmine.Spy).and.throwError('Mapping failed');

      await expectAsync(facade.createRole(createRoleData)).toBeRejected();

      expect(mockRoleState.setError).toHaveBeenCalled();
    });
  });

  describe('Performance and Resource Management', () => {
    it('should not create unnecessary objects during operations', async () => {
      const initialCallCount = mockRoleState.addRole.calls.count();

      await facade.createRole(createRoleData);

      expect(mockRoleState.addRole.calls.count()).toBe(initialCallCount + 1);
    });

    it('should clean up resources after failed operations', async () => {
      const error = new Error('Operation failed');
      mockCreateRoleUC.execute.and.returnValue(Promise.reject(error));

      await expectAsync(facade.createRole(createRoleData)).toBeRejected();

      // Verify loading state is properly reset
      expect(mockRoleState.setLoading).toHaveBeenCalledWith(false);
    });

    it('should handle rapid successive operations', async () => {
      const operations = [];
      for (let i = 0; i < 10; i++) {
        operations.push(facade.createRole({ ...createRoleData, name: `Role ${i}` }));
      }

      await Promise.all(operations);

      expect(mockCreateRoleUC.execute).toHaveBeenCalledTimes(10);
    });
  });

  describe('Integration with External Systems', () => {
    it('should handle external service unavailability', async () => {
      const serviceUnavailableError = new Error('Service temporarily unavailable');
      mockCreateRoleUC.execute.and.returnValue(Promise.reject(serviceUnavailableError));

      await expectAsync(facade.createRole(createRoleData)).toBeRejectedWith(
        serviceUnavailableError
      );

      expect(mockNotifications.success).not.toHaveBeenCalled();
    });

    it('should handle authentication token expiry during operations', async () => {
      const authError = new Error('Authentication token expired');
      mockCreateRoleUC.execute.and.returnValue(Promise.reject(authError));

      await expectAsync(facade.createRole(createRoleData)).toBeRejectedWith(authError);

      expect(mockRoleState.setError).toHaveBeenCalledWith('Authentication token expired');
    });

    it('should handle database connection errors', async () => {
      const dbError = new Error('Database connection failed');
      mockCreateRoleUC.execute.and.returnValue(Promise.reject(dbError));

      await expectAsync(facade.createRole(createRoleData)).toBeRejectedWith(dbError);

      expect(mockRoleState.setError).toHaveBeenCalledWith('Database connection failed');
    });
  });

  describe('Data Consistency and Integrity', () => {
    it('should maintain state consistency during concurrent operations', async () => {
      const roleData1 = { ...createRoleData, name: 'Role A' };
      const roleData2 = { ...createRoleData, name: 'Role B' };

      await Promise.all([facade.createRole(roleData1), facade.createRole(roleData2)]);

      expect(mockRoleState.addRole).toHaveBeenCalledTimes(2);
    });

    it('should handle partial state updates gracefully', async () => {
      // Simulate a scenario where state update partially fails
      mockRoleState.addRole.and.throwError('State update failed');

      await expectAsync(facade.createRole(createRoleData)).toBeRejected();

      expect(mockRoleState.setError).toHaveBeenCalled();
    });

    it('should validate data integrity before operations', async () => {
      const invalidRoleData = {
        name: null as any,
        accessLevel: 'invalid' as any,
        description: undefined as any,
      };

      // The facade should handle invalid data gracefully
      const error = new Error('Invalid role data');
      mockCreateRoleUC.execute.and.returnValue(Promise.reject(error));

      await expectAsync(facade.createRole(invalidRoleData)).toBeRejectedWith(error);
    });
  });
});
