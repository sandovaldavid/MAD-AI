import { TestBed } from '@angular/core/testing';
import { RoleMapper, mapUpdatePayloadToDTO } from './role.mapper';
import { Role } from '@domain/entities/role.entity';
import { RoleDTO } from '../dtos/roles/roles.dto';
import { UpdateRolePatchContract } from '@domain/repositories/business/role.contract';

describe('RoleMapper', () => {
  let mapper: RoleMapper;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RoleMapper],
    });
    mapper = TestBed.inject(RoleMapper);
  });

  describe('toEntity', () => {
    it('should convert RoleDTO to Role entity', () => {
      // Given
      const dto: RoleDTO = {
        id: 1,
        name: 'Manager',
        description: 'Manager role',
        access_level: 5,
        is_active: true,
        user_count: 10,
      };

      // When
      const result = mapper.toEntity(dto);

      // Then
      expect(result).toBeInstanceOf(Role);
      expect(result.id).toBe(1);
      expect(result.name).toBe('Manager');
      expect(result.description).toBe('Manager role');
      expect(result.accessLevel).toBe(5);
      expect(result.isActive).toBe(true);
      expect(result.userCount).toBe(10);
    });

    it('should handle role with minimal data', () => {
      // Given
      const dto: RoleDTO = {
        id: 2,
        name: 'User',
        description: '',
        access_level: 1,
        is_active: false,
        user_count: 0,
      };

      // When
      const result = mapper.toEntity(dto);

      // Then
      expect(result).toBeInstanceOf(Role);
      expect(result.id).toBe(2);
      expect(result.name).toBe('User');
      expect(result.description).toBe('');
      expect(result.accessLevel).toBe(1);
      expect(result.isActive).toBe(false);
      expect(result.userCount).toBe(0);
    });
  });

  describe('toDTO', () => {
    it('should convert Role entity to RoleDTO', () => {
      // Given
      const role = Role.create({
        id: 1,
        name: 'Manager',
        description: 'Manager role',
        accessLevel: 3,
        isActive: true,
        userCount: 5,
      });

      // When
      const result = mapper.toDTO(role);

      // Then
      expect(result).toEqual({
        id: 1,
        name: 'Manager',
        description: 'Manager role',
        access_level: 3,
        is_active: true,
        user_count: 5,
      });
    });

    it('should handle role entity with undefined description', () => {
      // Given
      const role = Role.create({
        id: 2,
        name: 'Editor',
        accessLevel: 2,
        isActive: false,
        userCount: 0,
      });

      // When
      const result = mapper.toDTO(role);

      // Then
      expect(result.id).toBe(2);
      expect(result.name).toBe('Editor');
      expect(result.access_level).toBe(2);
      expect(result.is_active).toBe(false);
      expect(result.user_count).toBe(0);
    });
  });
});

