import { Injectable } from '@angular/core';
import { TokenStorePort } from '@domain/repositories/session/session-store.repository';
import { TokenSnapshotContract } from '@domain/contracts/session-store.contract';

const KEY = 'mad-ai.auth.tokens.v1';

@Injectable({ providedIn: 'root' })
export class LocalStorageTokenStore implements TokenStorePort {
  async read(): Promise<TokenSnapshotContract | null> {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  }

  async write(snapshot: TokenSnapshotContract | null): Promise<void> {
    snapshot ? localStorage.setItem(KEY, JSON.stringify(snapshot)) : this.clear();
  }

  async clear(): Promise<void> {
    localStorage.removeItem(KEY);
  }
}
