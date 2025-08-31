/**
 * User Application Types
 *
 * @description
 * Minimal type definitions for Application Layer coordination.
 * These types provide simple interfaces for user-related use case orchestration.
 *
 * @responsibilities
 * - Define minimal request interfaces for user operations
 * - Provide type safety for user management coordination
 * - Keep complexity in appropriate layers (Domain/Infrastructure)
 *
 * @architecture
 * - Application layer: Simple coordination types only
 * - Domain layer: Business logic and contracts
 * - Infrastructure layer: DTOs and technical implementations
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Application
 */

import type { User } from '@domain/entities/user.entity';
import type {
  CreateUserContract,
  UpdateUserPatchContract,
} from '@/app/domain/repositories/business/user.contract';

// ============================================================================
// Simple Request Interfaces (Application Layer Coordination)
// ============================================================================

/**
 * Simple request for creating a user
 */
export interface CreateUserRequest {
  userData: CreateUserContract;
}

/**
 * Simple request for updating a user
 */
export interface UpdateUserRequest {
  userId: number;
  updateData: UpdateUserPatchContract;
}

/**
 * Simple request for getting a user by ID
 */
export interface GetUserRequest {
  userId: number;
}

// ============================================================================
// Minimal Result Types (Domain entities returned directly)
// ============================================================================

/**
 * User creation result - returns domain entity directly
 */
export type CreateUserResult = User;

/**
 * User update result - returns domain entity directly
 */
export type UpdateUserResult = User;

/**
 * User retrieval result - returns domain entity directly
 */
export type GetUserResult = User;

/**
 * User deletion result - simple confirmation
 */
export interface DeleteUserResult {
  success: boolean;
  userId: number;
}
