import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { UserListModel } from '@domain/models/user/user-list.model';
import { USER_REPOSITORY_TOKEN } from '@infrastructure/tokens/user.providers';

@Injectable({
    providedIn: 'root',
})
export class DeactivateUserUseCase {
    private readonly userRepository = inject(USER_REPOSITORY_TOKEN);

    execute(id: number, reason?: string): Observable<UserListModel> {
        return this.userRepository.deactivateUser(id, reason);
    }
}
