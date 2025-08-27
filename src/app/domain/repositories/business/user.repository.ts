import { User } from '@domain/entities/user.entity';
import {
  CreateUserContract,
  UpdateUserPatchContract,
  UserListFilterContract,
  ChangePasswordContract,
} from '@domain/repositories/business/user.contract';

/**
 * @fileoverview Domain repository interface for user management operations.
 *
 * @description Defines comprehensive contracts for user lifecycle management including
 * CRUD operations, filtering, searching, and administrative functions. This interface
 * follows Domain-Driven Design principles and provides a clean boundary between
 * domain logic and infrastructure concerns.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 *
 * @example Basic User Operations
 * ```typescript
 * // In a use case
 * @Injectable({ providedIn: 'root' })
 * export class GetUserUseCase {
 *   constructor(@Inject(USER_REPOSITORY) private userRepo: UserRepository) {}
 *
 *   async execute(id: number): Promise<User> {
 *     return this.userRepo.getById(id);
 *   }
 * }
 * ```
 *
 * @example Advanced Filtering
 * ```typescript
 * const activeUsers = await userRepository.list({
 *   status: 'active',
 *   roleId: 2,
 *   search: 'john',
 *   limit: 10,
 *   offset: 0
 * });
 * ```
 *
 * @see {@link User} - User domain entity
 * @see {@link CreateUserContract} - User creation specification
 * @see {@link UpdateUserPatchContract} - User update specification
 * @see {@link UserListFilterContract} - User filtering and pagination
 */

/**
 * Repository interface for user management operations.
 *
 * @description Provides comprehensive contracts for all user-related data operations
 * including creation, retrieval, updates, deletion, and administrative functions.
 * All operations work with domain entities and contracts, maintaining clean architecture.
 *
 * @interface UserRepository
 *
 * @businessRules
 * - User uniqueness constraints must be enforced (email, username)
 * - Soft deletion should be preferred over hard deletion for audit purposes
 * - User activation/deactivation must preserve data integrity
 * - Role changes must validate authorization and business rules
 * - All operations must maintain referential integrity
 *
 * @performanceConsiderations
 * - List operations should support pagination to handle large datasets
 * - Search operations should be optimized with appropriate indexing
 * - Filtering should be implemented at the database level when possible
 * - Bulk operations should be supported for administrative efficiency
 *
 * @securityNotes
 * - All operations should validate authorization context
 * - Sensitive data access should be logged for audit purposes
 * - User enumeration attacks should be prevented
 * - Rate limiting should be considered for search operations
 */
export interface UserRepository {
  /**
   * Retrieves a filtered and paginated list of users.
   *
   * @description Fetches users based on provided filtering criteria with support
   * for pagination, sorting, and search functionality. This is the primary method
   * for user listing and discovery operations.
   *
   * @param filter - Optional filtering, pagination, and sorting criteria
   * @returns Promise resolving to array of User entities matching criteria
   *
   * @throws {ValidationError} When filter parameters are invalid
   * @throws {UnauthorizedError} When caller lacks permission to list users
   * @throws {NetworkError} When user service is unavailable
   *
   * @businessRules
   * - Must respect caller's access permissions
   * - Should apply default sorting if none specified
   * - Must validate pagination parameters
   * - Should optimize queries for large datasets
   *
   * @example Basic User Listing
   * ```typescript
   * // Get all active users
   * const activeUsers = await userRepository.list({
   *   status: 'active'
   * });
   *
   * console.log(`Found ${activeUsers.length} active users`);
   * ```
   *
   * @example Paginated Search
   * ```typescript
   * // Search for users with pagination
   * const searchResults = await userRepository.list({
   *   search: 'john',
   *   limit: 20,
   *   offset: 0,
   *   sortBy: 'lastName',
   *   sortDirection: 'asc'
   * });
   *
   * // Get total count for pagination
   * const totalCount = await userRepository.count({ search: 'john' });
   * console.log(`Showing ${searchResults.length} of ${totalCount} results`);
   * ```
   *
   * @example Advanced Filtering
   * ```typescript
   * // Complex filtering example
   * const filteredUsers = await userRepository.list({
   *   status: 'active',
   *   roleId: 2,
   *   createdAfter: new Date('2024-01-01'),
   *   lastActivityBefore: new Date('2024-06-01'),
   *   limit: 50,
   *   offset: 0
   * });
   * ```
   */
  list(filter?: UserListFilterContract): Promise<User[]>;

