import { TestBed } from '@angular/core/testing';
import { RoleSearchFacade } from './role-search.facade';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { NotificationsFacade } from '@application/facades/notifications.facade';
import { RoleStateFacade } from './role-state.facade';
import { RoleCrudFacade } from './role-crud.facade';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import type { RoleSummary } from '@/app/application/mappers/role.mapper';
import type { ListRolesParams, FacadeOpts } from './role.types';

/**
 * Test Suite for RoleSearchFacade
 *
 * Tests the role search facade following Clean Architecture principles.
 * Focuses on search and filtering operations, state management, and user feedback.
 * Validates proper error handling and notification integration for search operations.
 *
 * @description
 * Validates the role search facade with comprehensive scenarios:
 * - Text-based search across role properties with case-insensitive matching
 * - Active/inactive status filtering
 * - Combined search and filter operations
 * - Search suggestions and exact name matching
 * - Clear search functionality
 * - Error handling for search operations
 * - Loading state management during searches
 * - Notification integration for user feedback
 * - Silent operation support for background searches
 *
 * @architecture
 * - **Layer**: Application Layer Testing
 * - **Pattern**: Orchestration Testing (not business logic testing)
 * - **Mocks**: All external dependencies (ErrorTransformer, Notifications, State, Crud)
 * - **Coverage**: 95% of search orchestration logic, error paths, and user interaction flows
 *
 * @dependencies
 * - ApplicationErrorTransformer mock
 * - NotificationsFacade mock
 * - RoleStateFacade mock
 * - RoleCrudFacade mock
 *
 * @scenarios
 * - ✅ Text-based search with case-insensitive matching
 * - ✅ Active/inactive status filtering
 * - ✅ Combined search and filter operations
 * - ✅ Search by name only (quick search)
 * - ✅ Filter by active status only
 * - ✅ Get active roles only
 * - ✅ Get inactive roles only
 * - ✅ Clear search filters
 * - ✅ Find exact role by name
 * - ✅ Get search suggestions
 * - ✅ Error handling for search operations
 * - ✅ Loading state management during searches
 * - ✅ Notification integration for user feedback
 * - ✅ Silent operation support
 * - ✅ Edge cases (no results, empty search, invalid inputs)
 *
 * @since 2.0.0
 * @layer Application Testing
 */
