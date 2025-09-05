import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TokenStoreRepository } from '@domain/repositories/session/token-store.repository';
import { TokenSnapshotContract } from '@/app/domain/repositories/session/token-store.contract';

const KEY = 'mad-ai.auth.tokens.v1';

@Injectable({ providedIn: 'root' })
export class LocalStorageTokenStore implements TokenStoreRepository {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  async read(): Promise<TokenSnapshotContract | null> {
    if (!this.isBrowser) {
      return null;
    }

    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn(`LocalStorageTokenStore: Error reading from localStorage for key "${KEY}":`, error);
      return null;
    }
  }

  async write(snapshot: TokenSnapshotContract | null): Promise<void> {
    if (!this.isBrowser) {
      return;
    }

    try {
      if (snapshot) {
        localStorage.setItem(KEY, JSON.stringify(snapshot));
      } else {
        this.clear();
      }
    } catch (error) {
      console.warn(`LocalStorageTokenStore: Error writing to localStorage for key "${KEY}":`, error);
    }
  }

  async clear(): Promise<void> {
    if (!this.isBrowser) {
      return;
    }

    try {
      localStorage.removeItem(KEY);
    } catch (error) {
      console.warn(`LocalStorageTokenStore: Error removing from localStorage for key "${KEY}":`, error);
    }
  }
}
