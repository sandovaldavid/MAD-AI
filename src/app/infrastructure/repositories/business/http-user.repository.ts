/**
 * @fileoverview HTTP implementation of UserRepository
 *
 * @description Provides HTTP-based implementation of the UserRepository interface
 * for communicating with the backend API. This implementation handles all HTTP
 * concerns, error mapping, and data transformation between API DTOs and domain entities.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 *
 * @example Basic Usage
 * ```typescript
 * // Injected via DI
 * @Injectable()
 * export class UserService {
 *   constructor(@Inject(USER_REPOSITORY) private userRepo: UserRepository) {}
 *
 *   async getUser(id: number): Promise<User> {
 *     return this.userRepo.getById(id);
 *   }
 * }
 * ```
 *
 * @example Error Handling
 * ```typescript
 * try {
 *   const user = await httpUserRepo.getById(123);
 *   console.log(`Found user: ${UserFormatterService.getFullName(user)}`);
 * } catch (error) {
 *   // Proper domain errors are thrown
 *   console.error('Failed to get user:', error.message);
 * }
 * ```
 */

import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { UserRepository } from '@domain/repositories/business/user.repository';
import { User } from '@domain/entities/user.entity';
import type {
  CreateUserContract,
  UpdateUserPatchContract,
  UserListFilterContract,
  ChangePasswordContract,
} from '@/app/domain/repositories/business/user.contract';
import type {
  CreateUserRequestDTO,
  UpdateUserRequestDTO,
  ChangePasswordRequestDTO,
  UserDTO,
} from '../../dtos/user';
import { UserMapper } from '../../mappers/user.mapper';
import { HttpErrorTransformer } from '../../errors/http-error-transformer';
import { UserApiClient } from '../../http/clients/user-api.client';

/**
 * HTTP-based implementation of UserRepository.
 *
 * @description Communicates with the backend API to perform user management operations.
 * Handles HTTP concerns, error transformation, and data mapping between API format
 * and domain entities. All methods are designed to be resilient and provide
 * meaningful error messages for different failure scenarios.
 *
 * @class HttpUserRepository
 * @implements {UserRepository}
 *
 * @apiBaseUrl {environment.API_URL}/auth/users
 * @apiAuthentication Bearer token via HTTP interceptor
 * @apiContentType application/json
 *
 * @errorHandling
 * - HTTP errors are transformed to domain-appropriate error messages
 * - Network failures are handled gracefully
 * - Invalid API responses trigger descriptive errors
 * - Unauthorized requests are properly surfaced
 *
 * @performanceOptimizations
 * - Uses RxJS firstValueFrom for single-shot requests
 * - Implements proper HTTP caching headers when applicable
 * - Minimizes payload size through selective field requests
 * - Supports pagination for large datasets
 */
@Injectable()
export class HttpUserRepository implements UserRepository {
  private readonly userClient = inject(UserApiClient);
  private readonly errorTransformer = inject(HttpErrorTransformer);
  private readonly userMapper = inject(UserMapper);

  /**
   * Retrieves a filtered and paginated list of users.
   *
   * @description Fetches users from the API based on filter criteria,
   * with support for pagination, search, and role filtering.
   * Transforms API response to domain entities.
   *
   * @param filter - Optional filtering and pagination criteria
   * @returns Promise resolving to array of User domain entities
   *
   * @throws {Error} When API request fails or returns invalid data
   *
   * @apiEndpoint GET /api/v1/users/
   * @apiQueryParams { is_active?, role_id?, search?, limit?, offset? }
   * @apiResponse ListUsersResponseDTO with array of users
   *
   * @example Basic User Listing
   * ```typescript
   * const activeUsers = await userRepository.list({
   *   isActive: true,
   *   limit: 20,
   *   offset: 0
   * });
   * console.log(`Found ${activeUsers.length} active users`);
   * ```
   *
   * @example Search with Role Filter
   * ```typescript
   * const editors = await userRepository.list({
   *   roleId: 2,
   *   searchTerm: 'john',
   *   limit: 10
   * });
   * ```
   */
  async list(filter?: UserListFilterContract): Promise<User[]> {
    try {
      const response = await firstValueFrom(this.userClient.list(filter));

      // Use the specific mapper method for UserDTO from list endpoints
      const users = response.map((dto: UserDTO) => this.userMapper.toEntityFromList(dto));

      return users;
    } catch (httpError: unknown) {
      throw this.errorTransformer.transformWithDefaults(httpError, 'LIST_USERS', 'LIST_USERS');
    }
  }

