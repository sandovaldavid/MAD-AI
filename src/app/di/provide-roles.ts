import { Provider } from '@angular/core';
import { ROLE_REPOSITORY } from './tokens';
import { HttpRoleRepository } from '@infrastructure/repositories/http-role.repository';

export function provideRoles(): Provider[] {
    return [{ provide: ROLE_REPOSITORY, useClass: HttpRoleRepository }];
}
