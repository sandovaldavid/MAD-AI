import { Injectable } from '@angular/core';

const RESOURCE_TYPE_CACHE_KEY = 'resource_types_cache';

@Injectable({ providedIn: 'root' })
export class ResourceTypeCacheService {
    setResourceTypes(types: any[]): void {
        try {
            localStorage.setItem(RESOURCE_TYPE_CACHE_KEY, JSON.stringify(types));
        } catch {
        }
    }

    getResourceTypes(): any[] | null {
        try {
            const raw = localStorage.getItem(RESOURCE_TYPE_CACHE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    removeResourceTypes(): void {
        try {
            localStorage.removeItem(RESOURCE_TYPE_CACHE_KEY);
        } catch {
        }
    }
}

