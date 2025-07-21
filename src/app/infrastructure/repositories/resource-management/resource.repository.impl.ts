import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IResourceRepository } from '../../../domain/repositories/resource-management/resource.repository';
import { Resource } from '../../../domain/entities/resource-management/resource.entity';
import { ResourceApiService } from '../../api/resource-management/resource.api';

@Injectable()
export class ResourceRepositoryImpl implements IResourceRepository {
    constructor(private apiService: ResourceApiService) {}

    getAll(): Observable<Resource[]> {
        return this.apiService.getAll();
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
