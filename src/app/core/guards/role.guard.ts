// core/guards/role.guard.ts
import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthFacade } from '@application/facades/auth.facade';

export const roleGuard =
    (requiredName: string): CanActivateFn =>
    () => {
        const auth = inject(AuthFacade);
        const u = auth.user();
        if (!u) return false;

        const byName = (u.roleName ?? '').toLowerCase() === requiredName.toLowerCase();
        const isAdminALevel = (u.role?.accessLevel ?? 99) === 1;
        const isAdminByName =
            (u.roleName ?? '').toLowerCase() === 'administrador' ||
            (u.roleName ?? '').toLowerCase() === 'administrator';
        return byName || isAdminALevel || isAdminByName;
    };
