export interface ResourceTypeCacheService {
    setResourceTypesToCache(resourceTypes: any[]): void;
    getResourceTypesFromCache(): any[] | null;
    clearResourceTypesCache(): void;
}