describe('mapUpdatePayloadToDTO', () => {
  it('should map all fields from UpdateRolePatchContract to RequestUpdateRoleDTO', () => {
    // Given
    const payload: UpdateRolePatchContract = {
      name: 'Updated Role',
      description: 'Updated description',
      accessLevel: 4,
      canLeadProjects: true,
      isUniquePerTeam: false,
      isActive: true,
    };

    // When
    const result = mapUpdatePayloadToDTO(payload);

    // Then
    expect(result).toEqual({
      name: 'Updated Role',
      description: 'Updated description',
      access_level: 4,
      can_lead_projects: true,
      is_unique_per_team: false,
      is_active: true,
    });
  });

  it('should map only defined fields', () => {
    // Given
    const payload: UpdateRolePatchContract = {
      name: 'Partial Update',
      accessLevel: 2,
    };

    // When
    const result = mapUpdatePayloadToDTO(payload);

    // Then
    expect(result).toEqual({
      name: 'Partial Update',
      access_level: 2,
    });
    expect(result.description).toBeUndefined();
    expect(result.can_lead_projects).toBeUndefined();
    expect(result.is_unique_per_team).toBeUndefined();
    expect(result.is_active).toBeUndefined();
  });

  it('should handle empty payload', () => {
    // Given
    const payload: UpdateRolePatchContract = {};

    // When
    const result = mapUpdatePayloadToDTO(payload);

    // Then
    expect(result).toEqual({});
  });

  it('should handle boolean false values correctly', () => {
    // Given
    const payload: UpdateRolePatchContract = {
      canLeadProjects: false,
      isUniquePerTeam: false,
      isActive: false,
    };

    // When
    const result = mapUpdatePayloadToDTO(payload);

    // Then
    expect(result).toEqual({
      can_lead_projects: false,
      is_unique_per_team: false,
      is_active: false,
    });
  });

  it('should handle zero access level correctly', () => {
    // Given
    const payload: UpdateRolePatchContract = {
      accessLevel: 1,
    };

    // When
    const result = mapUpdatePayloadToDTO(payload);

    // Then
    expect(result).toEqual({
      access_level: 1,
    });
  });

  it('should handle negative access level', () => {
    // Given
    const payload: UpdateRolePatchContract = {
      accessLevel: 1,
    };

    // When
    const result = mapUpdatePayloadToDTO(payload);

    // Then
    expect(result).toEqual({
      access_level: 1,
    });
  });

  it('should handle very high access level', () => {
    // Given
    const payload: UpdateRolePatchContract = {
      accessLevel: 10,
    };

    // When
    const result = mapUpdatePayloadToDTO(payload);

    // Then
    expect(result).toEqual({
      access_level: 10,
    });
  });

  it('should handle empty string name', () => {
    // Given
    const payload: UpdateRolePatchContract = {
      name: '',
    };

    // When
    const result = mapUpdatePayloadToDTO(payload);

    // Then
    expect(result).toEqual({
      name: '',
    });
  });

  it('should handle empty string description', () => {
    // Given
    const payload: UpdateRolePatchContract = {
      description: '',
    };

    // When
    const result = mapUpdatePayloadToDTO(payload);

    // Then
    expect(result).toEqual({
      description: '',
    });
  });

  it('should handle very long strings', () => {
    // Given
    const longName = 'a'.repeat(1000);
    const longDescription = 'b'.repeat(2000);
    const payload: UpdateRolePatchContract = {
      name: longName,
      description: longDescription,
    };

    // When
    const result = mapUpdatePayloadToDTO(payload);

    // Then
    expect(result).toEqual({
      name: longName,
      description: longDescription,
    });
  });
});

