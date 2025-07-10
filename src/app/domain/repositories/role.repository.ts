import { Observable } from 'rxjs';
import { RoleEntity } from '../entities/role.entity';
import { RoleAccessLevel } from '../enums/role-access-level.enum';
import {
    AssignRoleData,
    CreateRoleData,
    UnassignRoleData,
    UpdateRoleData,
} from '../models/role/role.dto';

/**
 * Repository interface for Role-related operations
 * Following the Clean Architecture pattern
 *
 * In Clean Architecture, repositories belong to the domain layer but are
 * implemented in the infrastructure layer. This allows the domain to define
 * what it needs without depending on specific implementations.
 */
export abstract class RoleRepository {
    /**
     * Get all available roles
     */
    abstract getRoles(): Observable<RoleEntity[]>;

    /**
     * Get a specific role by ID
     */
    abstract getRoleById(id: number): Observable<RoleEntity>;

    /**
     * Assign a role to a user
     */
    abstract assignRole(roleData: AssignRoleData): Observable<void>;

    /**
     * Unassign a role from a user
     */
    abstract unassignRole(unassignData: UnassignRoleData): Observable<void>;

    /**
     * Update an existing role
     */
    abstract updateRole(id: number, roleData: UpdateRoleData): Observable<RoleEntity>;

    /**
     * Create a new role
     */
    abstract createRole(roleData: CreateRoleData): Observable<RoleEntity>;

    /**
     * Delete a role
     */
    abstract deleteRole(id: number): Observable<void>;
}
