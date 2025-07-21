
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IResourceTypeRepository } from '../../../domain/repositories/resource-management/resource-type.repository';
import { ResourceType } from '../../../domain/entities/resource-management/resource-type.entity';
import { ResourceTypeApiService } from '../../api/resource-management/resource-type.api';

@Injectable()
export class ResourceTypeRepositoryImpl implements IResourceTypeRepository {
  constructor(private apiService: ResourceTypeApiService) {}

  getAll(): Observable<ResourceType[]> {
    return this.apiService.getAll();
  }

  getById(id: number): Observable<ResourceType> {
    return this.apiService.getById(id);
  }

  create(resourceType: Partial<ResourceType>): Observable<ResourceType> {
    return this.apiService.create(resourceType);
  }

  update(id: number, resourceType: Partial<ResourceType>): Observable<ResourceType> {
    return this.apiService.update(id, resourceType);
  }

  delete(id: number): Observable<void> {
    return this.apiService.delete(id);
  }
}
