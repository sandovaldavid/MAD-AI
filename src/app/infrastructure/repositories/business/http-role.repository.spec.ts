import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { HttpRoleRepository } from './http-role.repository';
import { Role } from '@domain/entities/role.entity';
import { InfrastructureError } from '@infrastructure/errors/infrastructure-error';
import type {
  RoleAssignmentContract,
  UpdateRolePatchContract,
  CreateRoleContract,
} from '@domain/repositories/business/role.contract';
import type { RoleDetailResponseDTO } from '@infrastructure/dtos/roles/detail.dto';
import type { AssignRoleRequestDTO } from '@infrastructure/dtos/roles/assign.dto';
import type { UnassignRoleRequestDTO } from '@infrastructure/dtos/roles/unassign.dto';
import type { CreateRoleRequestDTO } from '@infrastructure/dtos/roles/create.dto';
import type { RequestUpdateRoleDTO } from '@infrastructure/dtos/roles/update.dto';


describe('HttpRoleRepository - Infrastructure Tests', () => {
  let repository: HttpRoleRepository;
  let mockRoleClient: any;
  let mockErrorTransformer: any;
  let mockRoleMapper: any;

  const mockRoleDto: RoleDetailResponseDTO = {
    id: 1,
    name: 'Admin',
    access_level: 5,
    description: 'Administrator role',
    can_lead_projects: true,
    is_unique_per_team: false,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    user_count: 1,
  };

  const mockRole = Role.create({
    id: 1,
    name: 'Admin',
    accessLevel: 5,
    description: 'Administrator role',
    isActive: true,
    userCount: 1,
    isSystemCreated: true, // Allow reserved names from system responses
  });

  beforeEach(() => {
    mockRoleClient = jasmine.createSpyObj('RoleApiClient', [
      'list',
      'getById',
      'create',
      'update',
      'delete',
      'assign',
      'unassign',
    ]);

    mockErrorTransformer = jasmine.createSpyObj('HttpErrorTransformer', ['transformWithDefaults']);

    mockRoleMapper = jasmine.createSpyObj('RoleMapper', ['toEntity']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        HttpRoleRepository,
        { provide: 'RoleApiClient', useValue: mockRoleClient },
        { provide: 'HttpErrorTransformer', useValue: mockErrorTransformer },
        { provide: 'RoleMapper', useValue: mockRoleMapper },
      ],
    });

    repository = TestBed.inject(HttpRoleRepository);
    // Inject mocks manually since we can't override the inject() calls in the constructor
    (repository as any).roleClient = mockRoleClient;
    (repository as any).errorTransformer = mockErrorTransformer;
    
    (repository as any).roleMapper = mockRoleMapper;
  });

  describe('list', () => {
    it('should successfully list roles without parameters', async () => {
      // Given
      const expectedDtos = [mockRoleDto];
      const expectedRoles = [mockRole];

      mockRoleClient.list.and.returnValue(of(expectedDtos));
      mockRoleMapper.toEntity.and.returnValue(mockRole);

      // When
      const result = await repository.list();

      // Then
      expect(mockRoleClient.list).toHaveBeenCalledWith(undefined);
      expect(mockRoleMapper.toEntity).toHaveBeenCalledWith(mockRoleDto);
      expect(result).toEqual(expectedRoles);
    });

    it('should successfully list roles with search parameters', async () => {
      // Given
      const params = { search: 'admin', active: true };
      const expectedDtos = [mockRoleDto];

      mockRoleClient.list.and.returnValue(of(expectedDtos));
      mockRoleMapper.toEntity.and.returnValue(mockRole);

      // When
      const result = await repository.list(params);

      // Then
      expect(mockRoleClient.list).toHaveBeenCalledWith(params);
      expect(result).toEqual([mockRole]);
    });

    it('should handle list errors correctly', async () => {
      // Given
      const httpError = new Error('HTTP Error');
      const transformedError = InfrastructureError.serverError('/api/roles', httpError);

      mockRoleClient.list.and.returnValue(throwError(() => httpError));
      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);

      // When & Then
      await expectAsync(repository.list()).toBeRejectedWith(transformedError);
      expect(mockErrorTransformer.transformWithDefaults).toHaveBeenCalledWith(
        httpError,
        'LIST_ROLES',
        'LIST_ROLES'
      );
    });

    it('should map multiple roles correctly', async () => {
      // Given
      const multipleDtos = [mockRoleDto, { ...mockRoleDto, id: 2, name: 'Manager' }];

      mockRoleClient.list.and.returnValue(of(multipleDtos));
      mockRoleMapper.toEntity.and.callFake((dto: RoleDetailResponseDTO) =>
        Role.create({
          id: dto.id,
          name: dto.name,
          accessLevel: dto.access_level,
          isActive: dto.is_active,
          description: dto.description,
          userCount: dto.user_count,
          isSystemCreated: true, // Allow reserved names from system responses
        })
      );

      // When
      const result = await repository.list();

      // Then
      expect(mockRoleMapper.toEntity).toHaveBeenCalledTimes(2);
      expect(result).toHaveSize(2);
    });
  });

  describe('getById', () => {
    it('should successfully get role by id', async () => {
      // Given
      const roleId = 1;

      mockRoleClient.getById.and.returnValue(of(mockRoleDto));
      mockRoleMapper.toEntity.and.returnValue(mockRole);

      // When
      const result = await repository.getById(roleId);

      // Then
      expect(mockRoleClient.getById).toHaveBeenCalledWith(roleId);
      expect(mockRoleMapper.toEntity).toHaveBeenCalledWith(mockRoleDto);
      expect(result).toEqual(mockRole);
    });

    it('should handle getById not found error', async () => {
      // Given
      const roleId = 999;
      const httpError = new Error('Not Found');
      const transformedError = InfrastructureError.serverError('/api/roles/999', httpError);

      mockRoleClient.getById.and.returnValue(throwError(() => httpError));
      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);

      // When & Then
      await expectAsync(repository.getById(roleId)).toBeRejectedWith(transformedError);
      expect(mockErrorTransformer.transformWithDefaults).toHaveBeenCalledWith(
        httpError,
        'GET_ROLE_BY_ID',
        'GET_ROLE_BY_ID'
      );
    });

    it('should handle getById server error', async () => {
      // Given
      const roleId = 1;
      const httpError = new Error('Server Error');
      const transformedError = InfrastructureError.serverError('/api/roles/1', httpError);

      mockRoleClient.getById.and.returnValue(throwError(() => httpError));
      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);

      // When & Then
      await expectAsync(repository.getById(roleId)).toBeRejectedWith(transformedError);
    });
  });

  describe('create', () => {
    it('should successfully create role with all fields', async () => {
      // Given
      const createSpec: CreateRoleContract = {
        name: 'New Role',
        accessLevel: 3,
        description: 'A new role',
        canLeadProjects: true,
        isUniquePerTeam: false,
        createdByUserId: 1,
      };

      const expectedDto: CreateRoleRequestDTO = {
        name: 'New Role',
        access_level: 3,
        description: 'A new role',
        can_lead_projects: true,
        is_unique_per_team: false,
        created_by_user_id: 1,
      };

      mockRoleClient.create.and.returnValue(of(mockRoleDto));
      mockRoleMapper.toEntity.and.returnValue(mockRole);

      // When
      const result = await repository.create(createSpec);

      // Then
      expect(mockRoleClient.create).toHaveBeenCalledWith(expectedDto);
      expect(mockRoleMapper.toEntity).toHaveBeenCalledWith(mockRoleDto);
      expect(result).toEqual(mockRole);
    });

    it('should successfully create role with minimal fields (defaults)', async () => {
      // Given
      const createSpec: CreateRoleContract = {
        name: 'Basic Role',
        createdByUserId: 1,
      };

      const expectedDto: CreateRoleRequestDTO = {
        name: 'Basic Role',
        access_level: 0,
        description: '',
        can_lead_projects: false,
        is_unique_per_team: false,
        created_by_user_id: 1,
      };

      mockRoleClient.create.and.returnValue(of(mockRoleDto));
      mockRoleMapper.toEntity.and.returnValue(mockRole);

      // When
      const result = await repository.create(createSpec);

      // Then
      expect(mockRoleClient.create).toHaveBeenCalledWith(expectedDto);
      expect(result).toEqual(mockRole);
    });

    it('should handle create validation errors', async () => {
      // Given
      const createSpec: CreateRoleContract = {
        name: '', // Invalid empty name
        createdByUserId: 1,
      };

      const httpError = new Error('Validation Error');
      const transformedError = InfrastructureError.badRequest('/api/roles', {
        name: 'validation error',
      });

      mockRoleClient.create.and.returnValue(throwError(() => httpError));
      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);

      // When & Then
      await expectAsync(repository.create(createSpec)).toBeRejectedWith(transformedError);
      expect(mockErrorTransformer.transformWithDefaults).toHaveBeenCalledWith(
        httpError,
        'CREATE_ROLE',
        'CREATE_ROLE'
      );
    });

    it('should handle create conflict errors', async () => {
      // Given
      const createSpec: CreateRoleContract = {
        name: 'Existing Role',
        createdByUserId: 1,
      };

      const httpError = new Error('Conflict');
      const transformedError = InfrastructureError.badRequest('/api/roles', {
        conflict: 'role exists',
      });

      mockRoleClient.create.and.returnValue(throwError(() => httpError));
      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);

      // When & Then
      await expectAsync(repository.create(createSpec)).toBeRejectedWith(transformedError);
    });
  });

  describe('update', () => {
    it('should successfully update role with patch contract', async () => {
      // Given
      const roleId = 1;
      const updatePayload: UpdateRolePatchContract = {
        name: 'Updated Role',
        accessLevel: 4,
        description: 'Updated description',
      };

      mockRoleClient.update.and.returnValue(of(mockRoleDto));
      mockRoleMapper.toEntity.and.returnValue(mockRole);

      // When
      const result = await repository.update(roleId, updatePayload);

      // Then
      // The mapper should transform the update payload correctly
      const expectedDto: RequestUpdateRoleDTO = {
        name: 'Updated Role',
        access_level: 4,
        description: 'Updated description',
      };
      expect(mockRoleClient.update).toHaveBeenCalledWith(roleId, expectedDto);
      expect(mockRoleMapper.toEntity).toHaveBeenCalledWith(mockRoleDto);
      expect(result).toEqual(mockRole);
    });

    it('should handle update not found errors', async () => {
      // Given
      const roleId = 999;
      const updatePayload: UpdateRolePatchContract = { name: 'Updated' };
      const httpError = new Error('Not Found');
      const transformedError = InfrastructureError.serverError('/api/roles/999', httpError);


      mockRoleClient.update.and.returnValue(throwError(() => httpError));
      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);

      // When & Then
      await expectAsync(repository.update(roleId, updatePayload)).toBeRejectedWith(
        transformedError
      );
      expect(mockErrorTransformer.transformWithDefaults).toHaveBeenCalledWith(
        httpError,
        'UPDATE_ROLE',
        'UPDATE_ROLE'
      );
    });

    it('should handle update validation errors', async () => {
      // Given
      const roleId = 1;
      const updatePayload: UpdateRolePatchContract = { name: '' }; // Invalid empty name
      const httpError = new Error('Validation Error');
      const transformedError = InfrastructureError.badRequest('/api/roles/1', {
        name: 'validation error',
      });


      mockRoleClient.update.and.returnValue(throwError(() => httpError));
      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);

      // When & Then
      await expectAsync(repository.update(roleId, updatePayload)).toBeRejectedWith(
        transformedError
      );
    });
  });

  describe('delete', () => {
    it('should successfully delete role', async () => {
      // Given
      const roleId = 1;

      mockRoleClient.delete.and.returnValue(of(undefined));

      // When
      await repository.delete(roleId);

      // Then
      expect(mockRoleClient.delete).toHaveBeenCalledWith(roleId);
    });

    it('should handle delete not found errors', async () => {
      // Given
      const roleId = 999;
      const httpError = new Error('Not Found');
      const transformedError = InfrastructureError.serverError('/api/roles/999', httpError);

      mockRoleClient.delete.and.returnValue(throwError(() => httpError));
      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);

      // When & Then
      await expectAsync(repository.delete(roleId)).toBeRejectedWith(transformedError);
      expect(mockErrorTransformer.transformWithDefaults).toHaveBeenCalledWith(
        httpError,
        'DELETE_ROLE',
        'DELETE_ROLE'
      );
    });

    it('should handle delete conflict errors (role in use)', async () => {
      // Given
      const roleId = 1;
      const httpError = new Error('Conflict - Role in use');
      const transformedError = InfrastructureError.badRequest('/api/roles/1', {
        conflict: 'role in use',
      });

      mockRoleClient.delete.and.returnValue(throwError(() => httpError));
      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);

      // When & Then
      await expectAsync(repository.delete(roleId)).toBeRejectedWith(transformedError);
    });
  });

  describe('assign', () => {
    it('should successfully assign role to user', async () => {
      // Given
      const assignmentContract: RoleAssignmentContract = {
        userId: 1,
        roleId: 2,
        assignedByUserId: 3,
      };

      const expectedDto: AssignRoleRequestDTO = {
        user_id: 1,
        role_id: 2,
        assigned_by_user_id: 3,
      };

      mockRoleClient.assign.and.returnValue(of(undefined));

      // When
      await repository.assign(assignmentContract);

      // Then
      expect(mockRoleClient.assign).toHaveBeenCalledWith(expectedDto);
    });

    it('should throw error when assignedByUserId is null', async () => {
      // Given
      const assignmentContract: RoleAssignmentContract = {
        userId: 1,
        roleId: 2,
        assignedByUserId: null as any,
      };

      const validationError = new Error('assignedByUserId requerido');
      mockErrorTransformer.transformWithDefaults.and.returnValue(validationError);

      // When & Then
      await expectAsync(repository.assign(assignmentContract)).toBeRejectedWithError(
        'assignedByUserId requerido'
      );

      expect(mockRoleClient.assign).not.toHaveBeenCalled();
      expect(mockErrorTransformer.transformWithDefaults).toHaveBeenCalledWith(
        validationError,
        'ASSIGN_ROLE',
        'ASSIGN_ROLE'
      );
    });

    it('should throw error when assignedByUserId is undefined', async () => {
      // Given
      const assignmentContract: RoleAssignmentContract = {
        userId: 1,
        roleId: 2,
        assignedByUserId: undefined,
      };

      const validationError = new Error('assignedByUserId requerido');
      mockErrorTransformer.transformWithDefaults.and.returnValue(validationError);

      // When & Then
      await expectAsync(repository.assign(assignmentContract)).toBeRejectedWithError(
        'assignedByUserId requerido'
      );

      expect(mockRoleClient.assign).not.toHaveBeenCalled();
      expect(mockErrorTransformer.transformWithDefaults).toHaveBeenCalledWith(
        validationError,
        'ASSIGN_ROLE',
        'ASSIGN_ROLE'
      );
    });

    it('should handle assign HTTP errors', async () => {
      // Given
      const assignmentContract: RoleAssignmentContract = {
        userId: 1,
        roleId: 999, // Non-existent role
        assignedByUserId: 3,
      };

      const httpError = new Error('Role not found');
      const transformedError = InfrastructureError.serverError('/api/roles/assign/999', httpError);

      mockRoleClient.assign.and.returnValue(throwError(() => httpError));
      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);

      // When & Then
      await expectAsync(repository.assign(assignmentContract)).toBeRejectedWith(transformedError);
      expect(mockErrorTransformer.transformWithDefaults).toHaveBeenCalledWith(
        httpError,
        'ASSIGN_ROLE',
        'ASSIGN_ROLE'
      );
    });

    it('should handle assign conflict errors (role already assigned)', async () => {
      // Given
      const assignmentContract: RoleAssignmentContract = {
        userId: 1,
        roleId: 2,
        assignedByUserId: 3,
      };

      const httpError = new Error('Role already assigned');
      const transformedError = InfrastructureError.badRequest('/api/roles/assign', {
        conflict: 'already assigned',
      });

      mockRoleClient.assign.and.returnValue(throwError(() => httpError));
      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);

      // When & Then
      await expectAsync(repository.assign(assignmentContract)).toBeRejectedWith(transformedError);
    });
  });

  describe('unassign', () => {
    it('should successfully unassign role from user', async () => {
      // Given
      const unassignParams = { roleId: 2, userId: 1 };
      const expectedDto: UnassignRoleRequestDTO = { user_id: 1 };

      mockRoleClient.unassign.and.returnValue(of(undefined));

      // When
      await repository.unassign(unassignParams);

      // Then
      expect(mockRoleClient.unassign).toHaveBeenCalledWith(expectedDto);
    });

    it('should handle unassign not found errors', async () => {
      // Given
      const unassignParams = { roleId: 999, userId: 1 };
      const httpError = new Error('Assignment not found');
      const transformedError = InfrastructureError.serverError(
        '/api/roles/unassign/999',
        httpError
      );

      mockRoleClient.unassign.and.returnValue(throwError(() => httpError));
      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);

      // When & Then
      await expectAsync(repository.unassign(unassignParams)).toBeRejectedWith(transformedError);
      expect(mockErrorTransformer.transformWithDefaults).toHaveBeenCalledWith(
        httpError,
        'UNASSIGN_ROLE',
        'UNASSIGN_ROLE'
      );
    });

    it('should handle unassign server errors', async () => {
      // Given
      const unassignParams = { roleId: 2, userId: 1 };
      const httpError = new Error('Internal server error');
      const transformedError = InfrastructureError.serverError('/api/roles/unassign', httpError);

      mockRoleClient.unassign.and.returnValue(throwError(() => httpError));
      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);

      // When & Then
      await expectAsync(repository.unassign(unassignParams)).toBeRejectedWith(transformedError);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete CRUD workflow', async () => {
      // Given
      const createSpec: CreateRoleContract = {
        name: 'Test Role',
        createdByUserId: 1,
      };
      const updateSpec: UpdateRolePatchContract = {
        name: 'Updated Test Role',
      };

      mockRoleClient.create.and.returnValue(of(mockRoleDto));
      mockRoleClient.getById.and.returnValue(of(mockRoleDto));
      mockRoleClient.update.and.returnValue(of(mockRoleDto));
      mockRoleClient.delete.and.returnValue(of(undefined));
      mockRoleMapper.toEntity.and.returnValue(mockRole);


      // When & Then - Complete workflow
      const createdRole = await repository.create(createSpec);
      expect(createdRole).toEqual(mockRole);

      const retrievedRole = await repository.getById(1);
      expect(retrievedRole).toEqual(mockRole);

      const updatedRole = await repository.update(1, updateSpec);
      expect(updatedRole).toEqual(mockRole);

      await repository.delete(1);

      // Verify all calls were made
      expect(mockRoleClient.create).toHaveBeenCalled();
      expect(mockRoleClient.getById).toHaveBeenCalled();
      expect(mockRoleClient.update).toHaveBeenCalled();
      expect(mockRoleClient.delete).toHaveBeenCalled();
    });

    it('should handle assignment workflow', async () => {
      // Given
      const assignmentContract: RoleAssignmentContract = {
        userId: 1,
        roleId: 2,
        assignedByUserId: 3,
      };
      const unassignParams = { roleId: 2, userId: 1 };

      mockRoleClient.assign.and.returnValue(of(undefined));
      mockRoleClient.unassign.and.returnValue(of(undefined));

      // When & Then
      await repository.assign(assignmentContract);
      await repository.unassign(unassignParams);

      expect(mockRoleClient.assign).toHaveBeenCalled();
      expect(mockRoleClient.unassign).toHaveBeenCalled();
    });
  });

  describe('error transformation consistency', () => {
    it('should consistently transform errors across all operations', async () => {
      // Given
      const httpError = new Error('Test Error');
      const transformedError = InfrastructureError.serverError('/api/test', httpError);

      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);

      const operations = [
        () => {
          mockRoleClient.list.and.returnValue(throwError(() => httpError));
          return repository.list();
        },
        () => {
          mockRoleClient.getById.and.returnValue(throwError(() => httpError));
          return repository.getById(1);
        },
        () => {
          mockRoleClient.create.and.returnValue(throwError(() => httpError));
          return repository.create({ name: 'Test', createdByUserId: 1 });
        },
        () => {
              mockRoleClient.update.and.returnValue(throwError(() => httpError));
          return repository.update(1, { name: 'Updated' });
        },
        () => {
          mockRoleClient.delete.and.returnValue(throwError(() => httpError));
          return repository.delete(1);
        },
        () => {
          mockRoleClient.assign.and.returnValue(throwError(() => httpError));
          return repository.assign({ userId: 1, roleId: 2, assignedByUserId: 3 });
        },
        () => {
          mockRoleClient.unassign.and.returnValue(throwError(() => httpError));
          return repository.unassign({ roleId: 2, userId: 1 });
        },
      ];

      // When & Then
      for (const operation of operations) {
        await expectAsync(operation() as Promise<void>).toBeRejectedWith(transformedError);
      }

      expect(mockErrorTransformer.transformWithDefaults).toHaveBeenCalledTimes(7);
    });
  });
});
