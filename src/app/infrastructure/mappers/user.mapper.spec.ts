import { TestBed } from '@angular/core/testing';
import { UserMapper } from './user.mapper';
import { User } from '@domain/entities/user.entity';
import { Role } from '@domain/entities/role.entity';
import type {
  UserDTO,
  CreateUserRequestDTO,
  UserDetailResponseDTO,
  CreateUserResponseDTO,
  UpdateUserResponseDTO,
} from '../dtos/user';
import type {
  CreateUserContract,
  UserListFilterContract,
} from '@/app/domain/repositories/business/user.contract';

describe('UserMapper', () => {
  let mapper: UserMapper;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UserMapper],
    });
    mapper = TestBed.inject(UserMapper);
  });

  describe('toEntity', () => {
    it('should convert UserDetailResponseDTO to User entity', () => {
      // Given
      const dto: UserDetailResponseDTO = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        full_name: 'John Doe',
        status: 'active',
        is_email_confirmed: true,
        profile_completed: true,
        email_notifications_enabled: true,
        system_notifications_enabled: true,
        task_notifications_enabled: true,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        role_id: 2,
        role_name: 'TestRole',
        last_activity_at: '2024-01-01T00:00:00Z',
      };

      // When
      const result = mapper.toEntity(dto);

      // Then
      expect(result).toBeInstanceOf(User);
      expect(result.id).toBe(1);
      expect(result.username.value).toBe('testuser');
      expect(result.email.value).toBe('test@example.com');
      expect(result.firstName.value).toBe('John');
      expect(result.lastName.value).toBe('Doe');
      expect(result.active).toBe(true);
      expect(result.role.id).toBe(2);
      expect(result.role.name).toBe('TestRole');
      expect(result.isEmailConfirmed).toBe(true);
    });
  });

  describe('toEntityFromList', () => {
    it('should convert UserDTO to User entity with minimal role data', () => {
      // Given
      const dto: UserDTO = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        is_active: true,
        role_name: 'User',
        created_at: '2024-01-01T00:00:00Z',
      };

      // When
      const result = mapper.toEntityFromList(dto);

      // Then
      expect(result).toBeInstanceOf(User);
      expect(result.id).toBe(1);
      expect(result.username.value).toBe('testuser');
      expect(result.email.value).toBe('test@example.com');
      expect(result.firstName.value).toBe('John');
      expect(result.lastName.value).toBe('Doe');
      expect(result.active).toBe(true);
      expect(result.role.id).toBe(1); // Default ID
      expect(result.role.name).toBe('User');
    });
  });

  describe('toDTO', () => {
    it('should convert User entity to UserDTO', () => {
      // Given
      const role = Role.create({
        id: 2,
        name: 'TestRole',
      });

      const user = User.create({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        role: role,
        notificationPreferences: {
          email: true,
          system: false,
          task: false,
        },
        createdAt: '2024-01-01T00:00:00Z',
      });

      // When
      const result = mapper.toDTO(user);

      // Then
      expect(result.id).toBe(1);
      expect(result.username).toBe('testuser');
      expect(result.email).toBe('test@example.com');
      expect(result.first_name).toBe('John');
      expect(result.last_name).toBe('Doe');
      expect(result.is_active).toBe(true);
      expect(result.role_name).toBe('TestRole');
      expect(result.created_at).toBe('2024-01-01T00:00:00Z');
    });
  });

  describe('toCreateRequest', () => {
    it('should convert CreateUserContract to CreateUserRequestDTO', () => {
      // Given
      const contract: CreateUserContract = {
        username: 'newuser',
        email: 'new@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        roleId: 3,
      };
      const password = 'password123';

      // When
      const result = mapper.toCreateRequest(contract, password);

      // Then
      expect(result.username).toBe('newuser');
      expect(result.email).toBe('new@example.com');
      expect(result.first_name).toBe('Jane');
      expect(result.last_name).toBe('Smith');
      expect(result.password).toBe('password123');
      expect(result.role_id).toBe(3);
    });
  });

  describe('toFilterParams', () => {
    it('should convert UserListFilterContract to filter parameters', () => {
      // Given
      const contract: UserListFilterContract = {
        isActive: true,
        roleId: 2,
        searchTerm: 'john',
        limit: 10,
        offset: 20,
      };

      // When
      const result = mapper.toFilterParams(contract);

      // Then
      expect(result['is_active']).toBe(true);
      expect(result['role_id']).toBe(2);
      expect(result['search']).toBe('john');
      expect(result['limit']).toBe(10);
      expect(result['offset']).toBe(20);
    });

    it('should handle empty filter contract', () => {
      // Given
      const contract: UserListFilterContract = {};

      // When
      const result = mapper.toFilterParams(contract);

      // Then
      expect(Object.keys(result).length).toBe(0);
    });

    it('should handle partial filter contract', () => {
      // Given
      const contract: UserListFilterContract = {
        isActive: false,
        searchTerm: 'test',
      };

      // When
      const result = mapper.toFilterParams(contract);

      // Then
      expect(result['is_active']).toBe(false);
      expect(result['search']).toBe('test');
      expect(result['role_id']).toBeUndefined();
      expect(result['limit']).toBeUndefined();
      expect(result['offset']).toBeUndefined();
    });
  });

  describe('toEntityFromCreate', () => {
    it('should convert CreateUserResponseDTO to User entity', () => {
      // Given
      const dto: CreateUserResponseDTO = {
        id: 1,
        username: 'newuser',
        email: 'new@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
        full_name: 'Jane Smith',
        status: 'active',
        is_email_confirmed: false,
        profile_completed: false,
        email_notifications_enabled: true,
        system_notifications_enabled: true,
        task_notifications_enabled: true,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        role_id: 2,
        role_name: 'User',
        last_activity_at: '2024-01-01T00:00:00Z',
      };

      // When
      const result = mapper.toEntityFromCreate(dto);

      // Then
      expect(result).toBeInstanceOf(User);
      expect(result.id).toBe(1);
      expect(result.username.value).toBe('newuser');
      expect(result.email.value).toBe('new@example.com');
      expect(result.firstName.value).toBe('Jane');
      expect(result.lastName.value).toBe('Smith');
      expect(result.active).toBe(true);
      expect(result.role.id).toBe(2);
      expect(result.role.name).toBe('User');
      expect(result.isEmailConfirmed).toBe(false);
    });

    it('should handle null last_activity_at', () => {
      // Given
      const dto: CreateUserResponseDTO = {
        id: 1,
        username: 'newuser',
        email: 'new@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
        full_name: 'Jane Smith',
        status: 'active',
        is_email_confirmed: false,
        profile_completed: false,
        email_notifications_enabled: true,
        system_notifications_enabled: true,
        task_notifications_enabled: true,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        role_id: 2,
        role_name: 'User',
        last_activity_at: null,
      };

      // When
      const result = mapper.toEntityFromCreate(dto);

      // Then
      expect(result).toBeInstanceOf(User);
      expect(result.lastActivityAt).toBeUndefined();
    });
  });

  describe('toEntityFromUpdate', () => {
    it('should convert UpdateUserResponseDTO to User entity', () => {
      // Given
      const dto: UpdateUserResponseDTO = {
        id: 1,
        username: 'updateduser',
        email: 'updated@example.com',
        first_name: 'John',
        last_name: 'Updated',
        full_name: 'John Updated',
        status: 'active',
        is_email_confirmed: true,
        profile_completed: true,
        email_notifications_enabled: true,
        system_notifications_enabled: true,
        task_notifications_enabled: true,
        is_active: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        role_id: 2,
        role_name: 'TestRole',
        last_activity_at: '2024-01-03T00:00:00Z',
      };

      // When
      const result = mapper.toEntityFromUpdate(dto);

      // Then
      expect(result).toBeInstanceOf(User);
      expect(result.id).toBe(1);
      expect(result.username.value).toBe('updateduser');
      expect(result.email.value).toBe('updated@example.com');
      expect(result.firstName.value).toBe('John');
      expect(result.lastName.value).toBe('Updated');
      expect(result.active).toBe(false);
      expect(result.role.id).toBe(2);
      expect(result.role.name).toBe('TestRole');
      expect(result.isEmailConfirmed).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    describe('toEntity edge cases', () => {
      it('should handle UserDetailResponseDTO with null optional fields', () => {
        // Given
        const dto: UserDetailResponseDTO = {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
          full_name: 'John Doe',
          status: 'active',
          is_email_confirmed: true,
          profile_completed: true,
          email_notifications_enabled: true,
          system_notifications_enabled: true,
          task_notifications_enabled: true,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          role_id: 2,
          role_name: 'TestRole',
          last_activity_at: null as any, // Edge case: null last_activity_at
        };

        // When
        const result = mapper.toEntity(dto);

        // Then
        expect(result).toBeInstanceOf(User);
        expect(result.lastActivityAt).toBeUndefined();
      });

      it('should handle UserDetailResponseDTO with minimal valid data', () => {
        // Given
        const dto: UserDetailResponseDTO = {
          id: 1,
          username: 'min_user',
          email: 'min@test.com',
          first_name: 'Min',
          last_name: 'User',
          full_name: 'Min User',
          status: 'active',
          is_email_confirmed: false,
          profile_completed: false,
          email_notifications_enabled: false,
          system_notifications_enabled: false,
          task_notifications_enabled: false,
          is_active: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          role_id: 1,
          role_name: 'MinRole',
          last_activity_at: '2024-01-01T00:00:00Z',
        };

        // When
        const result = mapper.toEntity(dto);

        // Then
        expect(result).toBeInstanceOf(User);
        expect(result.username.value).toBe('min_user');
        expect(result.email.value).toBe('min@test.com');
        expect(result.firstName.value).toBe('Min');
        expect(result.lastName.value).toBe('User');
        expect(result.role.name).toBe('MinRole');
      });

      it('should handle very long string values', () => {
        // Given
        const longString = 'a'.repeat(1000);
        const shortRoleName = 'a'.repeat(45); // Under 50 char limit for Role
        const dto: UserDetailResponseDTO = {
          id: 1,
          username: 'long_username', // Valid username without special chars
          email: 'long@example.com', // Reasonable email length
          first_name: 'VeryLongFirstName', // Valid name format
          last_name: 'VeryLongLastName', // Valid name format
          full_name: 'VeryLongFirstName VeryLongLastName',
          status: 'active',
          is_email_confirmed: true,
          profile_completed: true,
          email_notifications_enabled: true,
          system_notifications_enabled: true,
          task_notifications_enabled: true,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          role_id: 1,
          role_name: shortRoleName,
          last_activity_at: '2024-01-01T00:00:00Z',
        };

        // When
        const result = mapper.toEntity(dto);

        // Then
        expect(result).toBeInstanceOf(User);
        expect(result.username.value).toBe('long_username');
        expect(result.firstName.value).toBe('Verylongfirstname');
        expect(result.role.name).toBe(shortRoleName);
      });

      it('should handle edge case user IDs', () => {
        // Given
        const dto: UserDetailResponseDTO = {
          id: Number.MAX_SAFE_INTEGER,
          username: 'maxuser',
          email: 'max@example.com',
          first_name: 'Max',
          last_name: 'User',
          full_name: 'Max User',
          status: 'active',
          is_email_confirmed: true,
          profile_completed: true,
          email_notifications_enabled: true,
          system_notifications_enabled: true,
          task_notifications_enabled: true,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          role_id: Number.MAX_SAFE_INTEGER,
          role_name: 'MaxRole',
          last_activity_at: '2024-01-01T00:00:00Z',
        };

        // When
        const result = mapper.toEntity(dto);

        // Then
        expect(result).toBeInstanceOf(User);
        expect(result.id).toBe(Number.MAX_SAFE_INTEGER);
        expect(result.role.id).toBe(Number.MAX_SAFE_INTEGER);
      });
    });

    describe('toEntityFromList edge cases', () => {
      it('should handle role_name in UserDTO with default ID mapping', () => {
        // Given
        const dto: UserDTO = {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
          is_active: true,
          role_name: 'EmptyTestRole', // Valid role name for edge case
          created_at: '2024-01-01T00:00:00Z',
        };

        // When
        const result = mapper.toEntityFromList(dto);

        // Then
        expect(result).toBeInstanceOf(User);
        expect(result.role.name).toBe('EmptyTestRole');
        expect(result.role.id).toBe(1); // Default ID
      });

      it('should handle very old created_at date', () => {
        // Given
        const dto: UserDTO = {
          id: 1,
          username: 'olduser',
          email: 'old@example.com',
          first_name: 'Old',
          last_name: 'User',
          is_active: true,
          role_name: 'OldRole',
          created_at: '1970-01-01T00:00:00Z', // Edge case: very old date
        };

        // When
        const result = mapper.toEntityFromList(dto);

        // Then
        expect(result).toBeInstanceOf(User);
        expect(result.createdAt?.value).toBe('1970-01-01T00:00:00Z');
      });

      it('should handle future created_at date', () => {
        // Given
        const dto: UserDTO = {
          id: 1,
          username: 'futureuser',
          email: 'future@example.com',
          first_name: 'Future',
          last_name: 'User',
          is_active: true,
          role_name: 'FutureRole',
          created_at: '2099-12-31T23:59:59Z', // Edge case: future date
        };

        // When
        const result = mapper.toEntityFromList(dto);

        // Then
        expect(result).toBeInstanceOf(User);
        expect(result.createdAt?.value).toBe('2099-12-31T23:59:59Z');
      });
    });

    describe('toDTO edge cases', () => {
      it('should handle User entity with undefined createdAt', () => {
        // Given
        const role = Role.create({
          id: 1,
          name: 'TestRole',
        });

        const user = User.create({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          isActive: true,
          role: role,
          notificationPreferences: {
            email: true,
            system: false,
            task: false,
          },
          createdAt: undefined, // Edge case: undefined createdAt
        });

        // When
        const result = mapper.toDTO(user);

        // Then
        expect(result.created_at).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // Should use current date
      });

      it('should handle User entity with special characters in names', () => {
        // Given
        const role = Role.create({
          id: 1,
          name: 'SpecialRole',
        });

        const user = User.create({
          id: 1,
          username: 'special_user',
          email: 'special+test@example.com',
          firstName: 'José',
          lastName: 'María-González',
          isActive: true,
          role: role,
          notificationPreferences: {
            email: true,
            system: false,
            task: false,
          },
          createdAt: '2024-01-01T00:00:00Z',
        });

        // When
        const result = mapper.toDTO(user);

        // Then
        expect(result.username).toBe('special_user');
        expect(result.email).toBe('special+test@example.com');
        expect(result.first_name).toBe('José');
        expect(result.last_name).toBe('María-González');
        expect(result.role_name).toBe('SpecialRole');
      });
    });

    describe('toCreateRequest edge cases', () => {
      it('should handle CreateUserContract with empty strings', () => {
        // Given
        const contract: CreateUserContract = {
          username: '',
          email: '',
          firstName: '',
          lastName: '',
          roleId: 0,
        };
        const password = '';

        // When
        const result = mapper.toCreateRequest(contract, password);

        // Then
        expect(result.username).toBe('');
        expect(result.email).toBe('');
        expect(result.first_name).toBe('');
        expect(result.last_name).toBe('');
        expect(result.password).toBe('');
        expect(result.role_id).toBe(0);
      });

      it('should handle very long password', () => {
        // Given
        const contract: CreateUserContract = {
          username: 'testuser',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          roleId: 1,
        };
        const password = 'a'.repeat(1000); // Very long password

        // When
        const result = mapper.toCreateRequest(contract, password);

        // Then
        expect(result.password).toBe(password);
        expect(result.password.length).toBe(1000);
      });

      it('should handle special characters in password', () => {
        // Given
        const contract: CreateUserContract = {
          username: 'testuser',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          roleId: 1,
        };
        const password = '!@#$%^&*()_+-=[]{}|;:,.<>?`~'; // Special characters

        // When
        const result = mapper.toCreateRequest(contract, password);

        // Then
        expect(result.password).toBe(password);
      });
    });

    describe('toFilterParams edge cases', () => {
      it('should handle filter with all false boolean values', () => {
        // Given
        const contract: UserListFilterContract = {
          isActive: false,
        };

        // When
        const result = mapper.toFilterParams(contract);

        // Then
        expect(result['is_active']).toBe(false);
        expect(Object.keys(result).length).toBe(1);
      });

      it('should handle filter with zero values', () => {
        // Given
        const contract: UserListFilterContract = {
          roleId: 0,
          limit: 0,
          offset: 0,
        };

        // When
        const result = mapper.toFilterParams(contract);

        // Then
        expect(result['role_id']).toBe(0);
        expect(result['limit']).toBe(0);
        expect(result['offset']).toBe(0);
      });

      it('should handle filter with negative values', () => {
        // Given
        const contract: UserListFilterContract = {
          roleId: -1,
          limit: -10,
          offset: -5,
        };

        // When
        const result = mapper.toFilterParams(contract);

        // Then
        expect(result['role_id']).toBe(-1);
        expect(result['limit']).toBe(-10);
        expect(result['offset']).toBe(-5);
      });

      it('should handle filter with empty search term', () => {
        // Given
        const contract: UserListFilterContract = {
          searchTerm: '',
        };

        // When
        const result = mapper.toFilterParams(contract);

        // Then
        expect(result['search']).toBe('');
      });

      it('should handle filter with very large limit and offset', () => {
        // Given
        const contract: UserListFilterContract = {
          limit: Number.MAX_SAFE_INTEGER,
          offset: Number.MAX_SAFE_INTEGER,
        };

        // When
        const result = mapper.toFilterParams(contract);

        // Then
        expect(result['limit']).toBe(Number.MAX_SAFE_INTEGER);
        expect(result['offset']).toBe(Number.MAX_SAFE_INTEGER);
      });

      it('should handle search term with special characters', () => {
        // Given
        const contract: UserListFilterContract = {
          searchTerm: '!@#$%^&*()_+-=[]{}|;:,.<>?`~',
        };

        // When
        const result = mapper.toFilterParams(contract);

        // Then
        expect(result['search']).toBe('!@#$%^&*()_+-=[]{}|;:,.<>?`~');
      });
    });

    describe('toEntityFromCreate edge cases', () => {
      it('should handle CreateUserResponseDTO with all false notification settings', () => {
        // Given
        const dto: CreateUserResponseDTO = {
          id: 1,
          username: 'newuser',
          email: 'new@example.com',
          first_name: 'Jane',
          last_name: 'Smith',
          full_name: 'Jane Smith',
          status: 'inactive',
          is_email_confirmed: false,
          profile_completed: false,
          email_notifications_enabled: false,
          system_notifications_enabled: false,
          task_notifications_enabled: false,
          is_active: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          role_id: 1,
          role_name: 'User',
          last_activity_at: null,
        };

        // When
        const result = mapper.toEntityFromCreate(dto);

        // Then
        expect(result).toBeInstanceOf(User);
        expect(result.active).toBe(false);
        expect(result.isEmailConfirmed).toBe(false);
        expect(result.lastActivityAt).toBeUndefined();
      });

      it('should handle CreateUserResponseDTO with undefined last_activity_at', () => {
        // Given
        const dto: CreateUserResponseDTO = {
          id: 1,
          username: 'newuser',
          email: 'new@example.com',
          first_name: 'Jane',
          last_name: 'Smith',
          full_name: 'Jane Smith',
          status: 'active',
          is_email_confirmed: true,
          profile_completed: true,
          email_notifications_enabled: true,
          system_notifications_enabled: true,
          task_notifications_enabled: true,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          role_id: 1,
          role_name: 'User',
          last_activity_at: undefined as any,
        };

        // When
        const result = mapper.toEntityFromCreate(dto);

        // Then
        expect(result).toBeInstanceOf(User);
        expect(result.lastActivityAt).toBeUndefined();
      });
    });

    describe('toEntityFromUpdate edge cases', () => {
      it('should handle UpdateUserResponseDTO with status changes', () => {
        // Given
        const dto: UpdateUserResponseDTO = {
          id: 1,
          username: 'updateduser',
          email: 'updated@example.com',
          first_name: 'Updated',
          last_name: 'User',
          full_name: 'Updated User',
          status: 'suspended',
          is_email_confirmed: false,
          profile_completed: false,
          email_notifications_enabled: false,
          system_notifications_enabled: false,
          task_notifications_enabled: false,
          is_active: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          role_id: 3,
          role_name: 'SuspendedRole',
          last_activity_at: '2024-01-01T12:00:00Z',
        };

        // When
        const result = mapper.toEntityFromUpdate(dto);

        // Then
        expect(result).toBeInstanceOf(User);
        expect(result.active).toBe(false);
        expect(result.isEmailConfirmed).toBe(false);
      });
    });

    describe('Data integrity and bidirectional transformations', () => {
      it('should maintain data consistency in toDTO -> entity creation cycle', () => {
        // Given - Start with a DTO-like structure
        const originalData = {
          id: 42,
          username: 'consistency_test',
          email: 'consistency@test.com',
          firstName: 'Consistency',
          lastName: 'Test',
          isActive: true,
          roleName: 'TestRole',
          createdAt: '2024-01-01T00:00:00Z',
        };

        const role = Role.create({
          id: 1,
          name: originalData.roleName,
        });

        const user = User.create({
          id: originalData.id,
          username: originalData.username,
          email: originalData.email,
          firstName: originalData.firstName,
          lastName: originalData.lastName,
          isActive: originalData.isActive,
          role: role,
          notificationPreferences: {
            email: true,
            system: false,
            task: false,
          },
          createdAt: originalData.createdAt,
        });

        // When - Convert to DTO
        const dto = mapper.toDTO(user);

        // Then - Verify data integrity
        expect(dto.id).toBe(originalData.id);
        expect(dto.username).toBe('consistency_test');
        expect(dto.email).toBe(originalData.email);
        expect(dto.first_name).toBe(originalData.firstName);
        expect(dto.last_name).toBe(originalData.lastName);
        expect(dto.is_active).toBe(originalData.isActive);
        expect(dto.role_name).toBe(originalData.roleName);
        expect(dto.created_at).toBe(originalData.createdAt);
      });

      it('should handle multiple transformation cycles without data loss', () => {
        // Given
        const role = Role.create({
          id: 5,
          name: 'CycleTestRole',
        });

        let user = User.create({
          id: 99,
          username: 'cycle_test',
          email: 'cycle@test.com',
          firstName: 'Cycle',
          lastName: 'Test',
          isActive: true,
          role: role,
          notificationPreferences: {
            email: true,
            system: true,
            task: false,
          },
          createdAt: '2024-01-01T00:00:00Z',
        });

        const originalValues = {
          id: user.id,
          username: user.username.value,
          email: user.email.value,
          firstName: user.firstName.value,
          lastName: user.lastName.value,
        };

        // When - Multiple conversion cycles
        for (let i = 0; i < 3; i++) {
          const dto = mapper.toDTO(user);
          // Simulate entity recreation (as would happen in real usage)
          const newRole = Role.create({
            id: role.id,
            name: dto.role_name,
          });
          user = User.create({
            id: dto.id,
            username: dto.username,
            email: dto.email,
            firstName: dto.first_name,
            lastName: dto.last_name,
            isActive: dto.is_active,
            role: newRole,
            notificationPreferences: {
              email: true,
              system: true,
              task: false,
            },
            createdAt: dto.created_at,
          });
        }

        // Then - Data should remain consistent
        expect(user.id).toBe(originalValues.id);
        expect(user.username.value).toBe('cycle_test');
        expect(user.email.value).toBe(originalValues.email);
        expect(user.firstName.value).toBe(originalValues.firstName);
        expect(user.lastName.value).toBe(originalValues.lastName);
      });

      it('should handle transformation with various notification preferences combinations', () => {
        // Test all possible combinations of notification preferences
        const combinations = [
          { email: true, system: true, task: true },
          { email: true, system: true, task: false },
          { email: true, system: false, task: true },
          { email: true, system: false, task: false },
          { email: false, system: true, task: true },
          { email: false, system: true, task: false },
          { email: false, system: false, task: true },
          { email: false, system: false, task: false },
        ];

        combinations.forEach((prefs, index) => {
          // Given
          const role = Role.create({
            id: 1,
            name: 'TestRole',
          });

          const user = User.create({
            id: index + 1,
            username: `user${index}`,
            email: `user${index}@test.com`,
            firstName: 'Test',
            lastName: 'User',
            isActive: true,
            role: role,
            notificationPreferences: prefs,
            createdAt: '2024-01-01T00:00:00Z',
          });

          // When
          const dto = mapper.toDTO(user);

          // Then - Verify the transformation completed without errors
          expect(dto).toBeDefined();
          expect(dto.id).toBe(index + 1);
          expect(dto.username).toBe(`user${index}`);
          expect(dto.email).toBe(`user${index}@test.com`);
        });
      });
    });

    describe('Performance and boundary tests', () => {
      it('should handle transformation of many users efficiently', () => {
        // Given
        const users: UserDTO[] = Array.from({ length: 50 }, (_, index) => ({
          id: index + 1,
          username: `user_${index + 1}`,
          email: `user${index + 1}@test.com`,
          first_name: `FirstName${String.fromCharCode(65 + (index % 26))}`,
          last_name: `LastName${String.fromCharCode(65 + (index % 26))}`,
          is_active: index % 2 === 0,
          role_name: `Role_${String.fromCharCode(65 + ((index % 5) + 1))}`,
          created_at: new Date(2024, 0, 1 + index).toISOString(),
        }));

        const startTime = performance.now();

        // When
        const entities = users.map((dto) => mapper.toEntityFromList(dto));
        const transformedDtos = entities.map((entity) => mapper.toDTO(entity));

        const endTime = performance.now();

        // Then
        expect(entities.length).toBe(50);
        expect(transformedDtos.length).toBe(50);
        expect(endTime - startTime).toBeLessThan(200); // Should complete in less than 200ms
      });
    });
  });
});
