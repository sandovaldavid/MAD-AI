import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RoleRepository } from '../../../domain/repositories/role.repository';
import { RoleListModel } from '../../../domain/models/role/role-list.model';

@Injectable({
    providedIn: 'root'
})
export class GetRolesUseCase {
    constructor(private readonly roleRepository: RoleRepository) {}

    execute(): Observable<RoleListModel[]> {
        return this.roleRepository.getRoles();
    }
}
