/**
 * @fileoverview User Data Transfer Objects for API communication
 *
 * @description Defines the exact structure of User-related data as received from
 * and sent to the backend API. These DTOs represent the API contract and should
 * match the backend response/request formats exactly.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 *
 * @apiEndpoints
 * - GET /api/v1/users/ - List users (returns UserDTO[])
 * - GET /api/v1/users/{id}/ - Get user by ID (returns UserDTO)
 * - POST /api/v1/users/ - Create user (expects CreateUserRequestDTO, returns UserDTO)
 * - PUT /api/v1/users/{id}/ - Update user (expects UpdateUserRequestDTO, returns UserDTO)
 * - DELETE /api/v1/users/{id}/ - Delete user (returns void)
 *
 * @example API Response Structure
 * ```json
 * {
 *   "id": 123,
 *   "username": "john_doe",
 *   "email": "john@example.com",
 *   "first_name": "John",
 *   "last_name": "Doe",
 *   "is_active": true,
 *   "is_verified": true,
 *   "created_at": "2024-01-15T10:30:00Z",
 *   "updated_at": "2024-01-15T10:30:00Z",
 *   "last_login": "2024-01-15T08:45:00Z",
 *   "roles": [
 *     {
 *       "id": 2,
 *       "name": "Editor",
 *       "description": "Can edit content"
 *     }
 *   ]
 * }
 * ```
 */

import type { RoleDTO } from '../roles/roles.dto';

/**
 * User data transfer object representing a complete user entity from the API.
 *
 * @description This DTO represents the structure of user data as returned by
 * the backend API. It includes all user properties, role assignments, and
 * metadata timestamps.
 *
 * @interface UserDTO
 *
 * @property id - Unique user identifier
 * @property username - Unique username for login
 * @property email - User's email address (unique)
 * @property first_name - User's first name
 * @property last_name - User's last name
 * @property is_active - Whether the user account is active
 * @property is_verified - Whether the user's email is verified
 * @property created_at - ISO timestamp of account creation
 * @property updated_at - ISO timestamp of last update
 * @property last_login - ISO timestamp of last login (nullable)
 * @property roles - Array of roles assigned to the user
 */
export interface UserDTO {
  /** Unique user identifier */
  readonly id: number;

  /** Unique username for authentication */
  readonly username: string;

  /** User's email address (unique) */
  readonly email: string;

  /** User's first name */
  readonly first_name: string;

  /** User's last name */
  readonly last_name: string;

  /** Account active status */
  readonly is_active: boolean;

  /** Email verification status */
  readonly is_verified: boolean;

  /** Account creation timestamp (ISO 8601) */
  readonly created_at: string;

  /** Last update timestamp (ISO 8601) */
  readonly updated_at: string;

  /** Last login timestamp (ISO 8601, nullable) */
  readonly last_login: string | null;

  /** Array of roles assigned to the user */
  readonly roles: RoleDTO[];
}

/**
 * User creation request DTO for POST /api/v1/users/
 *
 * @description Structure expected by the API when creating a new user.
 * This is used by administrators to create user accounts with role assignment.
 *
 * @interface CreateUserRequestDTO
 *
 * @property username - Unique username for the new account
 * @property email - Unique email address for the new account
 * @property first_name - User's first name
 * @property last_name - User's last name
 * @property password - Plain text password (will be hashed by backend)
 * @property role_id - ID of the role to assign to the user
 * @property is_active - Initial active status (optional, defaults to true)
 *
 * @example
 * ```typescript
 * const createRequest: CreateUserRequestDTO = {
 *   username: 'jane_doe',
 *   email: 'jane@example.com',
 *   first_name: 'Jane',
 *   last_name: 'Doe',
 *   password: 'SecurePassword123!',
 *   role_id: 2,
 *   is_active: true
 * };
 * ```
 */
export interface CreateUserRequestDTO {
  /** Unique username for the new account */
  readonly username: string;

  /** Unique email address for the new account */
  readonly email: string;

  /** User's first name */
  readonly first_name: string;

  /** User's last name */
  readonly last_name: string;

  /** Plain text password (will be hashed by backend) */
  readonly password: string;

