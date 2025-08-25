import { Injectable } from '@angular/core';

const KEY = 'mad-ai.returnUrl.v1';

@Injectable({ providedIn: 'root' })
export class ReturnUrlService {
  set(url: string) {
    sessionStorage.setItem(KEY, url);
  }
  peek(): string | null {
    return sessionStorage.getItem(KEY);
  }
  consume(): string | null {
    const u = this.peek();
    if (u) sessionStorage.removeItem(KEY);
    return u;
  }
  clear() {
    sessionStorage.removeItem(KEY);
  }
}