  /**
   * Retrieves a specific user by ID.
   *
   * @description Fetches a complete user entity by its unique identifier.
   * This operation should return the most current user data including
   * role information and account status.
   *
   * @param id - Unique user identifier
   * @returns Promise resolving to User entity
   *
   * @throws {UserNotFoundError} When user with specified ID doesn't exist
   * @throws {UnauthorizedError} When caller lacks permission to access user
   * @throws {ValidationError} When ID format is invalid
   * @throws {NetworkError} When user service is unavailable
   *
   * @businessRules
   * - Must validate ID format and range
   * - Should respect caller's access permissions
   * - Must return complete user profile with relationships
   * - Should include current account status
   *
   * @example User Retrieval
   * ```typescript
   * try {
   *   const user = await userRepository.getById(123);
   *   console.log(`User: ${user.fullName} (${user.email.value})`);
   *   console.log(`Role: ${user.role.name}`);
   *   console.log(`Status: ${user.isActive ? 'Active' : 'Inactive'}`);
   * } catch (error) {
   *   if (error instanceof UserNotFoundError) {
   *     console.error('User not found');
   *   }
   * }
   * ```
   *
   * @example Permission Checking
   * ```typescript
   * // In a use case with authorization
   * async getUserProfile(requesterId: number, targetUserId: number): Promise<User> {
   *   // Check if requester can access target user
   *   if (requesterId !== targetUserId && !this.hasAdminRole(requesterId)) {
   *     throw new UnauthorizedError('Cannot access other user profiles');
   *   }
   *
   *   return this.userRepository.getById(targetUserId);
   * }
   * ```
   */
  getById(id: number): Promise<User>;

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
   * @throws {ValidationError} When email format is invalid
   * @throws {UnauthorizedError} When caller lacks permission for email lookup
   * @throws {NetworkError} When user service is unavailable
   *
   * @businessRules
   * - Must validate email format before search
   * - Should be case-insensitive search
   * - Must not reveal account existence to unauthorized callers
   * - Should log lookup attempts for security monitoring
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
   *
   * @example Safe Authentication Check
   * ```typescript
   * // Safe way to check if email exists during registration
   * async isEmailAvailable(email: string): Promise<boolean> {
   *   try {
   *     const existingUser = await userRepository.getByEmail(email);
   *     return existingUser === null;
   *   } catch (error) {
   *     // Handle errors appropriately
   *     return false; // Assume unavailable on error
   *   }
   * }
   * ```
   */
  getByEmail(email: string): Promise<User | null>;

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
   * @throws {ValidationError} When username format is invalid
   * @throws {UnauthorizedError} When caller lacks permission for username lookup
   * @throws {NetworkError} When user service is unavailable
   *
   * @businessRules
   * - Must validate username format before search
   * - Should be case-insensitive search
   * - Must not reveal account existence to unauthorized callers
   * - Should log lookup attempts for security monitoring
   *
   * @example Username Lookup
   * ```typescript
   * const user = await userRepository.getByUsername('johndoe');
   * if (user) {
   *   console.log(`Found user: ${user.email.value}`);
   * } else {
   *   console.log('Username not found');
   * }
   * ```
   *
   * @example Username Availability Check
   * ```typescript
   * async isUsernameAvailable(username: string): Promise<boolean> {
   *   const existingUser = await userRepository.getByUsername(username);
   *   return existingUser === null;
   * }
   * ```
   */
  getByUsername(username: string): Promise<User | null>;

  /**
   * Cambia la contraseña del usuario autenticado.
   *
   * @description Permite a un usuario cambiar su contraseña actual.
   * @param request - Datos de cambio de contraseña
   * @returns Promise que resuelve cuando el cambio fue exitoso
   * @throws {ValidationError} Si los datos son inválidos
   * @throws {UnauthorizedError} Si el usuario no está autenticado
   * @throws {NetworkError} Si el servicio no está disponible
   * @businessRules
   * - Debe validar la contraseña actual
   * - Debe cumplir reglas de complejidad
   * - Debe confirmar la nueva contraseña
   * - Debe registrar el cambio para auditoría
   */
  /**
   * Cambia la contraseña del usuario autenticado.
   *
   * @description Permite a un usuario cambiar su contraseña actual.
   * @param contract - Datos de cambio de contraseña (dominio)
   * @returns Promise que resuelve cuando el cambio fue exitoso
   * @throws {ValidationError} Si los datos son inválidos
   * @throws {UnauthorizedError} Si el usuario no está autenticado
   * @throws {NetworkError} Si el servicio no está disponible
   * @businessRules
   * - Debe validar la contraseña actual
   * - Debe cumplir reglas de complejidad
   * - Debe confirmar la nueva contraseña
   * - Debe registrar el cambio para auditoría
   */
  changePassword(contract: ChangePasswordContract): Promise<void>;