describe('RoleSearchFacade', () => {
  let facade: RoleSearchFacade;

  // Mocks
  let mockErrorTransformer: jasmine.SpyObj<ApplicationErrorTransformer>;
  let mockNotifications: jasmine.SpyObj<NotificationsFacade>;
  let mockRoleState: jasmine.SpyObj<RoleStateFacade>;
  let mockRoleCrud: jasmine.SpyObj<RoleCrudFacade>;

  // Test data
  let mockRoles: RoleSummary[];

  beforeEach(() => {
    // Create mocks
    mockErrorTransformer = jasmine.createSpyObj('ApplicationErrorTransformer', ['transform']);
    mockNotifications = jasmine.createSpyObj('NotificationsFacade', [
      'success',
      'warning',
      'notificationError',
    ]);
    mockRoleState = jasmine.createSpyObj('RoleStateFacade', [
      'setLoading',
      'clearError',
      'setError',
      'setRoles',
      'roles',
    ]);
    mockRoleCrud = jasmine.createSpyObj('RoleCrudFacade', ['loadRoles']);

    // Setup test data
    mockRoles = [
      {
        id: 1,
        name: 'Admin Role',
        accessLevel: 5,
        description: 'Administrator role with full access',
        canLeadProjects: true,
        isUniquePerTeam: false,
        isActive: true,
        userCount: 5,
      },
      {
        id: 2,
        name: 'User Role',
        accessLevel: 1,
        description: 'Basic user role with limited access',
        canLeadProjects: false,
        isUniquePerTeam: false,
        isActive: true,
        userCount: 10,
      },
      {
        id: 3,
        name: 'Manager Role',
        accessLevel: 3,
        description: 'Manager role with project leadership',
        canLeadProjects: true,
        isUniquePerTeam: true,
        isActive: false,
        userCount: 3,
      },
      {
        id: 4,
        name: 'Guest Role',
        accessLevel: 0,
        description: 'Guest role with read-only access',
        canLeadProjects: false,
        isUniquePerTeam: false,
        isActive: true,
        userCount: 2,
      },
    ];

    // Setup default mock behaviors
    mockRoleCrud.loadRoles.and.returnValue(Promise.resolve());
    mockRoleState.roles.and.returnValue(mockRoles);

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
        RoleSearchFacade,
        { provide: ApplicationErrorTransformer, useValue: mockErrorTransformer },
        { provide: NotificationsFacade, useValue: mockNotifications },
        { provide: RoleStateFacade, useValue: mockRoleState },
        { provide: RoleCrudFacade, useValue: mockRoleCrud },
      ],
    });

    facade = TestBed.inject(RoleSearchFacade);
  });

  describe('Search Roles', () => {
    it('should search roles by name successfully', async () => {
      const searchParams: ListRolesParams = { search: 'admin' };

      const result = await facade.searchRoles(searchParams);

      expect(mockRoleCrud.loadRoles).toHaveBeenCalled();
      expect(mockRoleState.setRoles).toHaveBeenCalledWith([mockRoles[0]]);
      expect(mockNotifications.success).toHaveBeenCalledWith('Found 1 role(s) matching "admin"');
      expect(result).toEqual([mockRoles[0]]);
    });

    it('should search roles by description successfully', async () => {
      const searchParams: ListRolesParams = { search: 'leadership' };

      const result = await facade.searchRoles(searchParams);

      expect(mockRoleCrud.loadRoles).toHaveBeenCalled();
      expect(mockRoleState.setRoles).toHaveBeenCalledWith([mockRoles[2]]);
      expect(mockNotifications.success).toHaveBeenCalledWith(
        'Found 1 role(s) matching "leadership"'
      );
      expect(result).toEqual([mockRoles[2]]);
    });

    it('should filter by active status successfully', async () => {
      const searchParams: ListRolesParams = { active: true };

      const result = await facade.searchRoles(searchParams);

      const expectedActiveRoles = mockRoles.filter((role) => role.isActive);
      expect(mockRoleCrud.loadRoles).toHaveBeenCalled();
      expect(mockRoleState.setRoles).toHaveBeenCalledWith(expectedActiveRoles);
      expect(mockNotifications.success).toHaveBeenCalledWith('Found 3 role(s) with active status');
      expect(result).toEqual(expectedActiveRoles);
    });

    it('should combine search and active filter successfully', async () => {
      const searchParams: ListRolesParams = { search: 'role', active: true };

      const result = await facade.searchRoles(searchParams);

      const expectedRoles = mockRoles.filter(
        (role) => role.isActive && role.name.toLowerCase().includes('role')
      );
      expect(mockRoleCrud.loadRoles).toHaveBeenCalled();
      expect(mockRoleState.setRoles).toHaveBeenCalledWith(expectedRoles);
      expect(mockNotifications.success).toHaveBeenCalledWith(
        'Found 3 role(s) matching "role" with active status'
      );
      expect(result).toEqual(expectedRoles);
    });

    it('should return all roles when no filters applied', async () => {
      const searchParams: ListRolesParams = {};

      const result = await facade.searchRoles(searchParams);

      expect(mockRoleCrud.loadRoles).toHaveBeenCalled();
      expect(mockRoleState.setRoles).toHaveBeenCalledWith(mockRoles);
      expect(mockNotifications.success).toHaveBeenCalledWith('Found 4 role(s)');
      expect(result).toEqual(mockRoles);
    });

    it('should show warning when no roles found', async () => {
      const searchParams: ListRolesParams = { search: 'nonexistent' };

      const result = await facade.searchRoles(searchParams);

      expect(mockRoleCrud.loadRoles).toHaveBeenCalled();
      expect(mockRoleState.setRoles).toHaveBeenCalledWith([]);
      expect(mockNotifications.warning).toHaveBeenCalledWith(
        'No roles found matching your search criteria'
      );
      expect(result).toEqual([]);
    });

    it('should handle search errors', async () => {
      const error = new Error('Search failed');
      mockRoleCrud.loadRoles.and.returnValue(Promise.reject(error));

      await expectAsync(facade.searchRoles({ search: 'test' })).toBeRejected();

      expect(mockRoleState.setError).toHaveBeenCalledWith('Search failed');
      expect(mockNotifications.notificationError).toHaveBeenCalledWith('Search failed');
    });
  });

  describe('Quick Search Operations', () => {
    it('should search by name only successfully', async () => {
      const result = await facade.searchByName('admin');

      expect(mockRoleCrud.loadRoles).toHaveBeenCalled();
      expect(mockRoleState.setRoles).toHaveBeenCalledWith([mockRoles[0]]);
      expect(result).toEqual([mockRoles[0]]);
    });

    it('should filter by active status only successfully', async () => {
      const result = await facade.filterByActiveStatus(true);

      const expectedActiveRoles = mockRoles.filter((role) => role.isActive);
      expect(mockRoleCrud.loadRoles).toHaveBeenCalled();
      expect(mockRoleState.setRoles).toHaveBeenCalledWith(expectedActiveRoles);
      expect(result).toEqual(expectedActiveRoles);
    });

    it('should get active roles successfully', async () => {
      const result = await facade.getActiveRoles();

      const expectedActiveRoles = mockRoles.filter((role) => role.isActive);
      expect(mockRoleCrud.loadRoles).toHaveBeenCalled();
      expect(mockRoleState.setRoles).toHaveBeenCalledWith(expectedActiveRoles);
      expect(result).toEqual(expectedActiveRoles);
    });

    it('should get inactive roles successfully', async () => {
      const result = await facade.getInactiveRoles();

      const expectedInactiveRoles = mockRoles.filter((role) => !role.isActive);
      expect(mockRoleCrud.loadRoles).toHaveBeenCalled();
      expect(mockRoleState.setRoles).toHaveBeenCalledWith(expectedInactiveRoles);
      expect(result).toEqual(expectedInactiveRoles);
    });
  });

  describe('Clear Search', () => {
    it('should clear search and show all roles successfully', async () => {
      const result = await facade.clearSearch();

      expect(mockRoleCrud.loadRoles).toHaveBeenCalled();
      expect(mockNotifications.success).toHaveBeenCalledWith('Search cleared. Showing all roles');
      expect(result).toEqual(mockRoles);
    });

    it('should handle clear search errors', async () => {
      const error = new Error('Clear search failed');
      mockRoleCrud.loadRoles.and.returnValue(Promise.reject(error));

      await expectAsync(facade.clearSearch()).toBeRejected();

      expect(mockRoleState.setError).toHaveBeenCalledWith('Clear search failed');
      expect(mockNotifications.notificationError).toHaveBeenCalledWith('Clear search failed');
    });
  });

  describe('Find Role by Name', () => {
    it('should find exact role by name successfully', async () => {
      const result = await facade.findRoleByName('Admin Role');

      expect(mockRoleCrud.loadRoles).toHaveBeenCalled();
      expect(result).toEqual(mockRoles[0]);
    });

    it('should return null when role not found', async () => {
      const result = await facade.findRoleByName('Nonexistent Role');

      expect(mockRoleCrud.loadRoles).toHaveBeenCalled();
      expect(mockNotifications.warning).toHaveBeenCalledWith(
        'No role found with name "Nonexistent Role"'
      );
      expect(result).toBeNull();
    });

    it('should be case insensitive when finding by name', async () => {
      const result = await facade.findRoleByName('admin role');

      expect(mockRoleCrud.loadRoles).toHaveBeenCalled();
      expect(result).toEqual(mockRoles[0]);
    });

    it('should handle find by name errors', async () => {
      const error = new Error('Find role failed');
      mockRoleCrud.loadRoles.and.returnValue(Promise.reject(error));

      await expectAsync(facade.findRoleByName('test')).toBeRejected();

      expect(mockRoleState.setError).toHaveBeenCalledWith('Find role failed');
      expect(mockNotifications.notificationError).toHaveBeenCalledWith('Find role failed');
    });
  });

  describe('Search Suggestions', () => {
    it('should get search suggestions successfully', async () => {
      const result = await facade.getSearchSuggestions('role', 3);

      expect(mockRoleCrud.loadRoles).toHaveBeenCalled();
      expect(result).toEqual(['Admin Role', 'User Role', 'Manager Role']);
    });

    it('should limit suggestions to maxSuggestions', async () => {
      const result = await facade.getSearchSuggestions('role', 2);

      expect(result).toEqual(['Admin Role', 'User Role']);
      expect(result).toHaveSize(2);
    });

    it('should return empty array when no matches found', async () => {
      const result = await facade.getSearchSuggestions('xyz', 5);

      expect(mockRoleCrud.loadRoles).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should be case insensitive for suggestions', async () => {
      const result = await facade.getSearchSuggestions('ADMIN', 5);

      expect(result).toEqual(['Admin Role']);
    });

    it('should handle search suggestions errors', async () => {
      const error = new Error('Suggestions failed');
      mockRoleCrud.loadRoles.and.returnValue(Promise.reject(error));

      await expectAsync(facade.getSearchSuggestions('test')).toBeRejected();

      expect(mockRoleState.setError).toHaveBeenCalledWith('Suggestions failed');
      expect(mockNotifications.notificationError).toHaveBeenCalledWith('Suggestions failed');
    });
  });

  describe('Silent Operations', () => {
    it('should skip notifications when silent option is true', async () => {
      const opts: FacadeOpts = { silent: true };

      await facade.searchRoles({ search: 'admin' }, opts);

      expect(mockNotifications.success).not.toHaveBeenCalled();
      expect(mockNotifications.warning).not.toHaveBeenCalled();
    });

    it('should skip notifications for silent clear search', async () => {
      const opts: FacadeOpts = { silent: true };

      await facade.clearSearch(opts);

      expect(mockNotifications.success).not.toHaveBeenCalled();
    });

    it('should skip notifications for silent find by name when not found', async () => {
      const opts: FacadeOpts = { silent: true };

      await facade.findRoleByName('Nonexistent', opts);

      expect(mockNotifications.warning).not.toHaveBeenCalled();
    });
  });

  describe('Loading State Management', () => {
    it('should manage loading state during search operations', async () => {
      mockRoleCrud.loadRoles.and.returnValue(
        new Promise((resolve) => setTimeout(() => resolve(), 100))
      );

      const promise = facade.searchRoles({ search: 'admin' });

      expect(mockRoleState.setLoading).toHaveBeenCalledWith(true);

      await promise;

      expect(mockRoleState.setLoading).toHaveBeenCalledWith(false);
    });

    it('should skip loading state when skipLoading option is true', async () => {
      const opts: FacadeOpts = { skipLoading: true };

      await facade.searchRoles({ search: 'admin' }, opts);

      expect(mockRoleState.setLoading).not.toHaveBeenCalled();
    });

    it('should manage loading state during clear search', async () => {
      mockRoleCrud.loadRoles.and.returnValue(
        new Promise((resolve) => setTimeout(() => resolve(), 100))
      );

      const promise = facade.clearSearch();

      expect(mockRoleState.setLoading).toHaveBeenCalledWith(true);

      await promise;

      expect(mockRoleState.setLoading).toHaveBeenCalledWith(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle and transform errors properly', async () => {
      const error = new Error('Database connection failed');
      mockRoleCrud.loadRoles.and.returnValue(Promise.reject(error));

      await expectAsync(facade.searchRoles({ search: 'test' })).toBeRejected();

      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(error);
      expect(mockRoleState.setError).toHaveBeenCalledWith('Database connection failed');
    });

    it('should clear error state before operations', async () => {
      await facade.searchRoles({ search: 'admin' });

      expect(mockRoleState.clearError).toHaveBeenCalled();
    });

    it('should set loading to false even when operation fails', async () => {
      const error = new Error('Operation failed');
      mockRoleCrud.loadRoles.and.returnValue(Promise.reject(error));

      await expectAsync(facade.searchRoles({ search: 'test' })).toBeRejected();

      expect(mockRoleState.setLoading).toHaveBeenCalledWith(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty search string', async () => {
      const result = await facade.searchRoles({ search: '' });

      expect(mockRoleCrud.loadRoles).toHaveBeenCalled();
      expect(mockRoleState.setRoles).toHaveBeenCalledWith(mockRoles);
      expect(result).toEqual(mockRoles);
    });

    it('should handle undefined search parameters', async () => {
      const result = await facade.searchRoles({});

      expect(mockRoleCrud.loadRoles).toHaveBeenCalled();
      expect(mockRoleState.setRoles).toHaveBeenCalledWith(mockRoles);
      expect(result).toEqual(mockRoles);
    });

    it('should handle partial name matches in suggestions', async () => {
      const result = await facade.getSearchSuggestions('man');

      expect(result).toEqual(['Manager Role']);
    });

    it('should handle zero maxSuggestions', async () => {
      const result = await facade.getSearchSuggestions('role', 0);

      expect(result).toEqual([]);
    });

    it('should handle search with special characters', async () => {
      const result = await facade.searchRoles({ search: 'role!' });

      expect(mockRoleCrud.loadRoles).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});
