import { Injectable, Inject, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ICON_SVG_SET, ICON_REGISTRY_OPTIONS, IconRegistryOptions } from '@app/di/tokens';

@Injectable({ providedIn: 'root' })
export class IconRegistry {
  private san = inject(DomSanitizer);
  private cache = new Map<string, SafeHtml>();

  constructor(
    @Inject(ICON_SVG_SET) private readonly sets: Record<string, string>[],
    @Inject(ICON_REGISTRY_OPTIONS) private readonly opts: IconRegistryOptions
  ) {}

  private merged(): Record<string, string> {
    //* todos los sets (core + features lazy)
    return Object.assign({}, ...this.sets);
  }

  getWithVariant(name: string, variant?: 'outline' | 'filled'): SafeHtml | null {
    const all = this.merged();
    const tryKeys = [
      variant ? `${variant}/${name}` : null,
      name,
      this.opts.fallbackName ?? null,
    ].filter(Boolean) as string[];

    for (const key of tryKeys) {
      const raw = all[key];
      if (raw) return this.toSafe(key, raw);
    }

    if (this.opts.fallbackSvg) return this.toSafe('__fallback__', this.opts.fallbackSvg);
    this.logMissing(name, variant);
    return null;
  }

  list(): string[] {
    return Object.keys(this.merged());
  }

  private toSafe(key: string, raw: string): SafeHtml {
    const c = this.cache.get(key);
    if (c) return c;
    const safe = this.san.bypassSecurityTrustHtml(raw);
    this.cache.set(key, safe);
    return safe;
  }

  private logMissing(name: string, variant?: 'outline' | 'filled') {
    if (this.opts.missingStrategy === 'silent') return;
    const msg = `[IconRegistry] Icono no encontrado: ${variant ? `${variant}/` : ''}${name}`;
    if (this.opts.missingStrategy === 'error') console.error(msg);
    else console.warn(msg);
  }
}
