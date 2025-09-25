/**
 * @fileoverview Unit tests for HttpUserRepository
 *
 * @description Tests the HTTP implementation of UserRepository interface,
 * verifying HTTP client interactions, error handling, and data transformations.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { HttpUserRepository } from './http-user.repository';
import { UserApiClient } from '@infrastructure/http/clients/user-api.client';
import { UserMapper } from '@infrastructure/mappers/user.mapper';
import { HttpErrorTransformer } from '@infrastructure/errors/http-error-transformer';
import { User } from '@domain/entities/user.entity';
import { Role } from '@domain/entities/role.entity';
import {
  UserListFilterContract,
  CreateUserContract,
  UpdateUserPatchContract,
  ChangePasswordContract,
} from '@domain/repositories/business/user.contract';
import {
  UserDTO,
  CreateUserRequestDTO,
  UpdateUserRequestDTO,
  ChangePasswordRequestDTO,
  UserDetailResponseDTO,
  CreateUserResponseDTO,
  UpdateUserResponseDTO,
  ChangePasswordResponseDTO,
} from '@infrastructure/dtos/user';
import { InfrastructureError } from '@infrastructure/errors/infrastructure-error';

describe('HttpUserRepository', () => {
  let repository: HttpUserRepository;
  let mockUserClient: jasmine.SpyObj<UserApiClient>;
  let mockUserMapper: jasmine.SpyObj<UserMapper>;
  let mockErrorTransformer: jasmine.SpyObj<HttpErrorTransformer>;

  // Mock data
  const mockUserDTO: UserDTO = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    is_active: true,
    role_name: 'Editor',
    created_at: '2024-01-01T00:00:00Z',
  };

  const mockUserDetailDTO: UserDetailResponseDTO = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    full_name: 'Test User',
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
    role_name: 'Editor',
    last_activity_at: '2024-01-01T00:00:00Z',
  };

  const mockRole = Role.create({
    id: 2,
    name: 'Editor',
    accessLevel: 2,
    isActive: true,
    description: 'Editor role',
  });

  const mockUser = User.create({
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
    role: mockRole,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    lastActivityAt: '2024-01-01T00:00:00Z',
    isEmailConfirmed: true,
    notificationPreferences: {
      email: true,
      system: true,
      task: true,
    },
  });

  beforeEach(() => {
    const userClientSpy = jasmine.createSpyObj('UserApiClient', [
      'list',
      'getById',
      'getByEmail',
      'getByUsername',
      'create',
      'update',
      'delete',
      'activate',
      'deactivate',
      'changeRole',
      'changePassword',
    ]);

    const userMapperSpy = jasmine.createSpyObj('UserMapper', [
      'toEntityFromList',
      'toEntity',
      'toCreateRequest',
      'toEntityFromCreate',
      'toEntityFromUpdate',
    ]);

    const errorTransformerSpy = jasmine.createSpyObj('HttpErrorTransformer', [
      'transformWithDefaults',
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        HttpUserRepository,
        { provide: UserApiClient, useValue: userClientSpy },
        { provide: UserMapper, useValue: userMapperSpy },
        { provide: HttpErrorTransformer, useValue: errorTransformerSpy },
      ],
    });

    repository = TestBed.inject(HttpUserRepository);
    mockUserClient = TestBed.inject(UserApiClient) as jasmine.SpyObj<UserApiClient>;
    mockUserMapper = TestBed.inject(UserMapper) as jasmine.SpyObj<UserMapper>;
    mockErrorTransformer = TestBed.inject(
      HttpErrorTransformer
    ) as jasmine.SpyObj<HttpErrorTransformer>;
  });

  describe('list', () => {
    it('should return list of users when API call succeeds', async () => {
      // Arrange
      const filter: UserListFilterContract = { isActive: true, limit: 10 };
      const mockResponse = [mockUserDTO];
      mockUserClient.list.and.returnValue(of(mockResponse));
      mockUserMapper.toEntityFromList.and.returnValue(mockUser);

      // Act
      const result = await repository.list(filter);

      // Assert
      expect(mockUserClient.list).toHaveBeenCalledWith(filter);
      expect(mockUserMapper.toEntityFromList).toHaveBeenCalledWith(mockUserDTO);
      expect(result).toEqual([mockUser]);
    });

    it('should handle API errors and transform them', async () => {
      // Arrange
      const error = new Error('API Error');
      const transformedError = new InfrastructureError(
        'Transformed Error',
        'NETWORK_ERROR',
        'HTTP',
        true
      );
      mockUserClient.list.and.returnValue(throwError(() => error));
      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);

      // Act & Assert
      await expectAsync(repository.list()).toBeRejectedWith(transformedError);
      expect(mockErrorTransformer.transformWithDefaults).toHaveBeenCalledWith(
        error,
        'LIST_USERS',
        'LIST_USERS'
      );
    });

    it('should work without filter parameter', async () => {
      // Arrange
      const mockResponse = [mockUserDTO];
      mockUserClient.list.and.returnValue(of(mockResponse));
      mockUserMapper.toEntityFromList.and.returnValue(mockUser);

      // Act
      const result = await repository.list();

      // Assert
      expect(mockUserClient.list).toHaveBeenCalledWith(undefined);
      expect(result).toEqual([mockUser]);
    });
  });

  describe('getById', () => {
    it('should return user when found', async () => {
      // Arrange
      const userId = 1;
      mockUserClient.getById.and.returnValue(of(mockUserDetailDTO));
      mockUserMapper.toEntity.and.returnValue(mockUser);

      // Act
      const result = await repository.getById(userId);

      // Assert
      expect(mockUserClient.getById).toHaveBeenCalledWith(userId);
      expect(mockUserMapper.toEntity).toHaveBeenCalledWith(mockUserDetailDTO);
      expect(result).toEqual(mockUser);
    });

    it('should handle API errors and transform them', async () => {
      // Arrange
      const userId = 1;
      const error = new Error('User not found');
      const transformedError = new InfrastructureError(
        'Transformed Error',
        'NOT_FOUND',
        'HTTP',
        false
      );
      mockUserClient.getById.and.returnValue(throwError(() => error));
      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);

      // Act & Assert
      await expectAsync(repository.getById(userId)).toBeRejectedWith(transformedError);
      expect(mockErrorTransformer.transformWithDefaults).toHaveBeenCalledWith(
        error,
        'GET_USER_BY_ID',
        'GET_USER_BY_ID'
      );
    });
  });

  describe('getByEmail', () => {
    it('should return user when found', async () => {
      // Arrange
      const email = 'test@example.com';
      mockUserClient.getByEmail.and.returnValue(of(mockUserDetailDTO));
      mockUserMapper.toEntity.and.returnValue(mockUser);

      // Act
      const result = await repository.getByEmail(email);

      // Assert
      expect(mockUserClient.getByEmail).toHaveBeenCalledWith(email);
      expect(mockUserMapper.toEntity).toHaveBeenCalledWith(mockUserDetailDTO);
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found (404)', async () => {
      // Arrange
      const email = 'notfound@example.com';
      const error = { status: 404 };
      mockUserClient.getByEmail.and.returnValue(throwError(() => error));

      // Act
      const result = await repository.getByEmail(email);

      // Assert
      expect(result).toBeNull();
      expect(mockErrorTransformer.transformWithDefaults).not.toHaveBeenCalled();
    });

    it('should return null when response has no id', async () => {
      // Arrange
      const email = 'test@example.com';
      const invalidResponse = { ...mockUserDetailDTO, id: undefined };
      mockUserClient.getByEmail.and.returnValue(of(invalidResponse as any));

      // Act
      const result = await repository.getByEmail(email);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle non-404 errors and transform them', async () => {
      // Arrange
      const email = 'test@example.com';
      const error = { status: 500 };
      const transformedError = new InfrastructureError(
        'Transformed Error',
        'SERVER_ERROR',
        'HTTP',
        true
      );
      mockUserClient.getByEmail.and.returnValue(throwError(() => error));
      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);

      // Act & Assert
      await expectAsync(repository.getByEmail(email)).toBeRejectedWith(transformedError);
      expect(mockErrorTransformer.transformWithDefaults).toHaveBeenCalledWith(
        error,
        'GET_USER_BY_EMAIL',
        'GET_USER_BY_EMAIL'
      );
    });
  });

  describe('getByUsername', () => {
    it('should return user when found', async () => {
      // Arrange
      const username = 'testuser';
      mockUserClient.getByUsername.and.returnValue(of(mockUserDetailDTO));
      mockUserMapper.toEntity.and.returnValue(mockUser);

      // Act
      const result = await repository.getByUsername(username);

      // Assert
      expect(mockUserClient.getByUsername).toHaveBeenCalledWith(username);
      expect(mockUserMapper.toEntity).toHaveBeenCalledWith(mockUserDetailDTO);
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found (404)', async () => {
      // Arrange
      const username = 'notfound';
      const error = { status: 404 };
      mockUserClient.getByUsername.and.returnValue(throwError(() => error));

      // Act
      const result = await repository.getByUsername(username);

      // Assert
      expect(result).toBeNull();
      expect(mockErrorTransformer.transformWithDefaults).not.toHaveBeenCalled();
    });

    it('should handle non-404 errors and transform them', async () => {
      // Arrange
      const username = 'testuser';
      const error = { status: 500 };
      const transformedError = new InfrastructureError(
        'Transformed Error',
        'SERVER_ERROR',
        'HTTP',
        true
      );
      mockUserClient.getByUsername.and.returnValue(throwError(() => error));
      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);

      // Act & Assert
      await expectAsync(repository.getByUsername(username)).toBeRejectedWith(transformedError);
      expect(mockErrorTransformer.transformWithDefaults).toHaveBeenCalledWith(
        error,
        'GET_USER_BY_USERNAME',
        'GET_USER_BY_USERNAME'
      );
    });
  });

  describe('create', () => {
    it('should create user successfully', async () => {
      // Arrange
      const createSpec: CreateUserContract = {
        username: 'newuser',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        roleId: 2,
        isActive: true,
      };
      const mockCreateRequest: CreateUserRequestDTO = {
        username: 'newuser',
        email: 'new@example.com',
        first_name: 'New',
        last_name: 'User',
        role_id: 2,
        password: 'TempPassword123!',
      };
      const mockCreateResponse: CreateUserResponseDTO = {
        id: 1,
        username: 'newuser',
        email: 'new@example.com',
        first_name: 'New',
        last_name: 'User',
        full_name: 'New User',
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
        role_name: 'Editor',
        last_activity_at: null,
      };
      mockUserMapper.toCreateRequest.and.returnValue(mockCreateRequest);
      mockUserClient.create.and.returnValue(of(mockCreateResponse));
      mockUserMapper.toEntityFromCreate.and.returnValue(mockUser);

      // Act
      const result = await repository.create(createSpec);

      // Assert
      expect(mockUserMapper.toCreateRequest).toHaveBeenCalledWith(createSpec, 'TempPassword123!');
      expect(mockUserClient.create).toHaveBeenCalledWith(mockCreateRequest);
      expect(mockUserMapper.toEntityFromCreate).toHaveBeenCalledWith(mockCreateResponse);
      expect(result).toEqual(mockUser);
    });

    it('should handle API errors and transform them', async () => {
      // Arrange
      const createSpec: CreateUserContract = {
        username: 'newuser',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        roleId: 2,
        isActive: true,
      };
      const error = new Error('Validation failed');
      const transformedError = new InfrastructureError(
        'Transformed Error',
        'VALIDATION_ERROR',
        'HTTP',
        false
      );
      mockUserMapper.toCreateRequest.and.returnValue({} as CreateUserRequestDTO);
      mockUserClient.create.and.returnValue(throwError(() => error));
      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);

      // Act & Assert
      await expectAsync(repository.create(createSpec)).toBeRejectedWith(transformedError);
      expect(mockErrorTransformer.transformWithDefaults).toHaveBeenCalledWith(
        error,
        'CREATE_USER',
        'CREATE_USER'
      );
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      // Arrange
      const userId = 1;
      const updatePatch: UpdateUserPatchContract = {
        firstName: 'Updated',
        email: 'updated@example.com',
      };
      const expectedUpdateRequest: UpdateUserRequestDTO = {
        first_name: 'Updated',
        last_name: 'User',
        email: 'updated@example.com',
        role_id: 2,
        status: 'active',
        email_notifications_enabled: true,
        system_notifications_enabled: true,
        task_notifications_enabled: true,
      };

      const mockUpdateResponse: UpdateUserResponseDTO = {
        id: 1,
        username: 'updateduser',
        email: 'updated@example.com',
        first_name: 'Updated',
        last_name: 'User',
        full_name: 'Updated User',
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
        role_name: 'Editor',
        last_activity_at: '2024-01-01T00:00:00Z',
      };

      // Mock getById call first
      mockUserClient.getById.and.returnValue(of(mockUserDetailDTO));
      mockUserMapper.toEntity.and.returnValue(mockUser);

      // Mock update call
      mockUserClient.update.and.returnValue(of(mockUpdateResponse));
      mockUserMapper.toEntityFromUpdate.and.returnValue(mockUser);

      // Act
      const result = await repository.update(userId, updatePatch);

      // Assert
      expect(mockUserClient.getById).toHaveBeenCalledWith(userId);
      expect(mockUserClient.update).toHaveBeenCalledWith(userId, expectedUpdateRequest);
      expect(mockUserMapper.toEntityFromUpdate).toHaveBeenCalledWith(mockUpdateResponse);
      expect(result).toEqual(mockUser);
    });

    it('should handle API errors and transform them', async () => {
      // Arrange
      const userId = 1;
      const updatePatch: UpdateUserPatchContract = { firstName: 'Updated' };
      const error = new Error('Update failed');
      const transformedError = new InfrastructureError(
        'Transformed Error',
        'VALIDATION_ERROR',
        'HTTP',
        false
      );

      mockUserClient.getById.and.returnValue(of(mockUserDetailDTO));
      mockUserMapper.toEntity.and.returnValue(mockUser);
      mockUserClient.update.and.returnValue(throwError(() => error));
      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);

      // Act & Assert
      await expectAsync(repository.update(userId, updatePatch)).toBeRejectedWith(transformedError);
      expect(mockErrorTransformer.transformWithDefaults).toHaveBeenCalledWith(
        error,
        'UPDATE_USER',
        'UPDATE_USER'
      );
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      // Arrange
      const userId = 1;
      mockUserClient.delete.and.returnValue(of({ message: '' }));

      // Act
      await repository.delete(userId);

      // Assert
      expect(mockUserClient.delete).toHaveBeenCalledWith(userId);
    });

    it('should handle API errors and transform them', async () => {
      // Arrange
      const userId = 1;
      const error = new Error('Delete failed');
      const transformedError = new InfrastructureError(
        'Transformed Error',
        'SERVER_ERROR',
        'HTTP',
        true
      );
      mockUserClient.delete.and.returnValue(throwError(() => error));
      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);

      // Act & Assert
      await expectAsync(repository.delete(userId)).toBeRejectedWith(transformedError);
      expect(mockErrorTransformer.transformWithDefaults).toHaveBeenCalledWith(
        error,
        'DELETE_USER',
        'DELETE_USER'
      );
    });
  });

  describe('activate', () => {
    it('should activate user successfully', async () => {
      // Arrange
      const userId = 1;
      const mockActivateResponse = { message: 'User activated successfully' };
      mockUserClient.activate.and.returnValue(of(mockActivateResponse));

      // Act
      await repository.activate(userId);

      // Assert
      expect(mockUserClient.activate).toHaveBeenCalledWith(userId);
    });

    it('should handle API errors and transform them', async () => {
      // Arrange
      const userId = 1;
      const error = new Error('Activation failed');
      const transformedError = new InfrastructureError(
        'Transformed Error',
        'SERVER_ERROR',
        'HTTP',
        true
      );
      mockUserClient.activate.and.returnValue(throwError(() => error));
      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);

      // Act & Assert
      await expectAsync(repository.activate(userId)).toBeRejectedWith(transformedError);
      expect(mockErrorTransformer.transformWithDefaults).toHaveBeenCalledWith(
        error,
        'ACTIVATE_USER',
        'ACTIVATE_USER'
      );
    });
  });

  describe('deactivate', () => {
    it('should deactivate user successfully', async () => {
      // Arrange
      const userId = 1;
      const mockDeactivateResponse = { message: 'User deactivated successfully' };
      mockUserClient.deactivate.and.returnValue(of(mockDeactivateResponse));

      // Act
      await repository.deactivate(userId);

      // Assert
      expect(mockUserClient.deactivate).toHaveBeenCalledWith(userId);
    });

    it('should handle API errors and transform them', async () => {
      // Arrange
      const userId = 1;
      const error = new Error('Deactivation failed');
      const transformedError = new InfrastructureError(
        'Transformed Error',
        'SERVER_ERROR',
        'HTTP',
        true
      );
      mockUserClient.deactivate.and.returnValue(throwError(() => error));
      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);

      // Act & Assert
      await expectAsync(repository.deactivate(userId)).toBeRejectedWith(transformedError);
      expect(mockErrorTransformer.transformWithDefaults).toHaveBeenCalledWith(
        error,
        'DEACTIVATE_USER',
        'DEACTIVATE_USER'
      );
    });
  });

  describe('changeRole', () => {
    it('should change user role successfully', async () => {
      // Arrange
      const userId = 1;
      const roleId = 3;
      mockUserClient.changeRole.and.returnValue(of(undefined));

      // Act
      await repository.changeRole(userId, roleId);

      // Assert
      expect(mockUserClient.changeRole).toHaveBeenCalledWith(userId, roleId);
    });

    it('should handle API errors and transform them', async () => {
      // Arrange
      const userId = 1;
      const roleId = 3;
      const error = new Error('Role change failed');
      const transformedError = new InfrastructureError(
        'Transformed Error',
        'SERVER_ERROR',
        'HTTP',
        true
      );
      mockUserClient.changeRole.and.returnValue(throwError(() => error));
      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);

      // Act & Assert
      await expectAsync(repository.changeRole(userId, roleId)).toBeRejectedWith(transformedError);
      expect(mockErrorTransformer.transformWithDefaults).toHaveBeenCalledWith(
        error,
        'CHANGE_USER_ROLE',
        'CHANGE_USER_ROLE'
      );
    });
  });

  describe('count', () => {
    it('should return user count successfully', async () => {
      // Arrange
      const filter = { isActive: true };
      const mockResponse = [mockUserDTO, mockUserDTO, mockUserDTO];
      mockUserClient.list.and.returnValue(of(mockResponse));

      // Act
      const result = await repository.count(filter);

      // Assert
      expect(mockUserClient.list).toHaveBeenCalledWith({
        search: undefined,
        role_id: undefined,
        status: 'active',
      });
      expect(result).toBe(3);
    });

    it('should work without filter parameter', async () => {
      // Arrange
      const mockResponse = [mockUserDTO];
      mockUserClient.list.and.returnValue(of(mockResponse));

      // Act
      const result = await repository.count();

      // Assert
      expect(mockUserClient.list).toHaveBeenCalledWith(undefined);
      expect(result).toBe(1);
    });

    it('should handle API errors and transform them', async () => {
      // Arrange
      const error = new Error('Count failed');
      const transformedError = new InfrastructureError(
        'Transformed Error',
        'SERVER_ERROR',
        'HTTP',
        true
      );
      mockUserClient.list.and.returnValue(throwError(() => error));
      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);

      // Act & Assert
      await expectAsync(repository.count()).toBeRejectedWith(transformedError);
      expect(mockErrorTransformer.transformWithDefaults).toHaveBeenCalledWith(
        error,
        'COUNT_USERS',
        'COUNT_USERS'
      );
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      // Arrange
      const contract: ChangePasswordContract = {
        currentPassword: 'oldpass',
        newPassword: 'newpass',
        newPasswordConfirm: 'newpass',
      };
      const expectedDTO: ChangePasswordRequestDTO = {
        current_password: 'oldpass',
        new_password: 'newpass',
        new_password_confirm: 'newpass',
      };
      const mockResponse: ChangePasswordResponseDTO = {
        message: 'Password changed successfully',
      };
      mockUserClient.changePassword.and.returnValue(of(mockResponse));

      // Act
      await repository.changePassword(contract);

      // Assert
      expect(mockUserClient.changePassword).toHaveBeenCalledWith(expectedDTO);
    });

    it('should handle API errors and transform them', async () => {
      // Arrange
      const contract: ChangePasswordContract = {
        currentPassword: 'oldpass',
        newPassword: 'newpass',
        newPasswordConfirm: 'newpass',
      };
      const error = new Error('Password change failed');
      const transformedError = new InfrastructureError(
        'Transformed Error',
        'VALIDATION_ERROR',
        'HTTP',
        false
      );
      mockUserClient.changePassword.and.returnValue(throwError(() => error));
      mockErrorTransformer.transformWithDefaults.and.returnValue(transformedError);

      // Act & Assert
      await expectAsync(repository.changePassword(contract)).toBeRejectedWith(transformedError);
      expect(mockErrorTransformer.transformWithDefaults).toHaveBeenCalledWith(
        error,
        'CHANGE_PASSWORD',
        'CHANGE_PASSWORD'
      );
    });
  });
});
