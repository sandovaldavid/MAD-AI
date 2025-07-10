import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { UserStatsModel } from '@domain/models/user/user-stats.model';
import { UserStats } from '@domain/models/user/user.dto';
import { UserRepository } from '@domain/repositories/user.repository';
import { USER_REPOSITORY_TOKEN } from '@infrastructure/tokens/user.providers';

@Injectable({
    providedIn: 'root',
})
export class GetUserStatsUseCase {
    private readonly userRepository: UserRepository = inject(USER_REPOSITORY_TOKEN);

    execute(): Observable<UserStatsModel> {
        return this.userRepository.getUserStats().pipe(
            map((stats: UserStats) => ({
                total_users: stats.totalUsers,
                active_users: stats.activeUsers,
                inactive_users: stats.inactiveUsers,
            }))
        );
    }
}
