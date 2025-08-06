import { Injectable } from '@angular/core';
import { ResourceTypeCacheRepository } from '@domain/repositories/resource-management/resource-type-cache.repository';

@Injectable({ providedIn: 'root' })
export class ResourceTypeCacheRepositoryImpl implements ResourceTypeCacheRepository {
    private readonly CACHE_KEY = 'resource_types_cache';

    setResourceTypesToCache(resourceTypes: any[]): void {
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(resourceTypes));
    }

    getResourceTypesFromCache(): any[] | null {
        const data = localStorage.getItem(this.CACHE_KEY);
        return data ? JSON.parse(data) : null;
    }

    clearResourceTypesCache(): void {
        localStorage.removeItem(this.CACHE_KEY);
    }
}
