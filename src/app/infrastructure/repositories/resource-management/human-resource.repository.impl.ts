import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IHumanResourceRepository } from '../../../domain/repositories/resource-management/human-resource.repository';
import { HumanResource } from '../../../domain/entities/resource-management/human-resource.entity';
import { HumanResourceApiService } from '../../api/resource-management/human-resource.api';

@Injectable()
export class HumanResourceRepositoryImpl implements IHumanResourceRepository {
  constructor(private apiService: HumanResourceApiService) {}

  getAll(): Observable<HumanResource[]> {
    return this.apiService.getAll();
  }

  getById(id: string): Observable<HumanResource> {
    return this.apiService.getById(id);
  }

  create(humanResource: Partial<HumanResource>): Observable<HumanResource> {
    return this.apiService.create(humanResource);
  }

  update(id: string, humanResource: Partial<HumanResource>): Observable<HumanResource> {
    return this.apiService.update(id, humanResource);
  }

  delete(id: string): Observable<void> {
    return this.apiService.delete(id);
  }
}