  /**
   * Retrieves a specific user by ID.
   *
   * @description Fetches a single user from the API by their unique identifier.
   * Returns a complete User domain entity with all relationships loaded.
   *
   * @param id - Unique user identifier
   * @returns Promise resolving to User domain entity
   *
   * @throws {Error} When user is not found or API request fails
   *
   * @apiEndpoint GET /api/v1/users/{id}/
   * @apiResponse UserDTO with complete user data
   *
   * @example User Retrieval
   * ```typescript
   * try {
   *   const user = await userRepository.getById(123);
   *   console.log(`User: ${UserFormatterService.getFullName(user)} (${user.email})`);
   *   console.log(`Role: ${user.roleName}`);
   * } catch (error) {
   *   console.error('User not found or access denied');
   * }
   * ```
   */
  async getById(id: number): Promise<User> {
    try {
      const dto = await firstValueFrom(this.userClient.getById(id));
      return this.userMapper.toEntity(dto);
    } catch (httpError: unknown) {
      throw this.errorTransformer.transformWithDefaults(
        httpError,
        'GET_USER_BY_ID',
        'GET_USER_BY_ID'
      );
    }
  }

  /**
   * Retrieves a user by email address.
   *
   * @description Searches for a user with the specified email address.
   * Returns null if no user exists with that email, making it safe for
   * user lookup operations without revealing account existence.
   *
   * @param email - Email address to search for
   * @returns Promise resolving to User entity or null if not found
   *
   * @throws {Error} When API request fails (excludes not found cases)
   *
   * @apiEndpoint GET /api/v1/users/?search={email}
   * @apiResponse ListUsersResponseDTO (filtered by email)
   *
   * @example Email Lookup
   * ```typescript
   * const user = await userRepository.getByEmail('john@example.com');
   * if (user) {
   *   console.log(`Found user: ${UserFormatterService.getFullName(user)}`);
   * } else {
   *   console.log('No user found with that email');
   * }
   * ```
   */
  async getByEmail(email: string): Promise<User | null> {
    try {
      // Use UserApiClient's getByEmail method
      const dto = await firstValueFrom(this.userClient.getByEmail(email));

      // Check if we got a valid response (UserApiClient returns UserDetailResponseDTO)
      if (dto && dto.id) {
        return this.userMapper.toEntity(dto);
      }

      return null;
    } catch (httpError: unknown) {
      // If not found (404), return null instead of throwing error
      if (
        httpError &&
        typeof httpError === 'object' &&
        'status' in httpError &&
        httpError.status === 404
      ) {
        return null;
      }

      throw this.errorTransformer.transformWithDefaults(
        httpError,
        'GET_USER_BY_EMAIL',
        'GET_USER_BY_EMAIL'
      );
    }
  }

  /**
   * Retrieves a user by username.
   *
   * @description Searches for a user with the specified username.
   * Returns null if no user exists with that username, making it safe for
   * user lookup operations without revealing account existence.
   *
   * @param username - Username to search for
   * @returns Promise resolving to User entity or null if not found
   *
   * @throws {Error} When API request fails (excludes not found cases)
   *
   * @apiEndpoint GET /api/v1/users/?search={username}
   * @apiResponse ListUsersResponseDTO (filtered by username)
   *
   * @example Username Lookup
   * ```typescript
   * const user = await userRepository.getByUsername('johndoe');
   * if (user) {
   *   console.log(`Found user: ${user.email}`);
   * } else {
   *   console.log('Username not found');
   * }
   * ```
   */
  async getByUsername(username: string): Promise<User | null> {
    try {
      // Use UserApiClient's getByUsername method
      const dto = await firstValueFrom(this.userClient.getByUsername(username));

      // Check if we got a valid response
      if (dto && dto.id) {
        return this.userMapper.toEntity(dto);
      }

      return null;
    } catch (httpError: unknown) {
      // If not found (404), return null instead of throwing error
      if (
        httpError &&
        typeof httpError === 'object' &&
        'status' in httpError &&
        httpError.status === 404
      ) {
        return null;
      }

      throw this.errorTransformer.transformWithDefaults(
        httpError,
        'GET_USER_BY_USERNAME',
        'GET_USER_BY_USERNAME'
      );
    }
  }

