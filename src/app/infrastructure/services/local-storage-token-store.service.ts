import { Injectable } from '@angular/core';
import { TokenStorePort, TokenSnapshot } from '@domain/ports/token-store.port';

const KEY = 'mad-ai.auth.tokens.v1';

@Injectable({ providedIn: 'root' })
export class LocalStorageTokenStore implements TokenStorePort {
    read(): TokenSnapshot | null {
        const raw = localStorage.getItem(KEY);
        return raw ? JSON.parse(raw) : null;
    }
    write(snapshot: TokenSnapshot | null) {
        snapshot ? localStorage.setItem(KEY, JSON.stringify(snapshot)) : this.clear();
    }
    clear() {
        localStorage.removeItem(KEY);
    }
}
