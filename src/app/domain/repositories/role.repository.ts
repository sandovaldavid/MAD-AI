import { Observable } from 'rxjs';
import { RoleEntity } from '../entities/role.entity';
import { AssignRoleModel } from '../models/role/assign-role.model';
import { UpdateRoleModel } from '../models/role/update-role.model';
import { CreateRoleModel } from '../models/role/create-role.model';
import { UnassignRoleModel } from '../models/role/unassign-role.model';

/**
 * Repository interface for Role-related operations
 * Following the Clean Architecture pattern
 * Returns RoleEntity objects instead of models
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
    abstract assignRole(assignRoleModel: AssignRoleModel): Observable<void>;
    
    /**
     * Unassign a role from a user
     */
    abstract unassignRole(unassignRoleModel: UnassignRoleModel): Observable<void>;
    
    /**
     * Update an existing role
     */
    abstract updateRole(id: number, updateRoleModel: UpdateRoleModel): Observable<RoleEntity>;
    
    /**
     * Create a new role
     */
    abstract createRole(createRoleModel: CreateRoleModel): Observable<RoleEntity>;
    
    /**
     * Delete a role
     */
    abstract deleteRole(id: number): Observable<void>;
}
