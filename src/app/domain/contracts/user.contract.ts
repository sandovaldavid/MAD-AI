/**
 * Contract for filtering user lists in the MAD-AI system.
 * Provides comprehensive filtering capabilities for user management operations.
 *
 * @description This contract enables flexible user queries with optional filters
 * for active status, role assignment, text search, and pagination support.
 * All filters are optional, allowing for both broad and specific queries.
 *
 * @example Active users in a specific role
 * ```typescript
 * const filter: UserListFilterContract = {
 *   isActive: true,
 *   roleId: 2,
 *   limit: 20,
 *   offset: 0
 * };
 * ```
 *
 * @example Text search with pagination
 * ```typescript
 * const searchFilter: UserListFilterContract = {
 *   searchTerm: 'john',
 *   limit: 10,
 *   offset: 20
 * };
 * ```
 *
 * @since 1.0.0
 * @domain User Management
 */
export interface UserListFilterContract {
    /**
     * Filter by user active status.
     * When true, returns only active users.
     * When false, returns only inactive users.
     * When undefined, returns users regardless of status.
     */
    isActive?: boolean;
    /**
     * Filter by specific role ID.
     * Returns only users assigned to the specified role.
     */
    roleId?: number;
    /**
     * Text search across username, email, first name, and last name.
     * Performs case-insensitive partial matching.
     */
    searchTerm?: string;
    /**
     * Maximum number of users to return.
     * Used for pagination and performance optimization.
     * @default 50
     */
    limit?: number;
    /**
     * Number of users to skip from the beginning.
     * Used for pagination in combination with limit.
     * @default 0
     */
    offset?: number;
}

/**
 * Contract for creating new users in the MAD-AI system.
 * Encapsulates all required information for user account creation by administrators.
 *
 * @description This contract is used for administrative user creation,
 * distinct from self-registration which uses RegisterUserContract.
 * It requires explicit role assignment and allows setting initial active status.
 *
 * @example Creating an active user
 * ```typescript
 * const newUser: CreateUserContract = {
 *   username: 'jane_smith',
 *   email: 'jane@madai.com',
 *   firstName: 'Jane',
 *   lastName: 'Smith',
 *   roleId: 3,
 *   isActive: true
 * };
 * ```
 *
 * @since 1.0.0
 * @domain User Management
 */
export interface CreateUserContract {
    /** Unique username for the new user account */
    username: string;
    /** Email address for the new user account */
    email: string;
    /** User's first name */
    firstName: string;
    /** User's last name */
    lastName: string;
    /** Role ID to assign to the new user */
    roleId: number;
    /**
     * Initial active status for the user account.
     * @default true
     */
    isActive?: boolean;
}

/**
 * Contract for partially updating existing users in the MAD-AI system.
 * Supports atomic updates of individual user properties using PATCH semantics.
 *
 * @description This contract enables partial updates where only the specified
 * fields will be modified, leaving other properties unchanged. All fields are
 * optional, allowing for flexible update operations.
 *
 * @example Updating only the role
 * ```typescript
 * const roleUpdate: UpdateUserPatchContract = {
 *   roleId: 4
 * };
 * ```
 *
 * @example Updating personal information
 * ```typescript
 * const personalUpdate: UpdateUserPatchContract = {
 *   firstName: 'Jane',
 *   lastName: 'Doe-Smith',
 *   email: 'jane.doe-smith@madai.com'
 * };
 * ```
 *
 * @example Deactivating a user
 * ```typescript
 * const deactivation: UpdateUserPatchContract = {
 *   isActive: false
 * };
 * ```
 *
 * @since 1.0.0
 * @domain User Management
 */
export interface UpdateUserPatchContract {
    /** Updated username (must remain unique) */
    username?: string;
    /** Updated email address (must remain unique) */
    email?: string;
    /** Updated first name */
    firstName?: string;
    /** Updated last name */
    lastName?: string;
    /** Updated role assignment */
    roleId?: number;
    /** Updated active status */
    isActive?: boolean;
}
