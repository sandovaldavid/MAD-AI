import { Injectable } from '@angular/core';
import { TokenStoreRepository } from '@domain/repositories/session/token-store.repository';
import { TokenSnapshotContract } from '@/app/domain/repositories/session/token-store.contract';

const KEY = 'mad-ai.auth.tokens.v1';

@Injectable({ providedIn: 'root' })
export class LocalStorageTokenStore implements TokenStoreRepository {
  async read(): Promise<TokenSnapshotContract | null> {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  }

  async write(snapshot: TokenSnapshotContract | null): Promise<void> {
    if (snapshot) {
      localStorage.setItem(KEY, JSON.stringify(snapshot));
    } else {
      this.clear();
    }
  }

  async clear(): Promise<void> {
    localStorage.removeItem(KEY);
  }
}
