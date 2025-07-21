
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IMaterialResourceRepository } from '../../../domain/repositories/resource-management/material-resource.repository';
import { MaterialResource } from '../../../domain/entities/resource-management/material-resource.entity';
import { MaterialResourceApiService } from '../../api/resource-management/material-resource.api';

@Injectable()
export class MaterialResourceRepositoryImpl implements IMaterialResourceRepository {
  constructor(private apiService: MaterialResourceApiService) {}

  getAll(): Observable<MaterialResource[]> {
    return this.apiService.getAll();
  }

  getById(id: string): Observable<MaterialResource> {
    return this.apiService.getById(id);
  }

  create(materialResource: Partial<MaterialResource>): Observable<MaterialResource> {
    return this.apiService.create(materialResource);
  }

  update(id: string, materialResource: Partial<MaterialResource>): Observable<MaterialResource> {
    return this.apiService.update(id, materialResource);
  }

  delete(id: string): Observable<void> {
    return this.apiService.delete(id);
  }
}
