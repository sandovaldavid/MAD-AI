
import { Observable } from 'rxjs';
import { ResourceType } from '../../entities/resource-management/resource-type.entity';

export interface IResourceTypeRepository {
  getAll(): Observable<ResourceType[]>;
  getById(id: number): Observable<ResourceType>;
  create(resourceType: Partial<ResourceType>): Observable<ResourceType>;
  update(id: number, resourceType: Partial<ResourceType>): Observable<ResourceType>;
  delete(id: number): Observable<void>;
}