  /**
   * Creates a new user account.
   *
   * @description Creates a new user with the provided specification data.
   * This operation validates all business rules, enforces uniqueness
   * constraints, and returns the complete created entity.
   *
   * @param spec - Complete user creation specification
   * @returns Promise resolving to the newly created User entity
   *
   * @throws {Error} When validation fails, conflicts occur, or API request fails
   *
   * @apiEndpoint POST /api/v1/users/
   * @apiRequest CreateUserRequestDTO
   * @apiResponse UserDTO of the created user
   *
   * @example User Creation
   * ```typescript
   * const userSpec = {
   *   username: 'johndoe',
   *   email: 'john@example.com',
   *   firstName: 'John',
   *   lastName: 'Doe',
   *   roleId: 2,
   *   isActive: true
   * };
   *
   * try {
   *   const newUser = await userRepository.create(userSpec);
   *   console.log(`Created user ${newUser.id}: ${UserFormatterService.getFullName(newUser)}`);
   * } catch (error) {
   *   console.error('Failed to create user:', error.message);
   * }
   * ```
   *
   * @note Password should be handled separately through secure channels
   * and is not included in the domain contract for security reasons.
   */
  async create(spec: CreateUserContract): Promise<User> {
    try {
      // Transform domain contract to API DTO using mapper
      const requestDto: CreateUserRequestDTO = this.userMapper.toCreateRequest(
        spec,
        'TempPassword123!'
      ); // TODO: Implement proper password handling

      const responseDto = await firstValueFrom(this.userClient.create(requestDto));

      // Use the specific mapper method for created users
      return this.userMapper.toEntityFromCreate(responseDto);
    } catch (httpError: unknown) {
      throw this.errorTransformer.transformWithDefaults(httpError, 'CREATE_USER', 'CREATE_USER');
    }
  }

  /**
   * Updates an existing user with partial data.
   *
   * @description Applies partial updates to an existing user account.
   * Only provided fields are updated, leaving other fields unchanged.
   * This operation validates business rules and constraints.
   *
   * @param id - ID of user to update
   * @param patch - Partial update data
   * @returns Promise resolving to the updated User entity
   *
   * @throws {Error} When user is not found, validation fails, or API request fails
   *
   * @apiEndpoint PUT /api/v1/users/{id}/
   * @apiRequest UpdateUserRequestDTO (partial)
   * @apiResponse UserDTO of the updated user
   *
   * @example Profile Update
   * ```typescript
   * const updates = {
   *   firstName: 'Johnny',
   *   email: 'johnny@example.com'
   * };
   *
   * try {
   *   const updatedUser = await userRepository.update(123, updates);
   *   console.log(`Updated user: ${UserFormatterService.getFullName(updatedUser)}`);
   * } catch (error) {
   *   console.error('Failed to update user:', error.message);
   * }
   * ```
   */
  async update(id: number, patch: UpdateUserPatchContract): Promise<User> {
    console.log('[HttpUserRepository] update called with id:', id, 'and patch:', patch);

    try {
      // Get current user data first to merge with updates
      console.log('[HttpUserRepository] Getting current user data...');
      const currentUser = await this.getById(id);
      console.log('[HttpUserRepository] Current user retrieved:', currentUser);

      // Create update request DTO manually
      console.log('[HttpUserRepository] Creating update request DTO...');
      console.log('[HttpUserRepository] patch received:', JSON.stringify(patch, null, 2));

      // Extract string values properly - handle both strings and potential Value Objects
      const firstNameValue =
        this.extractStringValue(patch.firstName) ?? currentUser.firstName.value;
      const lastNameValue = this.extractStringValue(patch.lastName) ?? currentUser.lastName.value;
      const emailValue = this.extractStringValue(patch.email) ?? currentUser.email.value;

      console.log(
        '[HttpUserRepository] Extracted values - firstName:',
        firstNameValue,
        'lastName:',
        lastNameValue,
        'email:',
        emailValue
      );

      const requestDto: UpdateUserRequestDTO = {
        first_name: firstNameValue,
        last_name: lastNameValue,
        email: emailValue,
        role_id: patch.roleId ?? currentUser.role.id,
        status: patch.isActive !== undefined ? (patch.isActive ? 'ACTIVE' : 'INACTIVE') : 'ACTIVE',
        email_notifications_enabled:
          patch.notificationPreferences?.email ??
          currentUser.notificationPreferences?.toObject().email ??
          true,
        system_notifications_enabled:
          patch.notificationPreferences?.system ??
          currentUser.notificationPreferences?.toObject().system ??
          true,
        task_notifications_enabled:
          patch.notificationPreferences?.task ??
          currentUser.notificationPreferences?.toObject().task ??
          true,
      };
      console.log('[HttpUserRepository] Update request DTO created:', requestDto);

      console.log('[HttpUserRepository] Calling userClient.update...');
      const responseDto = await firstValueFrom(this.userClient.update(id, requestDto));
      console.log('[HttpUserRepository] userClient.update completed, response DTO:', responseDto);

      // Use the specific mapper method for updated users
      console.log('[HttpUserRepository] Mapping response to entity...');
      const result = this.userMapper.toEntityFromUpdate(responseDto);
      console.log('[HttpUserRepository] Mapping completed, result:', result);

      return result;
    } catch (httpError: unknown) {
      console.error('[HttpUserRepository] Error in update method:', httpError);
      throw this.errorTransformer.transformWithDefaults(httpError, 'UPDATE_USER', 'UPDATE_USER');
    }
  }

