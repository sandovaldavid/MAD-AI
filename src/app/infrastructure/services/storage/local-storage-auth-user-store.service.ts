import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthUserStoreRepository } from '@domain/repositories/session/auth-user-store.repository';
import { AuthUserSnapshotContract } from '@/app/domain/repositories/session/auth-user-store.contract';

const KEY = 'mad-ai.auth.user.v1';

@Injectable({ providedIn: 'root' })
export class LocalStorageAuthUserStore implements AuthUserStoreRepository {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  async read(): Promise<AuthUserSnapshotContract | null> {
    if (!this.isBrowser) {
      return null;
    }

    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn(`LocalStorageAuthUserStore: Error reading from localStorage for key "${KEY}":`, error);
      return null;
    }
  }

  async write(snapshot: AuthUserSnapshotContract | null): Promise<void> {
    if (!this.isBrowser) {
      return;
    }

    try {
      if (!snapshot) {
        this.clear();
      } else {
        localStorage.setItem(KEY, JSON.stringify(snapshot));
      }
    } catch (error) {
      console.warn(`LocalStorageAuthUserStore: Error writing to localStorage for key "${KEY}":`, error);
    }
  }

  async clear(): Promise<void> {
    if (!this.isBrowser) {
      return;
    }

    try {
      localStorage.removeItem(KEY);
    } catch (error) {
      console.warn(`LocalStorageAuthUserStore: Error removing from localStorage for key "${KEY}":`, error);
    }
  }
}
