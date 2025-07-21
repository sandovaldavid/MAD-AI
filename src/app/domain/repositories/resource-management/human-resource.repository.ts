
import { Observable } from 'rxjs';
import { HumanResource } from '../../entities/resource-management/human-resource.entity';

export interface IHumanResourceRepository {
  getAll(): Observable<HumanResource[]>;
  getById(id: string): Observable<HumanResource>;
  create(humanResource: Partial<HumanResource>): Observable<HumanResource>;
  update(id: string, humanResource: Partial<HumanResource>): Observable<HumanResource>;
  delete(id: string): Observable<void>;
}
