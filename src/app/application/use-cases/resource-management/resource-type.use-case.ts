import { Injectable, Inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IResourceTypeRepository } from '@domain/repositories/resource-management/resource-type.repository';
import { ResourceType } from '@domain/models/resource-management/resource-type.model';
import { RESOURCE_TYPE_REPOSITORY } from '@infrastructure/tokens/resource-management/resource-type.tokens';
import { PaginatedResponse } from '@domain/models/paginated-response.model';

@Injectable()
export class ResourceTypeUseCases {
    constructor(
        @Inject(RESOURCE_TYPE_REPOSITORY) private resourceTypeRepository: IResourceTypeRepository
    ) {}

    getAllResourceTypes(): Observable<PaginatedResponse<ResourceType>> {
        return this.resourceTypeRepository.getAll();
    }

    getResourceTypeById(id: number): Observable<ResourceType> {
        return this.resourceTypeRepository.getById(id);
    }

    createResourceType(resourceType: Partial<ResourceType>): Observable<ResourceType> {
        return this.resourceTypeRepository.create(resourceType);
    }

    updateResourceType(id: number, resourceType: Partial<ResourceType>): Observable<ResourceType> {
        return this.resourceTypeRepository.update(id, resourceType);
    }

    deleteResourceType(id: number): Observable<void> {
        return this.resourceTypeRepository.delete(id);
    }
}
