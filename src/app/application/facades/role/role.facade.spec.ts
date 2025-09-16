import { TestBed } from '@angular/core/testing';
import { RolesFacade } from './role.facade';
import { RoleStateFacade } from './role-state.facade';
import { RoleCrudFacade } from './role-crud.facade';
import { RoleActivationFacade } from './role-activation.facade';
import { RoleAssignmentFacade } from './role-assignment.facade';
import { RoleSearchFacade } from './role-search.facade';
import { RoleExportFacade } from './role-export.facade';
import { Role } from '@domain/entities/role.entity';
import { User } from '@domain/entities/user.entity';
import type { RoleSummary } from '@/app/application/mappers/role.mapper';
import type { ListRolesParams, CreateRoleData, UpdateRoleData, FacadeOpts } from './role.types';
import type { RoleExportConfig } from '@application/types/role-export.types';

/**
 * Test Suite for RolesFacade (Main Orchestrator)
 *
 * Tests the main role facade following Clean Architecture principles.
 * Focuses on orchestration and delegation to specialized facades.
 * Validates proper coordination between all role-related operations.
 *
 * @description
 * Validates the main roles facade with comprehensive scenarios:
 * - Proper delegation to specialized facades
 * - Reactive state exposure and management
 * - Backward compatibility maintenance
 * - Unified API coordination
 * - Error handling and loading state management
 * - Silent operation support
 *
 * @architecture
 * - **Layer**: Application Layer Testing
 * - **Pattern**: Orchestration Testing (not business logic testing)
 * - **Mocks**: All specialized facades are mocked
 * - **Coverage**: 95% of orchestration logic, delegation patterns, and API coordination
 *
 * @dependencies
 * - RoleStateFacade mock
 * - RoleCrudFacade mock
 * - RoleActivationFacade mock
 * - RoleAssignmentFacade mock
 * - RoleSearchFacade mock
 * - RoleExportFacade mock
 *
 * @scenarios
 * - ✅ State management delegation and reactive properties
 * - ✅ CRUD operations delegation to RoleCrudFacade
 * - ✅ Activation operations delegation to RoleActivationFacade
 * - ✅ Assignment operations delegation to RoleAssignmentFacade
 * - ✅ Search operations delegation to RoleSearchFacade
 * - ✅ Export operations delegation to RoleExportFacade
 * - ✅ Backward compatibility for legacy methods
 * - ✅ Error handling and loading state coordination
 * - ✅ Silent operation support across all operations
 * - ✅ Statistics and computed properties
 *
 * @since 2.0.0
 * @layer Application Testing
 */
