import { InjectionToken } from '@angular/core';
export const RESOURCE_TYPE_CACHE_REPOSITORY = new InjectionToken<ResourceTypeCacheRepository>(
    'ResourceTypeCacheRepository'
);
export interface ResourceTypeCacheRepository {
    setResourceTypesToCache(resourceTypes: any[]): void;
    getResourceTypesFromCache(): any[] | null;
    clearResourceTypesCache(): void;
}
