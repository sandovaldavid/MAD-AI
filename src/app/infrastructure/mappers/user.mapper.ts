/**
 * @fileoverview User Mapper for transforming between DTOs and Domain Entities
 *
 * @description Provides transformation functions between User Data Transfer Objects
 * (DTOs) from the API and User Domain Entities. This mapper handles the conversion
 * between different data formats while maintaining data integrity and applying
 * proper validation through domain entity factory methods.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 *
 * @example Basic Usage
 * ```typescript
 * // Convert API response to domain entity
 * const userEntity = UserMapper.toEntity(apiUserDTO);
 *
 * // Convert domain contract to API request
 * const apiRequest = UserMapper.createContractToDTO(createUserContract);
 * ```
 *
 * @example Error Handling
 * ```typescript
 * try {
 *   const user = UserMapper.toEntity(dto);
 *   console.log(`Mapped user: ${user.fullName}`);
 * } catch (error) {
 *   console.error('Invalid user data from API:', error.message);
 * }
 * ```
 */

import { User } from '@domain/entities/user.entity';
import { Role } from '@domain/entities/role.entity';
import { Email } from '@domain/value-objects/email.vo';
import { Username } from '@domain/value-objects/username.vo';
import { FirstName } from '@domain/value-objects/firstname.vo';
import { LastName } from '@domain/value-objects/lastname.vo';
import { ISODateTime } from '@domain/value-objects/iso-datetime.vo';
import { RoleName } from '@domain/value-objects/role-name.vo';
import { AccessLevel } from '@domain/value-objects/accesslevel.vo';
import type {
    CreateUserContract,
    UpdateUserPatchContract,
    UserListFilterContract,
} from '@domain/contracts/user.contract';
import type {
    UserDTO,
    ListUsersResponseDTO,
    CreateUserRequestDTO,
    CreateUserResponseDTO,
    UpdateUserRequestDTO,
    UpdateUserResponseDTO,
    UserDetailResponseDTO,
} from '../dtos/user';

// Mutable versions for building DTOs
type MutableUpdateUserRequestDTO = {
    username?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    role_id?: number;
    is_active?: boolean;
};

type UserListFilterDTO = {
    is_active?: boolean;
    role_id?: number;
    search?: string;
    limit?: number;
    offset?: number;
    ordering?: string;
};

type MutableUserListFilterDTO = {
    is_active?: boolean;
    role_id?: number;
    search?: string;
    limit?: number;
    offset?: number;
    ordering?: string;
};

/**
 * Mapper utility for User entity and DTO transformations.
 *
 * @description Provides static methods for converting between User DTOs (from API)
 * and User domain entities, as well as transforming domain contracts to API request DTOs.
 * All transformations apply proper validation and error handling.
 *
 * @class UserMapper
 *
 * @transformationRules
 * - API snake_case fields → Domain camelCase properties
 * - ISO timestamp strings → Date objects
 * - API role DTOs → Domain Role entities
 * - Domain value objects → Primitive values for API
 * - Null/undefined handling with appropriate defaults
 *
 * @validationRules
 * - All domain entity creation uses factory methods with validation
 * - Invalid data from API results in descriptive error messages
 * - Optional fields are handled gracefully
 * - Type safety is maintained throughout transformations
 */
