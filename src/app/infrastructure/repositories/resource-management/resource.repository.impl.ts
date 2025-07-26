import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PaginatedResponse } from '@domain/models/paginated-response.model';
import { Resource } from '@domain/entities/resource-management/resource.entity';
import { IResourceRepository } from '@domain/repositories/resource-management/resource.repository';
import { ResourceSearch } from '@domain/models/resource-management/resource-search.model';
import { ResourceApiService } from '@infrastructure/api/resource-management/resource.api';

@Injectable({ providedIn: 'root' })
export class ResourceRepositoryImpl implements IResourceRepository {
    private readonly apiService = inject(ResourceApiService);

    getAll(page: number): Observable<PaginatedResponse<Resource>> {
        return this.apiService.getAll(page);
    }

    search(criteria: ResourceSearch): Observable<PaginatedResponse<Resource>> {
        return this.apiService.search(criteria);
    }

    getById(id: number): Observable<Resource> {
        return this.apiService.getById(id);
    }

    create(resource: Partial<Resource>): Observable<Resource> {
        return this.apiService.create(resource);
    }

    update(id: number, resource: Partial<Resource>): Observable<Resource> {
        return this.apiService.update(id, resource);
    }

    delete(id: number): Observable<void> {
        return this.apiService.delete(id);
    }
}
