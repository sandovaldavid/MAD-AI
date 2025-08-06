import { inject } from '@angular/core';
import {
    RESOURCE_TYPE_CACHE_REPOSITORY,
    ResourceTypeCacheRepository,
} from '@domain/repositories/resource-management/resource-type-cache.repository';
import { ResourceTypeApiService } from '@infrastructure/api/resource-management/resource-type.api';
import { firstValueFrom } from 'rxjs';

export class ResourceTypeCacheUseCase {
    private readonly cacheRepo = inject(
        RESOURCE_TYPE_CACHE_REPOSITORY
    ) as ResourceTypeCacheRepository;
    private readonly api = inject(ResourceTypeApiService);

    setResourceTypesToCache(resourceTypes: any[]): void {
        this.cacheRepo.setResourceTypesToCache(resourceTypes);
    }

    getResourceTypesFromCache(): any[] | null {
        return this.cacheRepo.getResourceTypesFromCache();
    }

    clearResourceTypesCache(): void {
        this.cacheRepo.clearResourceTypesCache();
    }

    /**
     * Obtiene los tipos de recurso desde la API, los guarda en caché y los retorna.
     */
    async fetchAndCacheResourceTypes(): Promise<any[]> {
        const types = await firstValueFrom(this.api.getAll());
        this.setResourceTypesToCache(types);
        return types;
    }
}
