import { Injectable } from '@angular/core';
import { AuthUserStorePort, AuthUserSnapshot } from '@domain/ports/auth-user-store.port';

const KEY = 'mad-ai.auth.user.v1';

@Injectable({ providedIn: 'root' })
export class LocalStorageAuthUserStore implements AuthUserStorePort {
    read(): AuthUserSnapshot | null {
        try {
            const raw = localStorage.getItem(KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }
    write(snapshot: AuthUserSnapshot | null): void {
        if (!snapshot) return this.clear();
        localStorage.setItem(KEY, JSON.stringify(snapshot));
    }
    clear(): void {
        localStorage.removeItem(KEY);
    }
}
