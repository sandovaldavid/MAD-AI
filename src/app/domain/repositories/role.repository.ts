import { Observable } from 'rxjs';
import { RoleListModel } from '../models/role/role-list.model';
import { AssignRoleModel } from '../models/role/assign-role.model';

export abstract class RoleRepository {
    abstract getRoles(): Observable<RoleListModel[]>;
    abstract assignRole(assignRoleModel: AssignRoleModel): Observable<void>;
}
