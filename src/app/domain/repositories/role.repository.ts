import { Observable } from 'rxjs';
import { RoleListModel } from '../models/role/role-list.model';
import { RoleModel } from '../models/role/role.model';
import { AssignRoleModel } from '../models/role/assign-role.model';
import { UpdateRoleModel } from '../models/role/update-role.model';
import { CreateRoleModel } from '../models/role/create-role.model';

export abstract class RoleRepository {
    abstract getRoles(): Observable<RoleListModel[]>;
    abstract getRoleById(id: number): Observable<RoleModel>;
    abstract assignRole(assignRoleModel: AssignRoleModel): Observable<void>;
    abstract updateRole(id: number, updateRoleModel: UpdateRoleModel): Observable<RoleModel>;
    abstract createRole(createRoleModel: CreateRoleModel): Observable<RoleModel>;
    abstract deleteRole(id: number): Observable<void>;
}
