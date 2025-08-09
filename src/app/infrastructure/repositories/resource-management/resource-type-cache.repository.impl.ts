import { Injectable } from '@angular/core';
import { ResourceTypeCacheRepository } from '@domain/repositories/resource-management/resource-type-cache.repository';
import { ResourceTypeCacheService } from '@core/services/resource-type-cache.service';

@Injectable({ providedIn: 'root' })
export class ResourceTypeCacheRepositoryImpl implements ResourceTypeCacheRepository {
    constructor(private cache: ResourceTypeCacheService) {
    }

    setResourceTypesToCache(resourceTypes: any[]): void {
        this.cache.setResourceTypes(resourceTypes);
    }

    getResourceTypesFromCache(): any[] | null {
        return this.cache.getResourceTypes();
    }

    clearResourceTypesCache(): void {
        this.cache.removeResourceTypes();
    }
}

