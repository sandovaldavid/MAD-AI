/**
 * @fileoverview User Mapper for transforming between DTOs and Domain Entities
 *
 * @description Provides transformation functions between User Data Transfer Objects
 * (DTOs) from the API and User Domain Entities. This mapper handles conversion
 * between different data formats while maintaining data integrity.
 *
 * Mappers are responsible ONLY for:
 * - Direct transformation between DTOs and Domain Entities
 * - Centralizing translation from infrastructure to domain layer
 *
 * Mappers should NOT:
 * - Perform business validations
 * - Add default values or business logic
 * - Modify entities beyond pure mapping
 *
 * @author MAD-AI Development Team
 * @version 2.0.0
 * @since 2024-01-01
 *
 * @example Basic Usage
 * ```typescript
 * // Convert API response to domain entity
 * const userEntity = userMapper.toEntity(apiUserDTO);
 *
 * // Convert domain entity to DTO
 * const userDTO = userMapper.toDTO(userEntity);
 *
 * // Convert contract to API request
 * const createRequest = userMapper.toCreateRequest(createContract);
 * ```
 */

import { User } from '@domain/entities/user.entity';
import { Role } from '@domain/entities/role.entity';
import { Injectable } from '@angular/core';
import type {
  CreateUserContract,
  UserListFilterContract,
} from '@/app/domain/repositories/business/user.contract';
import type {
  UserDTO,
  CreateUserRequestDTO,
  UserDetailResponseDTO,
  CreateUserResponseDTO,
  UpdateUserResponseDTO,
} from '../dtos/user';

/**
 * Injectable mapper utility for User entity and DTO transformations.
 *
 * @description Provides methods for converting between User DTOs (from API)
 * and User domain entities. All transformations are pure and do not include
 * business logic or default values.
 */
@Injectable({
  providedIn: 'root',
})
export class UserMapper {
  // Empty constructor - this mapper doesn't require dependencies for data transformation

  /**
   * Converts a UserDetailResponseDTO to a User domain entity.
   * Only use this method when you have a complete DTO with all required fields.
   */
  toEntity(dto: UserDetailResponseDTO): User {
    // Create role entity with available data only
    const role = Role.create({
      id: dto.role_id,
      name: dto.role_name,
    });

    return User.create({
      id: dto.id,
      username: dto.username,
      email: dto.email,
      firstName: dto.first_name,
      lastName: dto.last_name,
      isActive: dto.is_active,
      role: role,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
      lastActivityAt: dto.last_activity_at,
      isEmailConfirmed: dto.is_email_confirmed,
      notificationPreferences: {
        email: dto.email_notifications_enabled,
        system: dto.system_notifications_enabled,
        task: dto.task_notifications_enabled,
      },
    });
  }

  /**
   * Converts a UserDTO (from list) to a User domain entity.
   * Note: This DTO lacks role_id, so role creation will be incomplete.
   * Use this only when you don't need complete role information.
   */
  toEntityFromList(dto: UserDTO): User {
    // This DTO only has role_name, not role_id
    // Role entity will be created with minimal data
    const role = Role.create({
      id: 1, // Default ID - should be resolved separately
      name: dto.role_name,
    });

    return User.create({
      id: dto.id,
      username: dto.username,
      email: dto.email,
      firstName: dto.first_name,
      lastName: dto.last_name,
      isActive: dto.is_active,
      role: role,
      createdAt: dto.created_at,
      notificationPreferences: {
        email: true,
        system: false,
        task: false,
      },
    });
  }

  /**
   * Converts a User domain entity to UserDTO format.
   */
  toDTO(entity: User): UserDTO {
    return {
      id: entity.id,
      username: entity.username.value,
      email: entity.email.value,
      first_name: entity.firstName.value,
      last_name: entity.lastName.value,
      is_active: entity.active,
      role_name: entity.role.name,
      created_at: entity.createdAt?.value ?? new Date().toISOString(),
    };
  }

  /**
   * Converts CreateUserContract to CreateUserRequestDTO.
   * Note: Password must be provided separately as it's not part of the contract.
   */
  toCreateRequest(contract: CreateUserContract, password: string): CreateUserRequestDTO {
    return {
      username: contract.username,
      email: contract.email,
      first_name: contract.firstName,
      last_name: contract.lastName,
      password: password,
      role_id: contract.roleId,
    };
  }

  /**
   * Converts UserListFilterContract to filter parameters for API requests.
   */
  toFilterParams(contract: UserListFilterContract): Record<string, unknown> {
    const filters: Record<string, unknown> = {};

    if (contract.isActive !== undefined) {
      filters['is_active'] = contract.isActive;
    }

    if (contract.roleId !== undefined) {
      filters['role_id'] = contract.roleId;
    }

    if (contract.searchTerm !== undefined) {
      filters['search'] = contract.searchTerm;
    }

    if (contract.limit !== undefined) {
      filters['limit'] = contract.limit;
    }

    if (contract.offset !== undefined) {
      filters['offset'] = contract.offset;
    }

    return filters;
  }

  /**
   * Converts a CreateUserResponseDTO to a User domain entity.
   * Used specifically for user creation responses.
   */
  toEntityFromCreate(dto: CreateUserResponseDTO): User {
    const role = Role.create({
      id: dto.role_id,
      name: dto.role_name,
    });

    return User.create({
      id: dto.id,
      username: dto.username,
      email: dto.email,
      firstName: dto.first_name,
      lastName: dto.last_name,
      isActive: dto.is_active,
      role: role,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
      lastActivityAt: dto.last_activity_at || undefined, // Handle null case
      isEmailConfirmed: dto.is_email_confirmed,
      notificationPreferences: {
        email: true,
        system: false,
        task: false,
      },
    });
  }

  /**
   * Converts an UpdateUserResponseDTO to a User domain entity.
   * Used specifically for user update responses.
   */
  toEntityFromUpdate(dto: UpdateUserResponseDTO): User {
    const role = Role.create({
      id: dto.role_id,
      name: dto.role_name,
    });

    return User.create({
      id: dto.id,
      username: dto.username,
      email: dto.email,
      firstName: dto.first_name,
      lastName: dto.last_name,
      isActive: dto.is_active,
      role: role,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
      lastActivityAt: dto.last_activity_at,
      isEmailConfirmed: dto.is_email_confirmed,
      notificationPreferences: {
        email: dto.email_notifications_enabled,
        system: dto.system_notifications_enabled,
        task: dto.task_notifications_enabled,
      },
    });
  }
}
