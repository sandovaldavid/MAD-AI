import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Resource } from '../../entities/resource-management/resource.entity';
import { PaginatedResponse } from '../../models/paginated-response.model';

export interface IResourceRepository {
    getAll(page: number): Observable<PaginatedResponse<Resource>>;
    getById(id: number): Observable<Resource>;
    create(resource: Partial<Resource>): Observable<Resource>;
    update(id: number, resource: Partial<Resource>): Observable<Resource>;
    delete(id: number): Observable<void>;
}

export const RESOURCE_REPOSITORY = new InjectionToken<IResourceRepository>('resource-repository');
