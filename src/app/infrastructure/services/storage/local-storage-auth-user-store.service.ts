import { Injectable } from '@angular/core';
import { AuthUserStoreRepository } from '@domain/repositories/session/auth-user-store.repository';
import { AuthUserSnapshotContract } from '@/app/domain/repositories/session/auth-user-store.contract';

const KEY = 'mad-ai.auth.user.v1';

@Injectable({ providedIn: 'root' })
export class LocalStorageAuthUserStore implements AuthUserStoreRepository {
  async read(): Promise<AuthUserSnapshotContract | null> {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  async write(snapshot: AuthUserSnapshotContract | null): Promise<void> {
    if (!snapshot) return this.clear();
    localStorage.setItem(KEY, JSON.stringify(snapshot));
  }

  async clear(): Promise<void> {
    localStorage.removeItem(KEY);
  }
}