  /**
   * Creates a new user account.
   *
   * @description Creates a new user with the provided specification data.
   * This operation should validate all business rules, enforce uniqueness
   * constraints, and assign appropriate default values.
   *
   * @param spec - Complete user creation specification
   * @returns Promise resolving to the newly created User entity
   *
   * @throws {ValidationError} When user data is invalid
   * @throws {ConflictError} When username or email already exists
   * @throws {UnauthorizedError} When caller lacks permission to create users
   * @throws {BusinessRuleError} When business rules are violated
   * @throws {NetworkError} When user service is unavailable
   *
   * @businessRules
   * - Must validate all input data before creation
   * - Should enforce unique constraints for email and username
   * - Must assign valid default role if none specified
   * - Should generate secure password hash
   * - Must set appropriate default account status
   * - Should trigger welcome/verification workflows
   *
   * @example User Creation
   * ```typescript
   * const userSpec = {
   *   username: 'johndoe',
   *   email: 'john@example.com',
   *   firstName: 'John',
   *   lastName: 'Doe',
   *   password: 'SecurePassword123!',
   *   roleId: 2
   * };
   *
   * try {
   *   const newUser = await userRepository.create(userSpec);
   *   console.log(`Created user ${newUser.id}: ${newUser.fullName}`);
   *
   *   // Trigger welcome email
   *   await emailService.sendWelcomeEmail(newUser.email.value);
   * } catch (error) {
   *   if (error instanceof ConflictError) {
   *     console.error('Username or email already exists');
   *   }
   * }
   * ```
   *
   * @example Batch User Creation
   * ```typescript
   * // Create multiple users efficiently
   * const userSpecs = [
   *   { username: 'user1', email: 'user1@example.com', ... },
   *   { username: 'user2', email: 'user2@example.com', ... },
   * ];
   *
   * const createdUsers = await Promise.allSettled(
   *   userSpecs.map(spec => userRepository.create(spec))
   * );
   *
   * const successful = createdUsers
   *   .filter(result => result.status === 'fulfilled')
   *   .map(result => result.value);
   * ```
   */
  create(spec: CreateUserContract): Promise<User>;

  /**
   * Updates an existing user with partial data.
   *
   * @description Applies partial updates to an existing user account.
   * Only provided fields are updated, leaving other fields unchanged.
   * This operation should validate business rules and constraints.
   *
   * @param id - ID of user to update
   * @param patch - Partial update data
   * @returns Promise resolving to the updated User entity
   *
   * @throws {UserNotFoundError} When user with specified ID doesn't exist
   * @throws {ValidationError} When update data is invalid
   * @throws {ConflictError} When update would violate uniqueness constraints
   * @throws {UnauthorizedError} When caller lacks permission to update user
   * @throws {BusinessRuleError} When business rules are violated
   * @throws {NetworkError} When user service is unavailable
   *
   * @businessRules
   * - Must validate user exists before updating
   * - Should enforce uniqueness constraints for changed fields
   * - Must validate caller's permission to update target user
   * - Should preserve data integrity during updates
   * - Must log significant changes for audit purposes
   *
   * @example Profile Update
   * ```typescript
   * // Update user's name and email
   * const updates = {
   *   firstName: 'Johnny',
   *   email: 'johnny@example.com'
   * };
   *
   * try {
   *   const updatedUser = await userRepository.update(123, updates);
   *   console.log(`Updated user: ${updatedUser.fullName}`);
   * } catch (error) {
   *   if (error instanceof ConflictError) {
   *     console.error('Email address already in use');
   *   }
   * }
   * ```
   *
   * @example Conditional Update
   * ```typescript
   * // Update only if certain conditions are met
   * async updateUserIfAllowed(
   *   userId: number,
   *   updates: UpdateUserPatchContract,
   *   requesterId: number
   * ): Promise<User> {
   *   // Check permissions
   *   if (userId !== requesterId && !this.isAdmin(requesterId)) {
   *     throw new UnauthorizedError('Cannot update other user profiles');
   *   }
   *
   *   return this.userRepository.update(userId, updates);
   * }
   * ```
   */
  update(id: number, patch: UpdateUserPatchContract): Promise<User>;

