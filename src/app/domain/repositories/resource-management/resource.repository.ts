
import { Observable } from 'rxjs';
import { Resource } from '../../entities/resource-management/resource.entity';

export interface IResourceRepository {
  getAll(): Observable<Resource[]>;
  getById(id: number): Observable<Resource>;
  create(resource: Partial<Resource>): Observable<Resource>;
  update(id: number, resource: Partial<Resource>): Observable<Resource>;
  delete(id: number): Observable<void>;
}
