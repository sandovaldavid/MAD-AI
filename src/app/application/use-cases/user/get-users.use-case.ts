import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { UserListModel } from '@domain/models/user/user-list.model';
import { UserRepository } from '@domain/repositories/user.repository';
import { USER_REPOSITORY_TOKEN } from '@infrastructure/tokens/user.providers';

@Injectable({
    providedIn: 'root',
})
export class GetUsersUseCase {
    private readonly userRepository = inject(USER_REPOSITORY_TOKEN);

    execute(): Observable<UserListModel[]> {
        return this.userRepository.getUsers();
    }
}