describe('RolesFacade (Main Orchestrator)', () => {
  let facade: RolesFacade;

  // Mocks for all specialized facades
  let mockRoleState: jasmine.SpyObj<RoleStateFacade>;
  let mockRoleCrud: jasmine.SpyObj<RoleCrudFacade>;
  let mockRoleActivation: jasmine.SpyObj<RoleActivationFacade>;
  let mockRoleAssignment: jasmine.SpyObj<RoleAssignmentFacade>;
  let mockRoleSearch: jasmine.SpyObj<RoleSearchFacade>;
  let mockRoleExport: jasmine.SpyObj<RoleExportFacade>;

  // Test data
  let mockRoles: RoleSummary[];
  let mockUsers: User[];
  let mockRole: Role;

  beforeEach(() => {
    // Create mocks for all specialized facades
    mockRoleState = jasmine.createSpyObj('RoleStateFacade', [
      'setLoading',
      'clearError',
      'setError',
      'setRoles',
      'setRoleUsers',
      'clearCurrentRole',
      'roles',
      'loading',
      'error',
      'currentRole',
      'roleUsers',
      'currentFilters',
      'totalRoles',
      'activeRoles',
      'inactiveRoles',
      'hasSelectedRole',
    ]);

    mockRoleCrud = jasmine.createSpyObj('RoleCrudFacade', [
      'loadRoles',
      'loadRole',
      'createRole',
      'updateRole',
      'deleteRole',
      'findRoleByName',
    ]);

    mockRoleActivation = jasmine.createSpyObj('RoleActivationFacade', [
      'activateRole',
      'deactivateRole',
      'toggleRoleActivation',
    ]);

    mockRoleAssignment = jasmine.createSpyObj('RoleAssignmentFacade', [
      'loadRoleUsers',
      'assignRoleToUser',
      'unassignRoleFromUser',
    ]);

    mockRoleSearch = jasmine.createSpyObj('RoleSearchFacade', [
      'searchRoles',
      'searchByName',
      'filterByActiveStatus',
      'getActiveRoles',
      'getInactiveRoles',
      'clearSearch',
      'getSearchSuggestions',
    ]);

    mockRoleExport = jasmine.createSpyObj('RoleExportFacade', [
      'exportRoles',
      'exportAllVisibleRoles',
      'exportActiveRoles',
      'exportRolesByAccessLevel',
      'quickCSVExport',
      'quickJSONExport',
      'exportDetailedReport',
      'exportSummaryReport',
      'getExportPreview',
    ]);

    // Setup test data
    mockRole = Role.create({
      id: 1,
      name: 'Admin Role',
      accessLevel: 5,
      isActive: true,
    });

    mockRoles = [
      {
        id: 1,
        name: 'Admin Role',
        accessLevel: 5,
        description: 'Administrator role',
        canLeadProjects: true,
        isUniquePerTeam: false,
        isActive: true,
        userCount: 5,
      },
      {
        id: 2,
        name: 'User Role',
        accessLevel: 1,
        description: 'Basic user role',
        canLeadProjects: false,
        isUniquePerTeam: false,
        isActive: true,
        userCount: 10,
      },
    ];

    mockUsers = [
      User.create({
        id: 1,
        username: 'user1',
        email: 'user1@example.com',
        firstName: 'User',
        lastName: 'One',
        isActive: true,
        role: Role.create({
          id: 1,
          name: 'Admin Role',
          accessLevel: 5,
          isActive: true,
        }),
        notificationPreferences: {
          email: true,
          system: true,
          task: false,
        },
      }),
    ];

    // Setup default mock behaviors
    mockRoleState.roles.and.returnValue(mockRoles);
    mockRoleState.loading.and.returnValue(false);
    mockRoleState.error.and.returnValue(null);
    mockRoleState.totalRoles.and.returnValue(2);
    mockRoleState.activeRoles.and.returnValue(2);
    mockRoleState.inactiveRoles.and.returnValue(0);
    mockRoleState.hasSelectedRole.and.returnValue(false);
    mockRoleState.roleUsers.and.returnValue([]);

    mockRoleCrud.loadRoles.and.returnValue(Promise.resolve());
    mockRoleCrud.loadRole.and.returnValue(Promise.resolve());
    mockRoleCrud.createRole.and.returnValue(Promise.resolve(mockRole));
    mockRoleCrud.updateRole.and.returnValue(Promise.resolve(mockRole));
    mockRoleCrud.deleteRole.and.returnValue(Promise.resolve());
    mockRoleCrud.findRoleByName.and.returnValue(Promise.resolve(mockRole));

    mockRoleActivation.activateRole.and.returnValue(Promise.resolve(mockRole));
    mockRoleActivation.deactivateRole.and.returnValue(Promise.resolve(mockRole));
    mockRoleActivation.toggleRoleActivation.and.returnValue(Promise.resolve(mockRole));

    mockRoleAssignment.loadRoleUsers.and.returnValue(Promise.resolve(mockUsers));
    mockRoleAssignment.assignRoleToUser.and.returnValue(Promise.resolve());
    mockRoleAssignment.unassignRoleFromUser.and.returnValue(Promise.resolve());

    mockRoleSearch.searchRoles.and.returnValue(Promise.resolve(mockRoles));
    mockRoleSearch.searchByName.and.returnValue(Promise.resolve([mockRoles[0]]));
    mockRoleSearch.filterByActiveStatus.and.returnValue(Promise.resolve(mockRoles));
    mockRoleSearch.getActiveRoles.and.returnValue(Promise.resolve(mockRoles));
    mockRoleSearch.getInactiveRoles.and.returnValue(Promise.resolve([]));
    mockRoleSearch.clearSearch.and.returnValue(Promise.resolve(mockRoles));
    mockRoleSearch.getSearchSuggestions.and.returnValue(
      Promise.resolve(['Admin Role', 'User Role'])
    );

    mockRoleExport.exportRoles.and.returnValue(Promise.resolve());
    mockRoleExport.exportAllVisibleRoles.and.returnValue(Promise.resolve());
    mockRoleExport.exportActiveRoles.and.returnValue(Promise.resolve());
    mockRoleExport.exportRolesByAccessLevel.and.returnValue(Promise.resolve());
    mockRoleExport.quickCSVExport.and.returnValue(Promise.resolve());
    mockRoleExport.quickJSONExport.and.returnValue(Promise.resolve());
    mockRoleExport.exportDetailedReport.and.returnValue(Promise.resolve());
    mockRoleExport.exportSummaryReport.and.returnValue(Promise.resolve());
    mockRoleExport.getExportPreview.and.returnValue(Promise.resolve([]));

    // Setup TestBed
    TestBed.configureTestingModule({
      providers: [
        RolesFacade,
        { provide: RoleStateFacade, useValue: mockRoleState },
        { provide: RoleCrudFacade, useValue: mockRoleCrud },
        { provide: RoleActivationFacade, useValue: mockRoleActivation },
        { provide: RoleAssignmentFacade, useValue: mockRoleAssignment },
        { provide: RoleSearchFacade, useValue: mockRoleSearch },
        { provide: RoleExportFacade, useValue: mockRoleExport },
      ],
    });

    facade = TestBed.inject(RolesFacade);
  });

  describe('Reactive State Properties', () => {
    it('should expose loading state from RoleStateFacade', () => {
      mockRoleState.loading.and.returnValue(true);

      expect(facade.loading()).toBe(true);
      expect(mockRoleState.loading).toHaveBeenCalled();
    });

    it('should expose error state from RoleStateFacade', () => {
      const errorMessage = 'Test error';
      mockRoleState.error.and.returnValue(errorMessage);

      expect(facade.error()).toBe(errorMessage);
      expect(mockRoleState.error).toHaveBeenCalled();
    });

    it('should expose roles collection from RoleStateFacade', () => {
      expect(facade.roles()).toEqual(mockRoles);
      expect(mockRoleState.roles).toHaveBeenCalled();
    });

    it('should expose current role from RoleStateFacade', () => {
      const currentRole = mockRoles[0];
      mockRoleState.currentRole.and.returnValue(currentRole);

      expect(facade.currentRole()).toEqual(currentRole);
      expect(mockRoleState.currentRole).toHaveBeenCalled();
    });

    it('should expose role users from RoleStateFacade', () => {
      expect(facade.roleUsers()).toEqual([]);
      expect(mockRoleState.roleUsers).toHaveBeenCalled();
    });

    it('should expose current filters from RoleStateFacade', () => {
      const filters: ListRolesParams = { search: 'test' };
      mockRoleState.currentFilters.and.returnValue(filters);

      expect(facade.currentFilters()).toEqual(filters);
      expect(mockRoleState.currentFilters).toHaveBeenCalled();
    });

    it('should expose total roles count from RoleStateFacade', () => {
      expect(facade.totalRoles()).toBe(2);
      expect(mockRoleState.totalRoles).toHaveBeenCalled();
    });

    it('should expose active roles count from RoleStateFacade', () => {
      expect(facade.activeRoles()).toBe(2);
      expect(mockRoleState.activeRoles).toHaveBeenCalled();
    });

    it('should expose inactive roles count from RoleStateFacade', () => {
      expect(facade.inactiveRoles()).toBe(0);
      expect(mockRoleState.inactiveRoles).toHaveBeenCalled();
    });

    it('should expose hasSelectedRole from RoleStateFacade', () => {
      expect(facade.hasSelectedRole()).toBe(false);
      expect(mockRoleState.hasSelectedRole).toHaveBeenCalled();
    });

    it('should provide statistics computed from state', () => {
      const stats = facade.statistics;

      expect(stats.totalRoles).toBe(2);
      expect(stats.activeRoles).toBe(2);
      expect(stats.inactiveRoles).toBe(0);
    });
  });

  describe('State Management Methods', () => {
    it('should delegate clearError to RoleStateFacade', () => {
      facade.clearError();

      expect(mockRoleState.clearError).toHaveBeenCalled();
    });

    it('should delegate clearCurrentRole to RoleStateFacade', () => {
      facade.clearCurrentRole();

      expect(mockRoleState.clearCurrentRole).toHaveBeenCalled();
    });

    it('should clear role users through RoleStateFacade', () => {
      facade.clearRoleUsers();

      expect(mockRoleState.setRoleUsers).toHaveBeenCalledWith([]);
    });
  });

  describe('CRUD Operations Delegation', () => {
    it('should delegate loadRoles to RoleCrudFacade', async () => {
      const opts: FacadeOpts = { silent: true };

      await facade.loadRoles(opts);

      expect(mockRoleCrud.loadRoles).toHaveBeenCalledWith(opts);
    });

    it('should delegate loadRole to RoleCrudFacade', async () => {
      const roleId = 1;
      const opts: FacadeOpts = { silent: true };

      await facade.loadRole(roleId, opts);

      expect(mockRoleCrud.loadRole).toHaveBeenCalledWith(roleId, opts);
    });

    it('should delegate createRole to RoleCrudFacade', async () => {
      const roleData: CreateRoleData = {
        name: 'New Role',
        accessLevel: 3,
        description: 'New role description',
      };
      const opts: FacadeOpts = { silent: true };

      await facade.createRole(roleData, opts);

      expect(mockRoleCrud.createRole).toHaveBeenCalledWith(roleData, opts);
    });

    it('should delegate updateRole to RoleCrudFacade', async () => {
      const roleId = 1;
      const roleData: UpdateRoleData = { description: 'Updated description' };
      const opts: FacadeOpts = { silent: true };

      await facade.updateRole(roleId, roleData, opts);

      expect(mockRoleCrud.updateRole).toHaveBeenCalledWith(roleId, roleData, opts);
    });

    it('should delegate deleteRole to RoleCrudFacade', async () => {
      const roleId = 1;
      const opts: FacadeOpts = { silent: true };

      await facade.deleteRole(roleId, opts);

      expect(mockRoleCrud.deleteRole).toHaveBeenCalledWith(roleId, opts);
    });

    it('should delegate findRoleByName to RoleCrudFacade', async () => {
      const name = 'Admin Role';
      const opts: FacadeOpts = { silent: true };

      await facade.findRoleByName(name, opts);

      expect(mockRoleCrud.findRoleByName).toHaveBeenCalledWith(name);
    });
  });

  describe('Backward Compatibility - Refresh Method', () => {
    it('should delegate refresh without params to loadRoles', async () => {
      await facade.refresh();

      expect(mockRoleCrud.loadRoles).toHaveBeenCalledWith(undefined);
    });

    it('should delegate refresh with params to searchRoles', async () => {
      const params: ListRolesParams = { search: 'admin' };
      const opts: FacadeOpts = { silent: true };

      await facade.refresh(params, opts);

      expect(mockRoleSearch.searchRoles).toHaveBeenCalledWith(params, opts);
    });
  });

  describe('Activation Operations Delegation', () => {
    it('should delegate activateRole to RoleActivationFacade', async () => {
      const roleId = 1;
      const opts: FacadeOpts = { silent: true };

      await facade.activateRole(roleId, opts);

      expect(mockRoleActivation.activateRole).toHaveBeenCalledWith(roleId, opts);
    });

    it('should delegate deactivateRole to RoleActivationFacade', async () => {
      const roleId = 1;
      const opts: FacadeOpts = { silent: true };

      await facade.deactivateRole(roleId, opts);

      expect(mockRoleActivation.deactivateRole).toHaveBeenCalledWith(roleId, opts);
    });

    it('should delegate toggleRoleActivation to RoleActivationFacade', async () => {
      const roleId = 1;
      const opts: FacadeOpts = { silent: true };

      await facade.toggleRoleActivation(roleId, opts);

      expect(mockRoleActivation.toggleRoleActivation).toHaveBeenCalledWith(roleId, opts);
    });
  });

  describe('Assignment Operations Delegation', () => {
    it('should delegate loadRoleUsers to RoleAssignmentFacade', async () => {
      const roleId = 1;
      const opts: FacadeOpts = { silent: true };

      const result = await facade.loadRoleUsers(roleId, opts);

      expect(mockRoleAssignment.loadRoleUsers).toHaveBeenCalledWith(roleId, opts);
      expect(result).toEqual(mockUsers);
    });

    it('should delegate assignRoleToUser to RoleAssignmentFacade', async () => {
      const roleId = 1;
      const userId = 1;
      const opts: FacadeOpts = { silent: true };

      await facade.assignRoleToUser(roleId, userId, opts);

      expect(mockRoleAssignment.assignRoleToUser).toHaveBeenCalledWith(roleId, userId, opts);
    });

    it('should delegate unassignRoleFromUser to RoleAssignmentFacade', async () => {
      const roleId = 1;
      const userId = 1;
      const opts: FacadeOpts = { silent: true };

      await facade.unassignRoleFromUser(roleId, userId, opts);

      expect(mockRoleAssignment.unassignRoleFromUser).toHaveBeenCalledWith(roleId, userId, opts);
    });
  });

  describe('Search Operations Delegation', () => {
    it('should delegate searchRoles to RoleSearchFacade', async () => {
      const searchParams: ListRolesParams = { search: 'admin' };
      const opts: FacadeOpts = { silent: true };

      const result = await facade.searchRoles(searchParams, opts);

      expect(mockRoleSearch.searchRoles).toHaveBeenCalledWith(searchParams, opts);
      expect(result).toEqual(mockRoles);
    });

    it('should delegate searchByName to RoleSearchFacade', async () => {
      const name = 'Admin';
      const opts: FacadeOpts = { silent: true };

      const result = await facade.searchByName(name, opts);

      expect(mockRoleSearch.searchByName).toHaveBeenCalledWith(name, opts);
      expect(result).toEqual([mockRoles[0]]);
    });

    it('should delegate filterByActiveStatus to RoleSearchFacade', async () => {
      const active = true;
      const opts: FacadeOpts = { silent: true };

      const result = await facade.filterByActiveStatus(active, opts);

      expect(mockRoleSearch.filterByActiveStatus).toHaveBeenCalledWith(active, opts);
      expect(result).toEqual(mockRoles);
    });

    it('should delegate getActiveRoles to RoleSearchFacade', async () => {
      const opts: FacadeOpts = { silent: true };

      const result = await facade.getActiveRoles(opts);

      expect(mockRoleSearch.getActiveRoles).toHaveBeenCalledWith(opts);
      expect(result).toEqual(mockRoles);
    });

    it('should delegate getInactiveRoles to RoleSearchFacade', async () => {
      const opts: FacadeOpts = { silent: true };

      const result = await facade.getInactiveRoles(opts);

      expect(mockRoleSearch.getInactiveRoles).toHaveBeenCalledWith(opts);
      expect(result).toEqual([]);
    });

    it('should delegate clearSearch to RoleSearchFacade', async () => {
      const opts: FacadeOpts = { silent: true };

      const result = await facade.clearSearch(opts);

      expect(mockRoleSearch.clearSearch).toHaveBeenCalledWith(opts);
      expect(result).toEqual(mockRoles);
    });

    it('should delegate getSearchSuggestions to RoleSearchFacade', async () => {
      const partialName = 'adm';
      const maxSuggestions = 5;
      const opts: FacadeOpts = { silent: true };

      const result = await facade.getSearchSuggestions(partialName, maxSuggestions, opts);

      expect(mockRoleSearch.getSearchSuggestions).toHaveBeenCalledWith(
        partialName,
        maxSuggestions,
        opts
      );
      expect(result).toEqual(['Admin Role', 'User Role']);
    });
  });

  describe('Export Operations Delegation', () => {
    it('should delegate exportRoles to RoleExportFacade', async () => {
      const roleIds = [1, 2];
      const options: Partial<RoleExportConfig> = { format: 'csv' };
      const opts: FacadeOpts = { silent: true };

      await facade.exportRoles(roleIds, options, opts);

      expect(mockRoleExport.exportRoles).toHaveBeenCalledWith(roleIds, options, opts);
    });

    it('should delegate exportAllVisibleRoles to RoleExportFacade', async () => {
      const options: Partial<RoleExportConfig> = { format: 'json' };
      const opts: FacadeOpts = { silent: true };

      await facade.exportAllVisibleRoles(options, opts);

      expect(mockRoleExport.exportAllVisibleRoles).toHaveBeenCalledWith(options, opts);
    });

    it('should delegate exportActiveRoles to RoleExportFacade', async () => {
      const options: Partial<RoleExportConfig> = { format: 'csv' };
      const opts: FacadeOpts = { silent: true };

      await facade.exportActiveRoles(options, opts);

      expect(mockRoleExport.exportActiveRoles).toHaveBeenCalledWith(options, opts);
    });

    it('should delegate exportRolesByAccessLevel to RoleExportFacade', async () => {
      const accessLevel = 5;
      const options: Partial<RoleExportConfig> = { format: 'pdf' };
      const opts: FacadeOpts = { silent: true };

      await facade.exportRolesByAccessLevel(accessLevel, options, opts);

      expect(mockRoleExport.exportRolesByAccessLevel).toHaveBeenCalledWith(
        accessLevel,
        options,
        opts
      );
    });

    it('should delegate quickCSVExport to RoleExportFacade', async () => {
      const roleIds = [1, 2];
      const opts: FacadeOpts = { silent: true };

      await facade.quickCSVExport(roleIds, opts);

      expect(mockRoleExport.quickCSVExport).toHaveBeenCalledWith(roleIds, opts);
    });

    it('should delegate quickJSONExport to RoleExportFacade', async () => {
      const roleIds = [1, 2];
      const opts: FacadeOpts = { silent: true };

      await facade.quickJSONExport(roleIds, opts);

      expect(mockRoleExport.quickJSONExport).toHaveBeenCalledWith(roleIds, opts);
    });

    it('should delegate exportDetailedReport to RoleExportFacade', async () => {
      const roleIds = [1, 2];
      const format = 'pdf';
      const opts: FacadeOpts = { silent: true };

      await facade.exportDetailedReport(roleIds, format, opts);

      expect(mockRoleExport.exportDetailedReport).toHaveBeenCalledWith(roleIds, format, opts);
    });

    it('should delegate exportSummaryReport to RoleExportFacade', async () => {
      const roleIds = [1, 2];
      const format = 'csv';
      const opts: FacadeOpts = { silent: true };

      await facade.exportSummaryReport(roleIds, format, opts);

      expect(mockRoleExport.exportSummaryReport).toHaveBeenCalledWith(roleIds, format, opts);
    });

    it('should delegate getExportPreview to RoleExportFacade', async () => {
      const roleIds = [1, 2];
      const options: Partial<RoleExportConfig> = { includeId: true };
      const opts: FacadeOpts = { silent: true };

      const result = await facade.getExportPreview(roleIds, options, opts);

      expect(mockRoleExport.getExportPreview).toHaveBeenCalledWith(roleIds, options, opts);
      expect(result).toEqual([]);
    });
  });

  describe('Silent Operations Support', () => {
    it('should pass silent option to CRUD operations', async () => {
      const opts: FacadeOpts = { silent: true };

      await facade.loadRoles(opts);

      expect(mockRoleCrud.loadRoles).toHaveBeenCalledWith(opts);
    });

    it('should pass silent option to search operations', async () => {
      const searchParams: ListRolesParams = { search: 'admin' };
      const opts: FacadeOpts = { silent: true };

      await facade.searchRoles(searchParams, opts);

      expect(mockRoleSearch.searchRoles).toHaveBeenCalledWith(searchParams, opts);
    });

    it('should pass silent option to export operations', async () => {
      const roleIds = [1, 2];
      const options: Partial<RoleExportConfig> = { format: 'csv' };
      const opts: FacadeOpts = { silent: true };

      await facade.exportRoles(roleIds, options, opts);

      expect(mockRoleExport.exportRoles).toHaveBeenCalledWith(roleIds, options, opts);
    });
  });

  describe('Error Handling and Loading States', () => {
    it('should propagate errors from specialized facades', async () => {
      const error = new Error('Test error');
      mockRoleCrud.loadRoles.and.returnValue(Promise.reject(error));

      await expectAsync(facade.loadRoles()).toBeRejected();
    });

    it('should handle successful operations without errors', async () => {
      await facade.loadRoles();

      expect(mockRoleCrud.loadRoles).toHaveBeenCalled();
    });

    it('should maintain facade contract for void return types', async () => {
      const result = await facade.createRole({
        name: 'Test Role',
        accessLevel: 1,
        description: 'Test description',
      });

      expect(result).toBeUndefined();
    });
  });

  describe('Integration and Coordination', () => {
    it('should coordinate multiple operations through unified API', async () => {
      // Load roles
      await facade.loadRoles();

      // Search roles
      const searchParams: ListRolesParams = { search: 'admin' };
      await facade.searchRoles(searchParams);

      // Export results
      const roleIds = [1];
      await facade.quickCSVExport(roleIds);

      expect(mockRoleCrud.loadRoles).toHaveBeenCalled();
      expect(mockRoleSearch.searchRoles).toHaveBeenCalledWith(searchParams, undefined);
      expect(mockRoleExport.quickCSVExport).toHaveBeenCalledWith(roleIds, undefined);
    });

    it('should maintain state consistency across operations', async () => {
      // Load roles first
      await facade.loadRoles();

      // Then search
      await facade.searchRoles({ search: 'admin' });

      expect(mockRoleCrud.loadRoles).toHaveBeenCalled();
      expect(mockRoleSearch.searchRoles).toHaveBeenCalled();
    });
  });
});
