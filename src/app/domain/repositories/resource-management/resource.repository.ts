import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Resource } from '../../entities/resource-management/resource.entity';
import { PaginatedResponse } from '../../models/paginated-response.model';
import { ResourceSearch } from '../../models/resource-management/resource-search.model';

export abstract class IResourceRepository {
    abstract getAll(page: number): Observable<PaginatedResponse<Resource>>;
    abstract search(criteria: ResourceSearch): Observable<PaginatedResponse<Resource>>;
    abstract getById(id: number): Observable<Resource>;
    abstract create(resource: Partial<Resource>): Observable<Resource>;
    abstract update(id: number, resource: Partial<Resource>): Observable<Resource>;
    abstract delete(id: number): Observable<void>;
}

export const RESOURCE_REPOSITORY = new InjectionToken<IResourceRepository>('resource-repository');
