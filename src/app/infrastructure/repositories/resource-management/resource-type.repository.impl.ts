import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IResourceTypeRepository } from '@domain/repositories/resource-management/resource-type.repository';
import { ResourceType } from '../../../domain/entities/resource-management/resource-type.entity';
import { ResourceTypeApiService } from '../../api/resource-management/resource-type.api';
import { PaginatedResponse } from '@domain/models/paginated-response.model';
import { environment } from '@/env/environment';

@Injectable({ providedIn: 'root' })
export class ResourceTypeRepositoryImpl implements IResourceTypeRepository {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.API_URL}/resource_management/resource-types/`;

  constructor(private apiService: ResourceTypeApiService) {}

  getAll(): Observable<PaginatedResponse<ResourceType>> {
    return this.http.get<PaginatedResponse<ResourceType>>(this.apiUrl);
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
