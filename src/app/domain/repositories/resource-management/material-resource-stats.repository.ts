import { Observable } from 'rxjs';
import { MaterialResourceStats } from '@domain/models/resource-management/material-resource-stats.model';

export abstract class IMaterialResourceStatsRepository {
    abstract getStats(): Observable<MaterialResourceStats>;
}