export const UserMapper = {
    /**
     * Converts a User DTO from the API to a User domain entity.
     *
     * @description Transforms API response data into a validated domain entity
     * using the User entity factory method. This ensures all business rules
     * and validation constraints are applied during the conversion.
     *
     * @param dto - User DTO from API response
     * @returns User domain entity
     *
     * @throws {Error} When DTO contains invalid data that violates domain rules
     *
     * @example Success Case
     * ```typescript
     * const apiResponse: UserDTO = {
     *   id: 123,
     *   username: 'john_doe',
     *   email: 'john@example.com',
     *   first_name: 'John',
     *   last_name: 'Doe',
     *   is_active: true,
     *   is_verified: true,
     *   created_at: '2024-01-15T10:30:00Z',
     *   updated_at: '2024-01-15T10:30:00Z',
     *   last_login: '2024-01-15T08:45:00Z',
     *   roles: [roleDTO]
     * };
     *
     * const user = UserMapper.toEntity(apiResponse);
     * console.log(`User: ${user.fullName} (${user.email.value})`);
     * ```
     *
     * @example Error Handling
     * ```typescript
     * try {
     *   const user = UserMapper.toEntity(invalidDTO);
     * } catch (error) {
     *   console.error('API returned invalid user data:', error.message);
     *   // Handle invalid data appropriately
     * }
     * ```
     */

    // todo: cuando aqui hay un error ya que se esta pasando un UserDTO y esa interface no tiene un role_id, esto se debe de usar con la interfcace de me.dto.
    toEntity(dto: UserDetailResponseDTO): User {
        try {
            console.log('🔥 UserMapper.toEntity - Starting with DTO:', dto);

            // Validate critical fields first
            if (!dto || typeof dto.id !== 'number' || dto.id <= 0) {
                throw new Error(`Invalid user ID from API: ${dto?.id}. Must be a positive number.`);
            }

            if (!dto.role_name || dto.role_name.trim() === '') {
                throw new Error(`User ${dto.id} has no role assigned. Users must have a role.`);
            }

            // Create role from simplified data (only role_name available in UserDTO)
            const roleName = RoleName.create(dto.role_name);
            if (!roleName) {
                throw new Error(`Invalid role name from API: ${dto.role_name}`);
            }

            // Create a minimal role entity (access level unknown from simple DTO)
            const role = Role.create({
                id: 0, // Unknown from simple DTO
                name: roleName,
                accessLevel: AccessLevel.create(5), // Default to basic user level (5)
                isActive: true,
                description: `Role: ${dto.role_name}`,
            });

            // Create value objects using their static factory methods with error handling
            const username = Username.create(dto.username);
            if (!username) {
                throw new Error(`Invalid username from API: ${dto.username}`);
            }

            const email = Email.create(dto.email);
            if (!email) {
                throw new Error(`Invalid email from API: ${dto.email}`);
            }

            const firstName = FirstName.create(dto.first_name);
            if (!firstName) {
                throw new Error(`Invalid first name from API: ${dto.first_name}`);
            }

            const lastName = LastName.create(dto.last_name);
            if (!lastName) {
                throw new Error(`Invalid last name from API: ${dto.last_name}`);
            }

            const createdAt = ISODateTime.create(dto.created_at);
            if (!createdAt) {
                throw new Error(`Invalid created_at timestamp from API: ${dto.created_at}`);
            }

            // Use the User entity factory method for validation
            return User.create({
                id: dto.id,
                username: username,
                email: email,
                firstName: firstName,
                lastName: lastName,
                isActive: dto.is_active,
                role: role,
                createdAt: createdAt,
                updatedAt: createdAt, // Use created_at as fallback for updated_at
                lastActivityAt: undefined, // Not available in simple DTO
                isEmailConfirmed: false, // Not available in simple DTO, default to false
            });
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to map User DTO to entity: ${error.message}`);
            }
            throw new Error('Failed to map User DTO to entity: Unknown error');
        }
    },

    /**
     * Converts a UserDTO from the LIST API endpoint to a User domain entity.
     *
     * @description Transforms API list response data (UserDTO) into a validated domain entity.
     * This method is specifically designed for the UserDTO structure returned by the
     * auth/users/ endpoint which only has role_name but no role_id.
     *
     * When roleId is not provided, it creates a minimal Role entity with id=0 and
     * attempts to derive access level from common role name patterns.
     *
     * @param dto - UserDTO from API list response (/auth/users/)
     * @param roleId - Optional role ID to use if available from role lookup
     * @returns User domain entity
     *
     * @throws {Error} When DTO contains invalid data that violates domain rules
     *
     * @example Success Case from List Endpoint
     * ```typescript
     * const listResponse: UserDTO = {
     *   id: 123,
     *   username: 'john_doe',
     *   email: 'john@example.com',
     *   first_name: 'John',
     *   last_name: 'Doe',
     *   is_active: true,
     *   role_name: 'Editor',
     *   created_at: '2024-01-15T10:30:00Z'
     * };
     *
     * const user = UserMapper.toEntityFromListDTO(listResponse);
     * console.log(`User: ${user.fullName} (${user.email.value})`);
     * ```
     */
    toEntityFromListDTO(dto: UserDTO, roleId?: number): User {
        try {
            console.log('🔥 UserMapper.toEntityFromListDTO - Starting with DTO:', dto);

            // Validate critical fields first
            if (!dto || typeof dto.id !== 'number' || dto.id <= 0) {
                throw new Error(
                    `Invalid user ID from API list: ${dto?.id}. Must be a positive number.`
                );
            }

            if (!dto.role_name || dto.role_name.trim() === '') {
                throw new Error(`User ${dto.id} has no role assigned. Users must have a role.`);
            }

            // Create role from simplified data (only role_name available in UserDTO)
            const roleName = RoleName.create(dto.role_name);
            if (!roleName) {
                throw new Error(`Invalid role name from API list: ${dto.role_name}`);
            }

            // Determine access level based on role name patterns (basic heuristics)
            let accessLevelValue = 5; // Default to basic user level
            const roleNameLower = dto.role_name.toLowerCase();
            if (roleNameLower.includes('admin') || roleNameLower.includes('administrador')) {
                accessLevelValue = 1; // Admin level
            } else if (roleNameLower.includes('manager') || roleNameLower.includes('gerente')) {
                accessLevelValue = 2; // Manager level
            } else if (roleNameLower.includes('editor') || roleNameLower.includes('moderator')) {
                accessLevelValue = 3; // Editor level
            } else if (roleNameLower.includes('user') || roleNameLower.includes('usuario')) {
                accessLevelValue = 5; // User level
            }

            const accessLevel = AccessLevel.create(accessLevelValue);
            if (!accessLevel) {
                throw new Error(`Failed to create access level with value: ${accessLevelValue}`);
            }

            // Create role entity with provided roleId or default to 0
            const role = Role.create({
                id: roleId ?? 0, // Use provided roleId or 0 if not available
                name: roleName,
                accessLevel: accessLevel,
                isActive: true,
                description: `Role: ${dto.role_name}`,
            });

            // Create value objects using their static factory methods with error handling
            const username = Username.create(dto.username);
            if (!username) {
                throw new Error(`Invalid username from API list: ${dto.username}`);
            }

            const email = Email.create(dto.email);
            if (!email) {
                throw new Error(`Invalid email from API list: ${dto.email}`);
            }

            const firstName = FirstName.create(dto.first_name);
            if (!firstName) {
                throw new Error(`Invalid first name from API list: ${dto.first_name}`);
            }

            const lastName = LastName.create(dto.last_name);
            if (!lastName) {
                throw new Error(`Invalid last name from API list: ${dto.last_name}`);
            }

            const createdAt = ISODateTime.create(dto.created_at);
            if (!createdAt) {
                throw new Error(`Invalid created_at timestamp from API list: ${dto.created_at}`);
            }

            // Use the User entity factory method for validation
            return User.create({
                id: dto.id,
                username: username,
                email: email,
                firstName: firstName,
                lastName: lastName,
                isActive: dto.is_active,
                role: role,
                createdAt: createdAt,
                updatedAt: createdAt, // Use created_at as fallback for updated_at
                lastActivityAt: undefined, // Not available in list DTO
                isEmailConfirmed: true, // Default assumption for list DTO
            });
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to map User list DTO to entity: ${error.message}`);
            }
            throw new Error('Failed to map User list DTO to entity: Unknown error');
        }
    },

    /**
     * Converts a simplified User DTO (from list endpoints) to a User domain entity.
     *
     * @description Transforms simplified API response data into a validated domain entity
     * using the User entity factory method. This method handles the simpler structure
     * returned by list endpoints which don't include roles array or verification status.
     *
     * @param dto - Simplified User DTO from API list responses
     * @returns User domain entity
     *
     * @throws {Error} When DTO contains invalid data that violates domain rules
     *
     * @deprecated Use toEntityFromListDTO instead for better role handling
     */
    toEntityFromSimpleDTO(dto: UserDTO): User {
        try {
            console.log('🔥 UserMapper.toEntityFromSimpleDTO - Starting with DTO:', dto);

            // Validate critical fields first
            if (!dto || typeof dto.id !== 'number' || dto.id <= 0) {
                throw new Error('Invalid user ID from API response');
            }

            console.log('🔥 UserMapper.toEntityFromSimpleDTO - Basic validation passed');

            // Create value objects using their static factory methods with error handling
            console.log(
                '🔥 UserMapper.toEntityFromSimpleDTO - Creating username from:',
                dto.username
            );
            const username = Username.create(dto.username);
            if (!username) {
                throw new Error(`Invalid username from API: ${dto.username}`);
            }

            console.log('🔥 UserMapper.toEntityFromSimpleDTO - Creating email from:', dto.email);
            const email = Email.create(dto.email);
            if (!email) {
                throw new Error(`Invalid email from API: ${dto.email}`);
            }

            console.log(
                '🔥 UserMapper.toEntityFromSimpleDTO - Creating firstName from:',
                dto.first_name
            );
            const firstName = FirstName.create(dto.first_name);
            if (!firstName) {
                throw new Error(`Invalid first name from API: ${dto.first_name}`);
            }

            console.log(
                '🔥 UserMapper.toEntityFromSimpleDTO - Creating lastName from:',
                dto.last_name
            );
            const lastName = LastName.create(dto.last_name);
            if (!lastName) {
                throw new Error(`Invalid last name from API: ${dto.last_name}`);
            }

            console.log(
                '🔥 UserMapper.toEntityFromSimpleDTO - Creating createdAt from:',
                dto.created_at
            );
            const createdAt = ISODateTime.create(dto.created_at);
            if (!createdAt) {
                throw new Error(`Invalid created_at timestamp from API: ${dto.created_at}`);
            }

            console.log(
                '🔥 UserMapper.toEntityFromSimpleDTO - Creating role from role_name:',
                dto.role_name
            );
            // Create a simple role entity from role_name
            // For the simplified DTO, we only have role_name, so we create a minimal role
            const roleName = RoleName.create(dto.role_name);
            const accessLevel = AccessLevel.create(5); // Default access level

            console.log('🔥 UserMapper.toEntityFromSimpleDTO - Role components created:', {
                roleName,
                accessLevel,
            });

            const role = Role.create({
                id: 0, // We don't have role ID in simple DTO
                name: roleName,
                accessLevel: accessLevel,
                isActive: true,
                description: `Role: ${dto.role_name}`,
            });

            console.log('🔥 UserMapper.toEntityFromSimpleDTO - Role created:', role);

            // Use the User entity factory method for validation
            console.log('🔥 UserMapper.toEntityFromSimpleDTO - Creating User entity with data:', {
                id: dto.id,
                username: username,
                email: email,
                firstName: firstName,
                lastName: lastName,
                isActive: dto.is_active,
                role: role,
                createdAt: createdAt,
            });

            const user = User.create({
                id: dto.id,
                username: username,
                email: email,
                firstName: firstName,
                lastName: lastName,
                isActive: dto.is_active,
                role: role,
                createdAt: createdAt,
                updatedAt: createdAt, // We don't have updated_at in simple DTO
                lastActivityAt: undefined, // Not available in simple DTO
                isEmailConfirmed: true, // Default assumption for simple DTO
            });

            console.log(
                '🔥 UserMapper.toEntityFromSimpleDTO - User entity created successfully:',
                user
            );
            return user;
        } catch (error) {
            console.error('🔥 UserMapper.toEntityFromSimpleDTO - ERROR:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to map simple User DTO to entity: ${error.message}`);
            }
            throw new Error('Failed to map simple User DTO to entity: Unknown error');
        }
    },

    /**
     * Converts a UserDetailResponseDTO from the API to a User domain entity.
     *
     * @description Transforms API detail response data into a validated domain entity
     * using the User entity factory method. This handles the detail response format
     * which has a different structure than the standard UserDTO.
     *
     * @param dto - UserDetailResponseDTO from API response
     * @returns User domain entity
     *
     * @throws {Error} When DTO contains invalid data that violates domain rules
     */
    toEntityFromDetailDTO(dto: UserDetailResponseDTO): User {
        try {
            // Validate critical fields first
            if (!dto || typeof dto.id !== 'number' || dto.id <= 0) {
                throw new Error('Invalid user ID from API detail response');
            }

            const username = Username.create(dto.username);
            if (!username) {
                throw new Error(`Invalid username from API detail response: ${dto.username}`);
            }

            const email = Email.create(dto.email);
            if (!email) {
                throw new Error(`Invalid email from API detail response: ${dto.email}`);
            }

            const firstName = FirstName.create(dto.first_name);
            if (!firstName) {
                throw new Error(`Invalid first name from API detail response: ${dto.first_name}`);
            }

            const lastName = LastName.create(dto.last_name);
            if (!lastName) {
                throw new Error(`Invalid last name from API detail response: ${dto.last_name}`);
            }

            const createdAt = ISODateTime.create(dto.created_at);
            if (!createdAt) {
                throw new Error(
                    `Invalid created_at timestamp from API detail response: ${dto.created_at}`
                );
            }

            const updatedAt = ISODateTime.create(dto.updated_at);
            if (!updatedAt) {
                throw new Error(
                    `Invalid updated_at timestamp from API detail response: ${dto.updated_at}`
                );
            }

            // Handle last_activity_at which might be null/undefined
            let lastActivityAt: ISODateTime | undefined;
            if (dto.last_activity_at) {
                lastActivityAt = ISODateTime.create(dto.last_activity_at);
                if (!lastActivityAt) {
                    throw new Error(
                        `Invalid last_activity_at timestamp from API detail response: ${dto.last_activity_at}`
                    );
                }
            }

            // Create role entity from detail response data
            const roleName = RoleName.create(dto.role_name);
            const accessLevel = AccessLevel.create(5); // Default access level

            const role = Role.create({
                id: dto.role_id,
                name: roleName,
                accessLevel: accessLevel,
                isActive: true,
                description: `Role: ${dto.role_name}`,
            });

            // Use the User entity factory method for validation
            return User.create({
                id: dto.id,
                username: username,
                email: email,
                firstName: firstName,
                lastName: lastName,
                isActive: dto.is_active,
                role: role,
                createdAt: createdAt,
                updatedAt: updatedAt,
                lastActivityAt: lastActivityAt,
                isEmailConfirmed: dto.is_email_confirmed,
            });
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to map UserDetailResponseDTO to entity: ${error.message}`);
            }
            throw new Error('Failed to map UserDetailResponseDTO to entity: Unknown error');
        }
    },

    /**
     * Converts a CreateUserResponseDTO from the API to a User domain entity.
     *
     * @description Transforms API create response data into a validated domain entity
     * using the User entity factory method. This handles the create response format
     * which is similar to detail response but with nullable last_activity_at.
     *
     * @param dto - CreateUserResponseDTO from API response
     * @returns User domain entity
     *
     * @throws {Error} When DTO contains invalid data that violates domain rules
     */
    toEntityFromCreateDTO(dto: CreateUserResponseDTO): User {
        try {
            // Validate critical fields first
            if (!dto || typeof dto.id !== 'number' || dto.id <= 0) {
                throw new Error('Invalid user ID from API create response');
            }

            const username = Username.create(dto.username);
            if (!username) {
                throw new Error(`Invalid username from API create response: ${dto.username}`);
            }

            const email = Email.create(dto.email);
            if (!email) {
                throw new Error(`Invalid email from API create response: ${dto.email}`);
            }

            const firstName = FirstName.create(dto.first_name);
            if (!firstName) {
                throw new Error(`Invalid first name from API create response: ${dto.first_name}`);
            }

            const lastName = LastName.create(dto.last_name);
            if (!lastName) {
                throw new Error(`Invalid last name from API create response: ${dto.last_name}`);
            }

            const createdAt = ISODateTime.create(dto.created_at);
            if (!createdAt) {
                throw new Error(
                    `Invalid created_at timestamp from API create response: ${dto.created_at}`
                );
            }

            const updatedAt = ISODateTime.create(dto.updated_at);
            if (!updatedAt) {
                throw new Error(
                    `Invalid updated_at timestamp from API create response: ${dto.updated_at}`
                );
            }

            // Handle last_activity_at which is nullable in create response
            let lastActivityAt: ISODateTime | undefined;
            if (dto.last_activity_at) {
                lastActivityAt = ISODateTime.create(dto.last_activity_at);
                if (!lastActivityAt) {
                    throw new Error(
                        `Invalid last_activity_at timestamp from API create response: ${dto.last_activity_at}`
                    );
                }
            }

            // Create role entity from create response data
            const roleName = RoleName.create(dto.role_name);
            const accessLevel = AccessLevel.create(5); // Default access level

            const role = Role.create({
                id: dto.role_id,
                name: roleName,
                accessLevel: accessLevel,
                isActive: true,
                description: `Role: ${dto.role_name}`,
            });

            // Use the User entity factory method for validation
            return User.create({
                id: dto.id,
                username: username,
                email: email,
                firstName: firstName,
                lastName: lastName,
                isActive: dto.is_active,
                role: role,
                createdAt: createdAt,
                updatedAt: updatedAt,
                lastActivityAt: lastActivityAt,
                isEmailConfirmed: dto.is_email_confirmed,
            });
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to map CreateUserResponseDTO to entity: ${error.message}`);
            }
            throw new Error('Failed to map CreateUserResponseDTO to entity: Unknown error');
        }
    },

    /**
     * Converts an UpdateUserResponseDTO from the API to a User domain entity.
     *
     * @description Transforms API update response data into a validated domain entity
     * using the User entity factory method. This handles the update response format
     * which is similar to detail response format.
     *
     * @param dto - UpdateUserResponseDTO from API response
     * @returns User domain entity
     *
     * @throws {Error} When DTO contains invalid data that violates domain rules
     */
    toEntityFromUpdateDTO(dto: UpdateUserResponseDTO): User {
        try {
            // Validate critical fields first
            if (!dto || typeof dto.id !== 'number' || dto.id <= 0) {
                throw new Error('Invalid user ID from API update response');
            }

            const username = Username.create(dto.username);
            if (!username) {
                throw new Error(`Invalid username from API update response: ${dto.username}`);
            }

            const email = Email.create(dto.email);
            if (!email) {
                throw new Error(`Invalid email from API update response: ${dto.email}`);
            }

            const firstName = FirstName.create(dto.first_name);
            if (!firstName) {
                throw new Error(`Invalid first name from API update response: ${dto.first_name}`);
            }

            const lastName = LastName.create(dto.last_name);
            if (!lastName) {
                throw new Error(`Invalid last name from API update response: ${dto.last_name}`);
            }

            const createdAt = ISODateTime.create(dto.created_at);
            if (!createdAt) {
                throw new Error(
                    `Invalid created_at timestamp from API update response: ${dto.created_at}`
                );
            }

            const updatedAt = ISODateTime.create(dto.updated_at);
            if (!updatedAt) {
                throw new Error(
                    `Invalid updated_at timestamp from API update response: ${dto.updated_at}`
                );
            }

            // Handle last_activity_at which should be present in update response
            let lastActivityAt: ISODateTime | undefined;
            if (dto.last_activity_at) {
                lastActivityAt = ISODateTime.create(dto.last_activity_at);
                if (!lastActivityAt) {
                    throw new Error(
                        `Invalid last_activity_at timestamp from API update response: ${dto.last_activity_at}`
                    );
                }
            }

            // Create role entity from update response data
            const roleName = RoleName.create(dto.role_name);
            const accessLevel = AccessLevel.create(5); // Default access level

            const role = Role.create({
                id: dto.role_id,
                name: roleName,
                accessLevel: accessLevel,
                isActive: true,
                description: `Role: ${dto.role_name}`,
            });

            // Use the User entity factory method for validation
            return User.create({
                id: dto.id,
                username: username,
                email: email,
                firstName: firstName,
                lastName: lastName,
                isActive: dto.is_active,
                role: role,
                createdAt: createdAt,
                updatedAt: updatedAt,
                lastActivityAt: lastActivityAt,
                isEmailConfirmed: dto.is_email_confirmed,
            });
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to map UpdateUserResponseDTO to entity: ${error.message}`);
            }
            throw new Error('Failed to map UpdateUserResponseDTO to entity: Unknown error');
        }
    },

    /**
     * Converts a CreateUserContract to API request DTO.
     *
     * @description Transforms domain contract data into the format expected
     * by the API for user creation operations. Handles field name mapping
     * and applies appropriate data transformations.
     *
     * @param contract - Domain contract for user creation
     * @returns DTO ready for API request
     *
     * @example Administrative User Creation
     * ```typescript
     * const createContract: CreateUserContract = {
     *   username: 'jane_smith',
     *   email: 'jane@example.com',
     *   firstName: 'Jane',
     *   lastName: 'Smith',
     *   roleId: 2,
     *   isActive: true
     * };
     *
     * const apiRequest = UserMapper.createContractToDTO(createContract);
     * // apiRequest will have snake_case fields for API
     * ```
     */
    createContractToDTO(contract: CreateUserContract): CreateUserRequestDTO {
        // Validate required fields
        if (!contract.username || contract.username.trim() === '') {
            throw new Error('Username is required for user creation');
        }
        if (!contract.email || contract.email.trim() === '') {
            throw new Error('Email is required for user creation');
        }
        if (!contract.firstName || contract.firstName.trim() === '') {
            throw new Error('First name is required for user creation');
        }
        if (!contract.lastName || contract.lastName.trim() === '') {
            throw new Error('Last name is required for user creation');
        }
        if (!contract.roleId || !Number.isInteger(contract.roleId) || contract.roleId <= 0) {
            throw new Error('Valid role ID is required for user creation');
        }

        return {
            username: contract.username.trim(),
            email: contract.email.trim().toLowerCase(),
            first_name: contract.firstName.trim(),
            last_name: contract.lastName.trim(),
            password: '', // Note: Password should be handled separately through secure channels
            role_id: contract.roleId,
        };
    },

    /**
     * Converts an UpdateUserPatchContract to API request DTO.
     *
     * @description Transforms domain contract data for partial updates into
     * the format expected by the API. Only includes fields that are defined
     * in the contract, allowing for true partial updates.
     *
     * @param contract - Domain contract for user updates
     * @returns DTO ready for API request with only specified fields
     *
     * @example Profile Update
     * ```typescript
     * const updateContract: UpdateUserPatchContract = {
     *   firstName: 'Jane',
     *   lastName: 'Doe-Smith',
     *   email: 'jane.doe-smith@example.com'
     * };
     *
     * const apiRequest = UserMapper.updateContractToDTO(updateContract);
     * // Only first_name, last_name, and email will be in the request
     * ```
     *
     * @example Role Change Only
     * ```typescript
     * const roleChange: UpdateUserPatchContract = {
     *   roleId: 4
     * };
     *
     * const apiRequest = UserMapper.updateContractToDTO(roleChange);
     * // Only role_id will be in the request
     * ```
     */
    updateContractToDTO(contract: UpdateUserPatchContract): UpdateUserRequestDTO {
        const dto: MutableUpdateUserRequestDTO = {};

        // Only include fields that are explicitly defined in the contract
        // Apply validation and normalization for each field
        if (contract.username !== undefined) {
            if (typeof contract.username !== 'string' || contract.username.trim() === '') {
                throw new Error('Username must be a non-empty string');
            }
            dto.username = contract.username.trim();
        }

        if (contract.email !== undefined) {
            if (typeof contract.email !== 'string' || contract.email.trim() === '') {
                throw new Error('Email must be a non-empty string');
            }
            dto.email = contract.email.trim().toLowerCase();
        }

        if (contract.firstName !== undefined) {
            if (typeof contract.firstName !== 'string' || contract.firstName.trim() === '') {
                throw new Error('First name must be a non-empty string');
            }
            dto.first_name = contract.firstName.trim();
        }

        if (contract.lastName !== undefined) {
            if (typeof contract.lastName !== 'string' || contract.lastName.trim() === '') {
                throw new Error('Last name must be a non-empty string');
            }
            dto.last_name = contract.lastName.trim();
        }

        if (contract.roleId !== undefined) {
            if (!Number.isInteger(contract.roleId) || contract.roleId <= 0) {
                throw new Error('Role ID must be a positive integer');
            }
            dto.role_id = contract.roleId;
        }

        if (contract.isActive !== undefined) {
            if (typeof contract.isActive !== 'boolean') {
                throw new Error('Active status must be a boolean value');
            }
            dto.is_active = contract.isActive;
        }

        return dto as UpdateUserRequestDTO;
    },

    /**
     * Converts a UserListFilterContract to API query parameters DTO.
     *
     * @description Transforms domain filter criteria into the format expected
     * by the API for user list operations. Handles field name mapping and
     * pagination parameters.
     *
     * @param filter - Domain filter contract
     * @returns DTO ready for API query parameters
     *
     * @example Search with Pagination
     * ```typescript
     * const filter: UserListFilterContract = {
     *   searchTerm: 'john',
     *   isActive: true,
     *   limit: 20,
     *   offset: 0
     * };
     *
     * const queryParams = UserMapper.filterContractToDTO(filter);
     * // Will map to { search: 'john', is_active: true, limit: 20, offset: 0 }
     * ```
     */
    filterContractToDTO(filter: UserListFilterContract): UserListFilterDTO {
        const dto: MutableUserListFilterDTO = {};

        // Apply validation and transformation for each filter field
        if (filter.isActive !== undefined) {
            if (typeof filter.isActive !== 'boolean') {
                throw new Error('Active status filter must be a boolean value');
            }
            dto.is_active = filter.isActive;
        }

        if (filter.roleId !== undefined) {
            if (!Number.isInteger(filter.roleId) || filter.roleId <= 0) {
                throw new Error('Role ID filter must be a positive integer');
            }
            dto.role_id = filter.roleId;
        }

        if (filter.searchTerm !== undefined) {
            if (typeof filter.searchTerm !== 'string') {
                throw new Error('Search term must be a string');
            }
            const trimmedSearch = filter.searchTerm.trim();
            if (trimmedSearch !== '') {
                dto.search = trimmedSearch;
            }
        }

        if (filter.limit !== undefined) {
            if (!Number.isInteger(filter.limit) || filter.limit <= 0 || filter.limit > 1000) {
                throw new Error('Limit must be a positive integer between 1 and 1000');
            }
            dto.limit = filter.limit;
        }

        if (filter.offset !== undefined) {
            if (!Number.isInteger(filter.offset) || filter.offset < 0) {
                throw new Error('Offset must be a non-negative integer');
            }
            dto.offset = filter.offset;
        }

        return dto as UserListFilterDTO;
    },

    /**
     * Converts a User domain entity back to DTO format.
     *
     * @description Transforms a domain entity back to DTO format, which can be
     * useful for caching, serialization, or API responses. This is less commonly
     * used than toEntity but available when needed.
     *
     * @param entity - User domain entity
     * @returns UserDTO representation
     *
     * @example Entity Serialization
     * ```typescript
     * const userEntity = await userRepository.getById(123);
     * const serializedUser = UserMapper.toDTO(userEntity);
     *
     * // Store in cache or send to another service
     * await cache.set(`user:${userEntity.id}`, serializedUser);
     * ```
     *
     * @note This method is rarely needed in typical application flow,
     * but provided for completeness and special use cases.
     */
    toDTO(entity: User): UserDTO {
        return {
            id: entity.id,
            username: entity.username,
            email: entity.email,
            first_name: entity.firstName,
            last_name: entity.lastName,
            is_active: entity.active,
            role_name: entity.roleName,
            created_at: entity.createdAt?.value ?? new Date().toISOString(),
        };
    },
};
