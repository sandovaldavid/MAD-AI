
import { Observable } from 'rxjs';
import { MaterialResource } from '../../entities/resource-management/material-resource.entity';

export interface IMaterialResourceRepository {
  getAll(): Observable<MaterialResource[]>;
  getById(id: string): Observable<MaterialResource>;
  create(materialResource: Partial<MaterialResource>): Observable<MaterialResource>;
  update(id: string, materialResource: Partial<MaterialResource>): Observable<MaterialResource>;
  delete(id: string): Observable<void>;
}
