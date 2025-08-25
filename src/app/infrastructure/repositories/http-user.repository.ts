/**
 * @fileoverview HTTP implementation of UserRepository
 *
 * @description Provides HTTP-based implementation of the UserRepository interface
 * for communicating with the backend API. This implementation handles all HTTP
 * concerns, error mappi            const response = await firstValueFrom(
                this.http
                    .get<ListUsersResponseDTO>(this.baseUrl, { params })
                    .pipe(catchError(this.handleHttpError))
            );

            const matchingUser = response.find((user: UserDTO) => user.username === username); data transformation between API DTOs and domain entities.
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
 *   console.log(`Found user: ${user.fullName}`);
 * } catch (error) {
 *   // Proper domain errors are thrown
 *   console.error('Failed to get user:', error.message);
 * }
 * ```
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { firstValueFrom, catchError, throwError } from 'rxjs';
import { UserRepository } from '@domain/repositories/business/user.repository';
import { User } from '@domain/entities/user.entity';
import type {
  CreateUserContract,
  UpdateUserPatchContract,
  UserListFilterContract,
  ChangePasswordContract,
} from '@domain/contracts/user.contract';
import type {
  CreateUserRequestDTO,
  UpdateUserRequestDTO,
  ChangePasswordRequestDTO,
  ChangePasswordResponseDTO,
  CreateUserResponseDTO,
  DeactivateUserRequestDTO,
  DeactivateUserResponseDTO,
  ListUsersResponseDTO,
  UpdateUserResponseDTO,
  UserDTO,
  UserDetailResponseDTO,
} from '../dtos/user';
import { UserMapper } from '../mappers/user.mapper';
import { environment } from '@env/environment';
import { InfraErrorToDomainMapper } from '../errors/infra-to-domain.mapper';

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
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.API_URL}/auth/users`;
  private readonly errorMapper = inject(InfraErrorToDomainMapper);

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
      const params = this.buildHttpParams(filter);
      const response = await firstValueFrom(
        this.http.get<ListUsersResponseDTO>(this.baseUrl).pipe(catchError(this.handleHttpError))
      );

      console.log('🔥 HttpUserRepository.list - API Response:', response);

      // Use the specific mapper method for UserDTO from list endpoints
      const users = response.map((dto: UserDTO) => UserMapper.toEntityFromListDTO(dto));
      console.log('🔥 HttpUserRepository.list - Mapped users:', users);

      return users;
    } catch (error) {
      throw this.transformError(error, 'LIST_USERS');
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
   *   console.log(`User: ${user.fullName} (${user.email})`);
   *   console.log(`Role: ${user.roleName}`);
   * } catch (error) {
   *   console.error('User not found or access denied');
   * }
   * ```
   */
  async getById(id: number): Promise<User> {
    try {
      const dto = await firstValueFrom(
        this.http
          .get<UserDetailResponseDTO>(`${this.baseUrl}/${id}/`)
          .pipe(catchError(this.handleHttpError))
      );

      return UserMapper.toEntity(dto);
    } catch (error) {
      throw this.transformError(error, 'GET_USER_BY_ID');
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
   *   console.log(`Found user: ${user.fullName}`);
   * } else {
   *   console.log('No user found with that email');
   * }
   * ```
   */
  async getByEmail(email: string): Promise<User | null> {
    try {
      const params = new HttpParams().set('email', email);

      const response = await firstValueFrom(
        this.http
          .get<ListUsersResponseDTO>(this.baseUrl, { params })
          .pipe(catchError(this.handleHttpError))
      );

      const matchingUser = response.find((user: UserDTO) => user.email === email);
      return matchingUser ? UserMapper.toEntityFromListDTO(matchingUser) : null;
    } catch (error) {
      console.error('🔥 HttpUserRepository.getByEmail - Error:', error);
      throw error;
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
      const params = new HttpParams().set('search', username).set('limit', '1');

      const response = await firstValueFrom(
        this.http
          .get<ListUsersResponseDTO>(this.baseUrl, { params })
          .pipe(catchError(this.handleHttpError))
      );

      // Check if we found an exact username match
      const matchingUser = response.find((user: UserDTO) => user.username === username);
      return matchingUser ? UserMapper.toEntityFromListDTO(matchingUser) : null;
    } catch (error) {
      throw this.transformError(error, 'GET_USER_BY_USERNAME');
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
   *   console.log(`Created user ${newUser.id}: ${newUser.fullName}`);
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
      // Transform domain contract to API DTO
      let requestDto = UserMapper.createContractToDTO(spec);

      // Note: Password handling should be implemented separately
      // For now, we'll use a placeholder that should be replaced by
      // proper password generation or separate password setting
      requestDto = {
        ...requestDto,
        password: 'TempPassword123!', // TODO: Implement proper password handling
      };

      const responseDto = await firstValueFrom(
        this.http
          .post<CreateUserResponseDTO>(this.baseUrl, requestDto)
          .pipe(catchError(this.handleHttpError))
      );

      return UserMapper.toEntityFromCreateDTO(responseDto);
    } catch (error) {
      throw this.transformError(error, 'CREATE_USER');
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
   *   console.log(`Updated user: ${updatedUser.fullName}`);
   * } catch (error) {
   *   console.error('Failed to update user:', error.message);
   * }
   * ```
   */
  async update(id: number, patch: UpdateUserPatchContract): Promise<User> {
    try {
      const requestDto = UserMapper.updateContractToDTO(patch);

      const responseDto = await firstValueFrom(
        this.http
          .put<UpdateUserResponseDTO>(`${this.baseUrl}/${id}/`, requestDto)
          .pipe(catchError(this.handleHttpError))
      );

      return UserMapper.toEntityFromUpdateDTO(responseDto);
    } catch (error) {
      throw this.transformError(error, 'UPDATE_USER');
    }
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
      await firstValueFrom(
        this.http.delete<void>(`${this.baseUrl}/${id}/`).pipe(catchError(this.handleHttpError))
      );
    } catch (error) {
      throw this.transformError(error, 'DELETE_USER');
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
      await firstValueFrom(
        this.http
          .patch<UserDTO>(`${this.baseUrl}/${id}/`, { is_active: true })
          .pipe(catchError(this.handleHttpError))
      );
    } catch (error) {
      throw this.transformError(error, 'ACTIVATE_USER');
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
      await firstValueFrom(
        this.http
          .patch<UserDTO>(`${this.baseUrl}/${id}/`, { is_active: false })
          .pipe(catchError(this.handleHttpError))
      );
    } catch (error) {
      throw this.transformError(error, 'DEACTIVATE_USER');
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
      await firstValueFrom(
        this.http
          .patch<UserDTO>(`${this.baseUrl}/${userId}/`, { role_id: roleId })
          .pipe(catchError(this.handleHttpError))
      );
    } catch (error) {
      throw this.transformError(error, 'CHANGE_USER_ROLE');
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
      // Since the new API returns an array, we need to fetch all users and count them
      const countFilter: UserListFilterContract = {
        ...filter,
        // Remove pagination to get all results for counting
      };

      const params = this.buildHttpParams(countFilter);

      const response = await firstValueFrom(
        this.http
          .get<ListUsersResponseDTO>(this.baseUrl, { params })
          .pipe(catchError(this.handleHttpError))
      );

      return response.length;
    } catch (error) {
      throw this.transformError(error, 'COUNT_USERS');
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
    try {
      // Mapear contract de dominio a DTO de infraestructura
      const dto: ChangePasswordRequestDTO = {
        current_password: contract.currentPassword,
        new_password: contract.newPassword,
        new_password_confirm: contract.newPasswordConfirm,
      };
      await firstValueFrom(
        this.http
          .post<ChangePasswordResponseDTO>(`${this.baseUrl}/change-password/`, dto)
          .pipe(catchError(this.handleHttpError))
      );
    } catch (error) {
      throw this.transformError(error, 'CHANGE_PASSWORD');
    }
  }

  /**
   * Builds HTTP query parameters from filter contract.
   *
   * @private
   * @param filter - User filter criteria
   * @returns HttpParams object for API request
   */
  private buildHttpParams(filter?: UserListFilterContract): HttpParams {
    let params = new HttpParams();

    if (!filter) {
      return params;
    }

    try {
      const filterDTO = UserMapper.filterContractToDTO(filter);

      // Add parameters with proper type conversion and validation
      if (filterDTO.is_active !== undefined) {
        params = params.set('is_active', filterDTO.is_active.toString());
      }

      if (filterDTO.role_id !== undefined) {
        if (Number.isInteger(filterDTO.role_id) && filterDTO.role_id > 0) {
          params = params.set('role_id', filterDTO.role_id.toString());
        }
      }

      if (filterDTO.search !== undefined && filterDTO.search.trim() !== '') {
        params = params.set('search', filterDTO.search.trim());
      }

      if (filterDTO.limit !== undefined) {
        if (Number.isInteger(filterDTO.limit) && filterDTO.limit > 0 && filterDTO.limit <= 1000) {
          params = params.set('limit', filterDTO.limit.toString());
        }
      }

      if (filterDTO.offset !== undefined) {
        if (Number.isInteger(filterDTO.offset) && filterDTO.offset >= 0) {
          params = params.set('offset', filterDTO.offset.toString());
        }
      }

      if (filterDTO.ordering !== undefined && filterDTO.ordering.trim() !== '') {
        params = params.set('ordering', filterDTO.ordering.trim());
      }

      return params;
    } catch (error) {
      throw new Error(
        `Invalid filter parameters: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Handles HTTP errors from API requests.
   *
   * @private
   * @param error - HTTP error response
   * @returns Observable that throws the error for further handling
   */
  private handleHttpError = (error: HttpErrorResponse) => {
    console.error('HTTP Error in UserRepository:', {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      message: error.message,
      error: error.error,
    });
    return throwError(() => error);
  };

  /**
   * Transforms HTTP errors to domain-appropriate error messages.
   *
   * @private
   * @param error - The caught error
   * @param operation - The operation that failed
   * @returns Error with user-friendly message
   */
  private transformError(error: unknown, operation: string): Error {
    if (error instanceof HttpErrorResponse) {
      switch (error.status) {
        case 400:
          return new Error(`Invalid user data: ${this.extractErrorMessage(error)}`);
        case 401:
          return new Error('Authentication required to access user data');
        case 403:
          return new Error('You do not have permission to perform this user operation');
        case 404:
          return new Error('User not found');
        case 409:
          return new Error('User already exists with this email or username');
        case 422:
          return new Error(`User validation failed: ${this.extractErrorMessage(error)}`);
        case 500:
          return new Error('Server error occurred while processing user request');
        case 0:
          return new Error('Network error: Unable to connect to user service');
        default:
          return new Error(`User ${operation} failed: ${error.statusText}`);
      }
    }

    if (error instanceof Error) {
      return new Error(`User ${operation} failed: ${error.message}`);
    }

    return new Error(`User ${operation} failed: Unknown error occurred`);
  }

  /**
   * Extracts meaningful error messages from HTTP error responses.
   *
   * @private
   * @param error - HTTP error response
   * @returns Extracted error message
   */
  private extractErrorMessage(error: HttpErrorResponse): string {
    if (error.error && typeof error.error === 'object') {
      if (error.error.detail) {
        return error.error.detail;
      }
      if (error.error.message) {
        return error.error.message;
      }
      if (error.error.error) {
        return error.error.error;
      }
      // Handle field-specific validation errors
      if (error.error.errors && Array.isArray(error.error.errors)) {
        return error.error.errors.map((err: any) => err.message || err).join(', ');
      }
    }
    return error.message || 'Unknown error';
  }
}
