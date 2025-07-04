import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { UserStatsModel } from '@domain/models/user/user-stats.model';
import { UserRepository } from '@domain/repositories/user.repository';
import { USER_REPOSITORY_TOKEN } from '@infrastructure/tokens/user.providers';

@Injectable({
    providedIn: 'root'
})
export class GetUserStatsUseCase {
    private readonly userRepository = inject(USER_REPOSITORY_TOKEN);

    execute(): Observable<UserStatsModel> {
        return this.userRepository.getUserStats();
    }
}
