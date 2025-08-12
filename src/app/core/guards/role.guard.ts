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
        return byName || u.isAdministrator();
    };
