import { Observable } from 'rxjs';
import { HumanResourcesStats } from '../../models/resource-management/human-resources-stats.model';

export interface HumanResourcesRepository {
    getStats(): Observable<HumanResourcesStats>;
}
