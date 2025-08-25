import { Injectable } from '@angular/core';
import { AuthUserStorePort } from '@domain/repositories/session/session-store.repository';
import { AuthUserSnapshotContract } from '@domain/contracts/session-store.contract';

const KEY = 'mad-ai.auth.user.v1';

@Injectable({ providedIn: 'root' })
export class LocalStorageAuthUserStore implements AuthUserStorePort {
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