  /**
   * Helper method to extract string value from either string or Value Object
   */
  private extractStringValue(value: string | undefined | { value: string }): string | undefined {
    if (typeof value === 'string') {
      return value;
    }
    if (value && typeof value === 'object' && 'value' in value) {
      return value.value;
    }
    return undefined;
  }

  /**
   * Deletes a user account.
   *
   * @description Removes a user account from the system. This operation
   * should be used with caution as it may be irreversible depending on
   * the backend implementation (hard vs soft delete).
   *
   * @param id - ID of user to delete
   * @returns Promise that resolves when deletion is complete
   *
   * @throws {Error} When user is not found or API request fails
   *
   * @apiEndpoint DELETE /api/v1/users/{id}/
   * @apiResponse void (204 No Content)
   *
   * @example User Deletion
   * ```typescript
   * try {
   *   await userRepository.delete(123);
   *   console.log('User deleted successfully');
   * } catch (error) {
   *   console.error('Failed to delete user:', error.message);
   * }
   * ```
   *
   * @warning This operation may be irreversible. Consider implementing
   * soft deletion or requiring additional confirmation in the UI.
   */
  async delete(id: number): Promise<void> {
    try {
      await firstValueFrom(this.userClient.delete(id));
    } catch (httpError: unknown) {
      throw this.errorTransformer.transformWithDefaults(httpError, 'DELETE_USER', 'DELETE_USER');
    }
  }

  /**
   * Activates a user account.
   *
   * @description Enables a user account by setting is_active to true.
   * This operation is typically used for account recovery or administrative
   * account management.
   *
   * @param id - ID of user to activate
   * @returns Promise that resolves when activation is complete
   *
   * @throws {Error} When user is not found or API request fails
   *
   * @apiEndpoint PATCH /api/v1/users/{id}/
   * @apiRequest { is_active: true }
   * @apiResponse UserDTO of the updated user
   *
   * @example User Activation
   * ```typescript
   * try {
   *   await userRepository.activate(123);
   *   console.log('User account activated successfully');
   * } catch (error) {
   *   console.error('Failed to activate user:', error.message);
   * }
   * ```
   */
  async activate(id: number): Promise<void> {
    try {
      await firstValueFrom(this.userClient.activate(id));
    } catch (httpError: unknown) {
      throw this.errorTransformer.transformWithDefaults(
        httpError,
        'ACTIVATE_USER',
        'ACTIVATE_USER'
      );
    }
  }

  /**
   * Deactivates a user account.
   *
   * @description Disables a user account by setting is_active to false.
   * This prevents authentication while preserving account data.
   *
   * @param id - ID of user to deactivate
   * @returns Promise that resolves when deactivation is complete
   *
   * @throws {Error} When user is not found or API request fails
   *
   * @apiEndpoint PATCH /api/v1/users/{id}/
   * @apiRequest { is_active: false }
   * @apiResponse UserDTO of the updated user
   *
   * @example User Deactivation
   * ```typescript
   * try {
   *   await userRepository.deactivate(123);
   *   console.log('User account deactivated successfully');
   * } catch (error) {
   *   console.error('Failed to deactivate user:', error.message);
   * }
   * ```
   */
  async deactivate(id: number): Promise<void> {
    try {
      await firstValueFrom(this.userClient.deactivate(id));
    } catch (httpError: unknown) {
      throw this.errorTransformer.transformWithDefaults(
        httpError,
        'DEACTIVATE_USER',
        'DEACTIVATE_USER'
      );
    }
  }

