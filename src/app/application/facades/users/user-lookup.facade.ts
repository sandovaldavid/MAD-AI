import { Injectable } from '@angular/core';
import { BaseUserFacade } from './base-user.facade';

// Application Layer Imports
import type { FacadeOpts } from '@application/types/facade-opts';
import type { Message } from '@application/types/message.type';
import type { UserLookupCriteria } from '@/app/application/types/users/users.types';

/**
 * User Lookup Operations Facade
 *
 * @description
 * Specialized facade handling user discovery and lookup operations through various
 * criteria including ID, email, username, and flexible multi-criteria searches.
 * This facade focuses exclusively on user retrieval functionality, providing
 * optimized methods for different lookup scenarios.
 *
 * @responsibilities
 * - Handle user lookup by unique identifier (ID)
 * - Process user discovery by email address
 * - Manage user retrieval by username
 * - Provide unified lookup interface for multiple criteria
 * - Optimize lookup operations with appropriate error handling
 * - Maintain consistent error states across lookup operations
 *
 * @architecture
 * - Extends BaseUserFacade for shared state and dependencies
 * - Follows Single Responsibility Principle for lookup operations
 * - Uses reactive state management via inherited signals
 * - Delegates business logic to domain use cases
 * - Provides consistent interface for different lookup methods
 *
 * @patterns
 * - Facade Pattern: Simplifies user lookup interface
 * - Command Pattern: Each lookup delegates to specific use case
 * - Strategy Pattern: Different lookup strategies based on criteria
 * - Template Method: Uses base class methods for common operations
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class UserLookupFacade extends BaseUserFacade {
  // ============================================================================
  // User Lookup Operations
  // ============================================================================

  /**
   * Get user by ID
   *
   * Retrieves a user by their unique identifier. This is the most direct
   * and efficient lookup method when the user's ID is known. The method
   * handles loading states and error management appropriately.
   *
   * @param userId Unique identifier of the user to retrieve
   * @param opts Optional facade configuration (skipLoading, etc.)
   * @returns Promise resolving to the found user entity
   * @throws Error if user is not found or lookup operation fails
   *
   * @example
   * ```typescript
   * // Get user by ID with loading indicator
   * const user = await userLookupFacade.getUserById(123);
   *
   * // Get user by ID without loading indicator
   * const user = await userLookupFacade.getUserById(123, { skipLoading: true });
   * ```
   */
  async getUserById(userId: number, opts?: FacadeOpts): Promise<Message> {
    if (!opts?.skipLoading) {
      this.setLoading(true);
    }
    this.setError(null);

    try {
      const user = await this.getUserByIdUC.execute({ userId });
      if (!user) {
        return {
          success: false,
          message: `Usuario con ID ${userId} no encontrado.`,
          error: `Usuario con ID ${userId} no encontrado.`,
        };
      }
      return {
        success: true,
        message: `Usuario encontrado correctamente.`,
        user,
      };
    } catch (error: unknown) {
      this.handleError(error);
      return {
        success: false,
        message: 'Error al buscar usuario por ID.',
        error: String(error),
      };
    } finally {
      if (!opts?.skipLoading) {
        this.setLoading(false);
      }
    }
  }

  /**
   * Get user by email
   *
   * Retrieves a user by their email address. This method is useful for
   * authentication flows, user recovery processes, and email-based user
   * lookup operations. Email addresses are expected to be unique in the system.
   *
   * @param email Email address of the user to retrieve
   * @param opts Optional facade configuration (skipLoading, etc.)
   * @returns Promise resolving to the found user entity
   * @throws Error if user is not found or lookup operation fails
   *
   * @example
   * ```typescript
   * // Get user by email for authentication
   * const user = await userLookupFacade.getUserByEmail('john.doe@example.com');
   *
   * // Get user by email without loading indicator
   * const user = await userLookupFacade.getUserByEmail('user@example.com', { skipLoading: true });
   * ```
   */
  async getUserByEmail(email: string, opts?: FacadeOpts): Promise<Message> {
    if (!opts?.skipLoading) {
      this.setLoading(true);
    }
    this.setError(null);

    try {
      const user = await this.getUserByEmailUC.execute({ email });
      if (!user) {
        return {
          success: false,
          message: `Usuario con correo ${email} no encontrado.`,
          error: `Usuario con correo ${email} no encontrado.`,
        };
      }
      return {
        success: true,
        message: `Usuario encontrado correctamente.`,
        user,
      };
    } catch (error: unknown) {
      this.handleError(error);
      return {
        success: false,
        message: 'Error al buscar usuario por correo.',
        error: String(error),
      };
    } finally {
      if (!opts?.skipLoading) {
        this.setLoading(false);
      }
    }
  }

  /**
   * Get user by username
   *
   * Retrieves a user by their username. This method is useful for user
   * profile lookups, social features, and username-based authentication
   * or discovery flows. Usernames are expected to be unique in the system.
   *
   * @param username Username of the user to retrieve
   * @param opts Optional facade configuration (skipLoading, etc.)
   * @returns Promise resolving to the found user entity
   * @throws Error if user is not found or lookup operation fails
   *
   * @example
   * ```typescript
   * // Get user by username for profile display
   * const user = await userLookupFacade.getUserByUsername('johndoe');
   *
   * // Get user by username in background
   * const user = await userLookupFacade.getUserByUsername('jane_smith', { skipLoading: true });
   * ```
   */
  async getUserByUsername(username: string, opts?: FacadeOpts): Promise<Message> {
    if (!opts?.skipLoading) {
      this.setLoading(true);
    }
    this.setError(null);

    try {
      const user = await this.getUserByUsernameUC.execute({
        username,
        requesterId: this.getCurrentUserId(),
      });
      if (!user) {
        return {
          success: false,
          message: `Usuario con nombre de usuario ${username} no encontrado.`,
          error: `Usuario con nombre de usuario ${username} no encontrado.`,
        };
      }
      return {
        success: true,
        message: `Usuario encontrado correctamente.`,
        user,
      };
    } catch (error: unknown) {
      this.handleError(error);
      return {
        success: false,
        message: 'Error al buscar usuario por nombre de usuario.',
        error: String(error),
      };
    } finally {
      if (!opts?.skipLoading) {
        this.setLoading(false);
      }
    }
  }

  /**
   * Find user by multiple criteria
   *
   * Provides a unified interface for finding users by different lookup criteria.
   * Automatically routes to the appropriate lookup method based on the provided criteria.
   * This method offers flexibility for components that may have different types of
   * user identifiers and need a consistent lookup interface.
   *
   * At least one criterion (id, email, or username) must be provided. If multiple
   * criteria are provided, the method will prioritize them in the order: ID, email, username.
   *
   * @param criteria Object containing lookup criteria - id, email, or username
   * @param opts Optional facade configuration for the lookup operation
   * @returns Promise resolving to the found user entity
   * @throws Error if no lookup criteria are provided or if user is not found
   *
   * @example
   * ```typescript
   * // Find by ID (highest priority)
   * const user = await userLookupFacade.findUser({ id: 123 });
   *
   * // Find by email
   * const user = await userLookupFacade.findUser({ email: 'user@example.com' });
   *
   * // Find by username
   * const user = await userLookupFacade.findUser({ username: 'johndoe' });
   *
   * // Multiple criteria - ID takes precedence
   * const user = await userLookupFacade.findUser({
   *   id: 123,
   *   email: 'user@example.com', // This will be ignored
   *   username: 'johndoe'        // This will be ignored
   * });
   * ```
   */
  async findUser(criteria: UserLookupCriteria, opts?: FacadeOpts): Promise<Message> {
    if (criteria.id) {
      return this.getUserById(criteria.id, opts);
    } else if (criteria.email) {
      return this.getUserByEmail(criteria.email, opts);
    } else if (criteria.username) {
      return this.getUserByUsername(criteria.username, opts);
    } else {
      this.handleError('Debe proporcionar al menos un criterio de búsqueda.');
      return {
        success: false,
        message: 'Debe proporcionar al menos un criterio de búsqueda.',
        error: 'Criterio de búsqueda faltante.',
      };
    }
  }
}
