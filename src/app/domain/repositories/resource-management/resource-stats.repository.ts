import { Observable } from 'rxjs';
import { GeneralStatistics } from '@domain/models/resource-management/resource-stats.model';

export abstract class IResourceStatsRepository {
    abstract getStats(): Observable<GeneralStatistics>;
}