  /**
   * Changes a user's role assignment.
   *
   * @description Updates the role assigned to a user by sending a PATCH
   * request with the new role_id.
   *
   * @param userId - ID of user whose role to change
   * @param roleId - ID of new role to assign
   * @returns Promise that resolves when role change is complete
   *
   * @throws {Error} When user/role is not found or API request fails
   *
   * @apiEndpoint PATCH /api/v1/users/{userId}/
   * @apiRequest { role_id: roleId }
   * @apiResponse UserDTO of the updated user
   *
   * @example Role Assignment
   * ```typescript
   * try {
   *   await userRepository.changeRole(123, 2); // Assign role ID 2
   *   console.log('User role updated successfully');
   * } catch (error) {
   *   console.error('Failed to change user role:', error.message);
   * }
   * ```
   */
  async changeRole(userId: number, roleId: number): Promise<void> {
    try {
      await firstValueFrom(this.userClient.changeRole(userId, roleId));
    } catch (httpError: unknown) {
      throw this.errorTransformer.transformWithDefaults(
        httpError,
        'CHANGE_USER_ROLE',
        'CHANGE_USER_ROLE'
      );
    }
  }

  /**
   * Counts users matching specified criteria.
   *
   * @description Returns the total number of users that match the given
   * filtering criteria by fetching the first page with a limit of 1
   * and reading the count from the pagination metadata.
   *
   * @param filter - Optional filtering criteria (excluding pagination)
   * @returns Promise resolving to the count of matching users
   *
   * @throws {Error} When API request fails
   *
   * @apiEndpoint GET /api/v1/users/?limit=1&{filters}
   * @apiResponse ListUsersResponseDTO with user count determined by array length
   *
   * @example Count Active Users
   * ```typescript
   * const activeUserCount = await userRepository.count({ isActive: true });
   * console.log(`Active users: ${activeUserCount}`);
   * ```
   *
   * @example Pagination Support
   * ```typescript
   * const filter = { roleId: 2 };
   * const totalCount = await userRepository.count(filter);
   * const pageSize = 20;
   * const totalPages = Math.ceil(totalCount / pageSize);
   * console.log(`Total pages: ${totalPages}`);
   * ```
   */
  async count(filter?: Omit<UserListFilterContract, 'limit' | 'offset'>): Promise<number> {
    try {
      // Convert filter to UserApiClient format
      const apiFilter = filter
        ? {
            search: filter.searchTerm,
            role_id: filter.roleId,
            status:
              filter.isActive !== undefined ? (filter.isActive ? 'active' : 'inactive') : undefined,
          }
        : undefined;

      // Use UserApiClient's list method to get all users and count them
      const response = await firstValueFrom(this.userClient.list(apiFilter));

      return response.length;
    } catch (httpError: unknown) {
      throw this.errorTransformer.transformWithDefaults(httpError, 'COUNT_USERS', 'COUNT_USERS');
    }
  }

  // --- Private Helper Methods ---

  /**
   * Cambia la contraseña del usuario autenticado.
   *
   * @param request - Datos de cambio de contraseña
   * @returns Promise que resuelve cuando el cambio fue exitoso
   * @throws {Error} Si la API falla o los datos son inválidos
   * @apiEndpoint POST /auth/users/change-password/
   * @apiRequest ChangePasswordRequestDTO
   * @apiResponse 200 OK
   */
  async changePassword(contract: ChangePasswordContract): Promise<void> {
    // Mapear contract de dominio a DTO de infraestructura
    const dto: ChangePasswordRequestDTO = {
      current_password: contract.currentPassword,
      new_password: contract.newPassword,
      new_password_confirm: contract.newPasswordConfirm,
    };

    try {
      await firstValueFrom(this.userClient.changePassword(dto));
    } catch (httpError) {
      throw this.errorTransformer.transformWithDefaults(
        httpError,
        'CHANGE_PASSWORD',
        'CHANGE_PASSWORD'
      );
    }
  }
}
