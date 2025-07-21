import { Injectable, Inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IMaterialResourceRepository } from '@domain/repositories/resource-management/material-resource.repository';
import { MaterialResource } from '@domain/entities/resource-management/material-resource.entity';
import { MATERIAL_RESOURCE_REPOSITORY } from '@infrastructure/tokens/resource-management/material-resource.tokens';

@Injectable()
export class MaterialResourceUseCases {
  constructor(@Inject(MATERIAL_RESOURCE_REPOSITORY) private materialResourceRepository: IMaterialResourceRepository) {}

  getAllMaterialResources(): Observable<MaterialResource[]> {
    return this.materialResourceRepository.getAll();
  }

  getMaterialResourceById(id: string): Observable<MaterialResource> {
    return this.materialResourceRepository.getById(id);
  }

  createMaterialResource(materialResource: Partial<MaterialResource>): Observable<MaterialResource> {
    return this.materialResourceRepository.create(materialResource);
  }

  updateMaterialResource(id: string, materialResource: Partial<MaterialResource>): Observable<MaterialResource> {
    return this.materialResourceRepository.update(id, materialResource);
  }

  deleteMaterialResource(id: string): Observable<void> {
    return this.materialResourceRepository.delete(id);
  }
}
