import { inject, Injectable } from '@angular/core';
import { RoleApplicationMapper } from '@application/mappers/role.mapper';
import { RoleModel } from '../models/role.model';

@Injectable({ providedIn: 'root' })
export class RoleViewMapper {
  private readonly roleMapper = inject(RoleApplicationMapper);

  toModel(roleSummary: any): RoleModel {
    return {
      id: roleSummary.id,
      name: roleSummary.name,
      accessLevel: roleSummary.accessLevel,
      isActive: roleSummary.isActive,
      description: roleSummary.description ?? '',
      userCount: roleSummary.userCount,
      displayName: `${roleSummary.name} (L${roleSummary.accessLevel})`,
    };
  }
}