  /**
   * Deletes a user account.
   *
   * @description Removes a user account from the system. This operation should
   * implement soft deletion by default to preserve audit trails and data integrity.
   * Hard deletion should only be used for GDPR compliance or similar requirements.
   *
   * @param id - ID of user to delete
   * @returns Promise that resolves when deletion is complete
   *
   * @throws {UserNotFoundError} When user with specified ID doesn't exist
   * @throws {UnauthorizedError} When caller lacks permission to delete user
   * @throws {BusinessRuleError} When user cannot be deleted due to business rules
   * @throws {NetworkError} When user service is unavailable
   *
   * @businessRules
   * - Must validate user exists before deletion
   * - Should implement soft deletion by default
   * - Must check for dependent data before allowing deletion
   * - Should preserve audit trail of deletion
   * - Must validate caller's permission to delete target user
   * - Should handle cascading effects appropriately
   *
   * @example Soft Deletion
   * ```typescript
   * try {
   *   await userRepository.delete(123);
   *   console.log('User account deleted successfully');
   * } catch (error) {
   *   if (error instanceof BusinessRuleError) {
   *     console.error('Cannot delete user with active dependencies');
   *   }
   * }
   * ```
   *
   * @example Safe Deletion with Validation
   * ```typescript
   * async safeDeleteUser(userId: number, requesterId: number): Promise<void> {
   *   // Validate permissions
   *   if (!this.canDeleteUser(requesterId, userId)) {
   *     throw new UnauthorizedError('Insufficient permissions');
   *   }
   *
   *   // Check for dependencies
   *   const hasActiveSessions = await this.sessionRepo.hasActiveSessions(userId);
   *   if (hasActiveSessions) {
   *     throw new BusinessRuleError('Cannot delete user with active sessions');
   *   }
   *
   *   await this.userRepository.delete(userId);
   * }
   * ```
   */
  delete(id: number): Promise<void>;

  /**
   * Activates a user account.
   *
   * @description Enables a user account, allowing the user to authenticate
   * and access the system. This operation is typically used for account
   * recovery or administrative account management.
   *
   * @param id - ID of user to activate
   * @returns Promise that resolves when activation is complete
   *
   * @throws {UserNotFoundError} When user with specified ID doesn't exist
   * @throws {UnauthorizedError} When caller lacks permission to activate user
   * @throws {BusinessRuleError} When account cannot be activated
   * @throws {NetworkError} When user service is unavailable
   *
   * @businessRules
   * - Must validate user exists before activation
   * - Should verify caller has administrative permissions
   * - Must check if account is eligible for activation
   * - Should log activation events for audit purposes
   * - Must notify user of account activation if appropriate
   *
   * @example User Activation
   * ```typescript
   * try {
   *   await userRepository.activate(123);
   *   console.log('User account activated successfully');
   *
   *   // Notify user of activation
   *   const user = await userRepository.getById(123);
   *   await emailService.sendActivationNotification(user.email.value);
   * } catch (error) {
   *   if (error instanceof BusinessRuleError) {
   *     console.error('Account cannot be activated at this time');
   *   }
   * }
   * ```
   */
  activate(id: number): Promise<void>;

  /**
   * Deactivates a user account.
   *
   * @description Disables a user account, preventing authentication while
   * preserving account data. This is typically used for temporary suspensions
   * or administrative account management.
   *
   * @param id - ID of user to deactivate
   * @returns Promise that resolves when deactivation is complete
   *
   * @throws {UserNotFoundError} When user with specified ID doesn't exist
   * @throws {UnauthorizedError} When caller lacks permission to deactivate user
   * @throws {BusinessRuleError} When account cannot be deactivated
   * @throws {NetworkError} When user service is unavailable
   *
   * @businessRules
   * - Must validate user exists before deactivation
   * - Should verify caller has administrative permissions
   * - Must invalidate active sessions upon deactivation
   * - Should log deactivation events for audit purposes
   * - Must notify user of account deactivation if appropriate
   *
   * @example User Deactivation
   * ```typescript
   * try {
   *   await userRepository.deactivate(123);
   *   console.log('User account deactivated successfully');
   *
   *   // Invalidate active sessions
   *   await sessionService.invalidateUserSessions(123);
   * } catch (error) {
   *   if (error instanceof BusinessRuleError) {
   *     console.error('Account cannot be deactivated at this time');
   *   }
   * }
   * ```
   */
  deactivate(id: number): Promise<void>;