  /** ID of the role to assign to the user */
  readonly role_id: number;

  /** Initial active status (optional, defaults to true) */
  readonly is_active?: boolean;
}

/**
 * User update request DTO for PUT/PATCH /api/v1/users/{id}/
 *
 * @description Structure expected by the API when updating an existing user.
 * All fields are optional, allowing for partial updates.
 *
 * @interface UpdateUserRequestDTO
 *
 * @property username - Updated username (must remain unique)
 * @property email - Updated email address (must remain unique)
 * @property first_name - Updated first name
 * @property last_name - Updated last name
 * @property role_id - Updated role assignment
 * @property is_active - Updated active status
 *
 * @example Profile Update
 * ```typescript
 * const updateRequest: UpdateUserRequestDTO = {
 *   first_name: 'Jane',
 *   last_name: 'Smith',
 *   email: 'jane.smith@example.com'
 * };
 * ```
 *
 * @example Role Change
 * ```typescript
 * const roleUpdate: UpdateUserRequestDTO = {
 *   role_id: 3
 * };
 * ```
 */
export interface UpdateUserRequestDTO {
  /** Updated username (must remain unique) */
  readonly username?: string;

  /** Updated email address (must remain unique) */
  readonly email?: string;

  /** Updated first name */
  readonly first_name?: string;

  /** Updated last name */
  readonly last_name?: string;

  /** Updated role assignment */
  readonly role_id?: number;

  /** Updated active status */
  readonly is_active?: boolean;
}

/**
 * User list filter DTO for GET /api/v1/users/ query parameters
 *
 * @description Structure for filtering and pagination parameters when
 * requesting a list of users from the API.
 *
 * @interface UserListFilterDTO
 *
 * @property is_active - Filter by active status
 * @property role_id - Filter by specific role ID
 * @property search - Text search across name, username, and email
 * @property limit - Maximum number of results to return
 * @property offset - Number of results to skip (for pagination)
 * @property ordering - Field to sort by (e.g., 'username', '-created_at')
 *
 * @example Active Users Filter
 * ```typescript
 * const filter: UserListFilterDTO = {
 *   is_active: true,
 *   limit: 20,
 *   offset: 0,
 *   ordering: 'last_name'
 * };
 * ```
 *
 * @example Search with Pagination
 * ```typescript
 * const searchFilter: UserListFilterDTO = {
 *   search: 'john',
 *   limit: 10,
 *   offset: 20,
 *   ordering: '-created_at'
 * };
 * ```
 */
export interface UserListFilterDTO {
  /** Filter by active status (true=active, false=inactive) */
  readonly is_active?: boolean;

  /** Filter by specific role ID */
  readonly role_id?: number;

  /** Text search across username, email, first_name, last_name */
  readonly search?: string;

  /** Maximum number of results to return (default: 50) */
  readonly limit?: number;

  /** Number of results to skip for pagination (default: 0) */
  readonly offset?: number;

  /** Field to sort by (prefix with '-' for descending) */
  readonly ordering?: string;
}

/**
 * Paginated user list response DTO from GET /api/v1/users/
 *
 * @description Structure returned by the API for paginated user lists.
 * Includes the results array and pagination metadata.
 *
 * @interface UserListResponseDTO
 *
 * @property count - Total number of users matching the filter
 * @property next - URL for the next page (null if last page)
 * @property previous - URL for the previous page (null if first page)
 * @property results - Array of user DTOs for the current page
 *
 * @example
 * ```json
 * {
 *   "count": 150,
 *   "next": "http://localhost:8004/api/v1/users/?limit=20&offset=20",
 *   "previous": null,
 *   "results": [
 *     {
 *       "id": 1,
 *       "username": "admin",
 *       ...
 *     }
 *   ]
 * }
 * ```
 */
export interface UserListResponseDTO {
  /** Total number of users matching the filter */
  readonly count: number;

  /** URL for the next page (null if last page) */
  readonly next: string | null;

  /** URL for the previous page (null if first page) */
  readonly previous: string | null;

  /** Array of user DTOs for the current page */
  readonly results: UserDTO[];
}