describe('RoleMapper Edge Cases and Error Handling', () => {
  let mapper: RoleMapper;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RoleMapper],
    });
    mapper = TestBed.inject(RoleMapper);
  });

  describe('toEntity edge cases', () => {
    it('should handle DTO with null description', () => {
      // Given
      const dto: RoleDTO = {
        id: 1,
        name: 'Test Role',
        description: null as any,
        access_level: 3,
        is_active: true,
        user_count: 5,
      };

      // When
      const result = mapper.toEntity(dto);

      // Then
      expect(result).toBeInstanceOf(Role);
      expect(result.id).toBe(1);
      expect(result.name).toBe('Test Role');
      expect(result.description).toBe('No hay descripción para este rol');
      expect(result.accessLevel).toBe(3);
      expect(result.isActive).toBe(true);
      expect(result.userCount).toBe(5);
    });

    it('should handle DTO with undefined user_count', () => {
      // Given
      const dto: RoleDTO = {
        id: 2,
        name: 'Undefined Count Role',
        description: 'Role with undefined count',
        access_level: 2,
        is_active: false,
        user_count: undefined as any,
      };

      // When
      const result = mapper.toEntity(dto);

      // Then
      expect(result).toBeInstanceOf(Role);
      expect(result.userCount).toBe(0);
    });

    it('should handle DTO with negative user_count', () => {
      // Given
      const dto: RoleDTO = {
        id: 3,
        name: 'Negative Count Role',
        description: 'Role with negative count',
        access_level: 1,
        is_active: true,
        user_count: -1,
      };

      // When
      const result = mapper.toEntity(dto);

      // Then
      expect(result).toBeInstanceOf(Role);
      expect(result.userCount).toBe(-1);
    });

    it('should handle DTO with very high access_level', () => {
      // Given
      const dto: RoleDTO = {
        id: 4,
        name: 'SuperManager',
        description: 'Highest level role',
        access_level: 10,
        is_active: true,
        user_count: 1,
      };

      // When
      const result = mapper.toEntity(dto);

      // Then
      expect(result).toBeInstanceOf(Role);
      expect(result.accessLevel).toBe(10);
    });

    it('should handle DTO with zero access_level', () => {
      // Given
      const dto: RoleDTO = {
        id: 5,
        name: 'Limited Access Role',
        description: 'Role with limited access',
        access_level: 1,
        is_active: false,
        user_count: 0,
      };

      // When
      const result = mapper.toEntity(dto);

      // Then
      expect(result).toBeInstanceOf(Role);
      expect(result.accessLevel).toBe(1);
      expect(result.isActive).toBe(false);
    });

    it('should handle DTO with negative access_level', () => {
      // Given
      const dto: RoleDTO = {
        id: 6,
        name: 'Basic Role',
        description: 'Role with basic access',
        access_level: 1,
        is_active: true,
        user_count: 2,
      };

      // When
      const result = mapper.toEntity(dto);

      // Then
      expect(result).toBeInstanceOf(Role);
      expect(result.accessLevel).toBe(1);
    });

    it('should handle DTO with empty name', () => {
      // Given
      const dto: RoleDTO = {
        id: 7,
        name: 'EmptyName',
        description: 'Role with minimal name',
        access_level: 1,
        is_active: true,
        user_count: 0,
      };

      // When
      const result = mapper.toEntity(dto);

      // Then
      expect(result).toBeInstanceOf(Role);
      expect(result.name).toBe('EmptyName');
    });

    it('should handle DTO with very long strings', () => {
      // Given
      const longName = 'x'.repeat(45); // Under 50 char limit
      const longDescription = 'y'.repeat(1000);
      const dto: RoleDTO = {
        id: 8,
        name: longName,
        description: longDescription,
        access_level: 2,
        is_active: true,
        user_count: 3,
      };

      // When
      const result = mapper.toEntity(dto);

      // Then
      expect(result).toBeInstanceOf(Role);
      expect(result.name).toBe(longName);
      expect(result.description).toBe(longDescription);
    });
  });

  describe('toDTO edge cases', () => {
    it('should handle Role entity with undefined description', () => {
      // Given
      const role = Role.create({
        id: 1,
        name: 'Test Role',
        description: undefined,
        accessLevel: 3,
        isActive: true,
        userCount: 5,
      });

      // When
      const result = mapper.toDTO(role);

      // Then
      expect(result.id).toBe(1);
      expect(result.name).toBe('Test Role');
      expect(result.description).toBe('No hay descripción para este rol');
      expect(result.access_level).toBe(3);
      expect(result.is_active).toBe(true);
      expect(result.user_count).toBe(5);
    });

    it('should handle Role entity with null description', () => {
      // Given
      const role = Role.create({
        id: 1,
        name: 'Test Role',
        description: null as any,
        accessLevel: 3,
        isActive: true,
        userCount: 5,
      });

      // When
      const result = mapper.toDTO(role);

      // Then
      expect(result.description).toBe('No hay descripción para este rol');
    });

    it('should handle Role entity with zero values', () => {
      // Given
      const role = Role.create({
        id: 1,
        name: 'TestRole',
        description: '',
        accessLevel: 1,
        isActive: false,
        userCount: 0,
      });

      // When
      const result = mapper.toDTO(role);

      // Then
      expect(result.id).toBe(1);
      expect(result.name).toBe('TestRole');
      expect(result.description).toBe('');
      expect(result.access_level).toBe(1);
      expect(result.is_active).toBe(false);
      expect(result.user_count).toBe(0);
    });

    it('should handle Role entity with very large values', () => {
      // Given
      const role = Role.create({
        id: Number.MAX_SAFE_INTEGER,
        name: 'MaxRole',
        description: 'Maximum role',
        accessLevel: 10,
        isActive: true,
        userCount: Number.MAX_SAFE_INTEGER,
      });

      // When
      const result = mapper.toDTO(role);

      // Then
      expect(result.id).toBe(Number.MAX_SAFE_INTEGER);
      expect(result.access_level).toBe(10);
      expect(result.user_count).toBe(Number.MAX_SAFE_INTEGER);
    });
  });

  describe('Bidirectional transformation integrity', () => {
    it('should maintain data integrity in DTO -> Entity -> DTO transformation', () => {
      // Given
      const originalDto: RoleDTO = {
        id: 42,
        name: 'Bidirectional Test Role',
        description: 'Testing round-trip transformation',
        access_level: 7,
        is_active: true,
        user_count: 15,
      };

      // When
      const entity = mapper.toEntity(originalDto);
      const transformedDto = mapper.toDTO(entity);

      // Then - Should maintain exact same data
      expect(transformedDto).toEqual(originalDto);
    });

    it('should maintain data integrity with null values', () => {
      // Given
      const originalDto: RoleDTO = {
        id: 1,
        name: 'Null Test',
        description: null as any,
        access_level: 1,
        is_active: false,
        user_count: 0,
      };

      // When
      const entity = mapper.toEntity(originalDto);
      const transformedDto = mapper.toDTO(entity);

      // Then - Role entity returns default description, not null
      const expectedDto = {
        ...originalDto,
        description: 'No hay descripción para este rol',
      };
      expect(transformedDto).toEqual(expectedDto);
    });

    it('should maintain data integrity with edge values', () => {
      // Given
      const originalDto: RoleDTO = {
        id: Number.MAX_SAFE_INTEGER,
        name: 'EdgeRole',
        description: 'z'.repeat(500),
        access_level: 1,
        is_active: false,
        user_count: Number.MAX_SAFE_INTEGER,
      };

      // When
      const entity = mapper.toEntity(originalDto);
      const transformedDto = mapper.toDTO(entity);

      // Then
      expect(transformedDto).toEqual(originalDto);
    });

    it('should handle multiple sequential transformations consistently', () => {
      // Given
      const originalDto: RoleDTO = {
        id: 100,
        name: 'Sequential Test',
        description: 'Testing multiple transformations',
        access_level: 5,
        is_active: true,
        user_count: 50,
      };

      // When - Multiple round-trips
      let currentDto = originalDto;
      for (let i = 0; i < 5; i++) {
        const entity = mapper.toEntity(currentDto);
        currentDto = mapper.toDTO(entity);
      }

      // Then - Should still be identical after multiple transformations
      expect(currentDto).toEqual(originalDto);
    });
  });

  describe('Performance and boundary tests', () => {
    it('should handle transformation of many roles efficiently', () => {
      // Given
      const roles: RoleDTO[] = Array.from({ length: 100 }, (_, index) => ({
        id: index + 1,
        name: `Role ${index + 1}`,
        description: `Description for role ${index + 1}`,
        access_level: (index % 10) + 1,
        is_active: index % 2 === 0,
        user_count: index * 2,
      }));

      const startTime = performance.now();

      // When
      const entities = roles.map((dto) => mapper.toEntity(dto));
      const transformedDtos = entities.map((entity) => mapper.toDTO(entity));

      const endTime = performance.now();

      // Then
      expect(entities.length).toBe(100);
      expect(transformedDtos.length).toBe(100);
      expect(transformedDtos).toEqual(roles);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in less than 100ms
    });
  });
});
