import { Injectable, Inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IResourceRepository } from '@domain/repositories/resource-management/resource.repository';
import { Resource } from '@domain/entities/resource-management/resource.entity';
import { RESOURCE_REPOSITORY } from '@infrastructure/tokens/resource-management/resource.tokens';

@Injectable()
export class ResourceUseCases {
    constructor(@Inject(RESOURCE_REPOSITORY) private resourceRepository: IResourceRepository) {}

    getAllResources(): Observable<Resource[]> {
        return this.resourceRepository.getAll();
    }

    getResourceById(id: number): Observable<Resource> {
        return this.resourceRepository.getById(id);
    }

    createResource(resource: Partial<Resource>): Observable<Resource> {
        return this.resourceRepository.create(resource);
    }

    updateResource(id: number, resource: Partial<Resource>): Observable<Resource> {
        return this.resourceRepository.update(id, resource);
    }

    deleteResource(id: number): Observable<void> {
        return this.resourceRepository.delete(id);
    }
}
