import { Injectable, signal, computed } from '@angular/core';

export interface BreadcrumbItem {
  label: string;
  route?: string;
  icon?: string;
  url?: string;
  isLast?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class BreadcrumbService {
  private readonly _breadcrumbs = signal<BreadcrumbItem[]>([]);

  readonly breadcrumbs = computed(() => {
    const items = this._breadcrumbs();
    return items.map((item, index) => ({
      ...item,
      url: item.route || item.url,
      isLast: index === items.length - 1,
    }));
  });

  setBreadcrumbs(breadcrumbs: BreadcrumbItem[]): void {
    this._breadcrumbs.set(breadcrumbs);
  }

  addBreadcrumb(breadcrumb: BreadcrumbItem): void {
    this._breadcrumbs.update((current) => [...current, breadcrumb]);
  }

  removeBreadcrumb(index: number): void {
    this._breadcrumbs.update((current) => current.filter((_, i) => i !== index));
  }

  clear(): void {
    this._breadcrumbs.set([]);
  }
}