  /**
   * Changes a user's role assignment.
   *
   * @description Updates the role assigned to a user, affecting their
   * permissions and access levels within the system. This operation
   * should validate role compatibility and business rules.
   *
   * @param userId - ID of user whose role to change
   * @param roleId - ID of new role to assign
   * @returns Promise that resolves when role change is complete
   *
   * @throws {UserNotFoundError} When user with specified ID doesn't exist
   * @throws {RoleNotFoundError} When role with specified ID doesn't exist
   * @throws {UnauthorizedError} When caller lacks permission to change roles
   * @throws {BusinessRuleError} When role change violates business rules
   * @throws {NetworkError} When user service is unavailable
   *
   * @businessRules
   * - Must validate both user and role exist
   * - Should verify caller has permission to assign specified role
   * - Must check role compatibility with user's account status
   * - Should invalidate cached permissions after role change
   * - Must log role changes for audit and compliance purposes
   *
   * @example Role Assignment
   * ```typescript
   * try {
   *   await userRepository.changeRole(123, 2); // Assign role ID 2
   *   console.log('User role updated successfully');
   *
   *   // Clear cached permissions
   *   await permissionCache.clearUserPermissions(123);
   * } catch (error) {
   *   if (error instanceof BusinessRuleError) {
   *     console.error('Role assignment violates business rules');
   *   }
   * }
   * ```
   *
   * @example Role Migration
   * ```typescript
   * // Bulk role changes for organizational restructuring
   * async migrateUsersToNewRole(
   *   oldRoleId: number,
   *   newRoleId: number
   * ): Promise<void> {
   *   const users = await userRepository.list({ roleId: oldRoleId });
   *
   *   for (const user of users) {
   *     try {
   *       await userRepository.changeRole(user.id, newRoleId);
   *       console.log(`Migrated user ${user.id} to new role`);
   *     } catch (error) {
   *       console.error(`Failed to migrate user ${user.id}:`, error.message);
   *     }
   *   }
   * }
   * ```
   */
  changeRole(userId: number, roleId: number): Promise<void>;

  /**
   * Counts users matching specified criteria.
   *
   * @description Returns the total number of users that match the given
   * filtering criteria. This is typically used for pagination calculations
   * and reporting purposes.
   *
   * @param filter - Optional filtering criteria (excluding pagination)
   * @returns Promise resolving to the count of matching users
   *
   * @throws {ValidationError} When filter parameters are invalid
   * @throws {UnauthorizedError} When caller lacks permission to count users
   * @throws {NetworkError} When user service is unavailable
   *
   * @businessRules
   * - Must respect caller's access permissions
   * - Should apply same filtering logic as list operation
   * - Must validate filter parameters
   * - Should be optimized for performance on large datasets
   *
   * @example Pagination Support
   * ```typescript
   * const pageSize = 20;
   * const pageNumber = 1;
   * const filter = { status: 'active', roleId: 2 };
   *
   * // Get page data and total count
   * const [users, totalCount] = await Promise.all([
   *   userRepository.list({
   *     ...filter,
   *     limit: pageSize,
   *     offset: pageNumber * pageSize
   *   }),
   *   userRepository.count(filter)
   * ]);
   *
   * console.log(`Showing ${users.length} of ${totalCount} users`);
   * console.log(`Page ${pageNumber + 1} of ${Math.ceil(totalCount / pageSize)}`);
   * ```
   *
   * @example Reporting Statistics
   * ```typescript
   * // Generate user statistics
   * const [
   *   totalUsers,
   *   activeUsers,
   *   adminUsers,
   *   recentUsers
   * ] = await Promise.all([
   *   userRepository.count(),
   *   userRepository.count({ status: 'active' }),
   *   userRepository.count({ roleId: 1 }), // Admin role
   *   userRepository.count({
   *     createdAfter: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
   *   })
   * ]);
   *
   * console.log(`Total: ${totalUsers}, Active: ${activeUsers}`);
   * console.log(`Admins: ${adminUsers}, Recent: ${recentUsers}`);
   * ```
   */
  count(filter?: Omit<UserListFilterContract, 'limit' | 'offset'>): Promise<number>;
}
