import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { UpdateUserModel } from '../../../domain/models/user/update-user.model';
import { UserListModel } from '../../../domain/models/user/user-list.model';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { USER_REPOSITORY_TOKEN } from '../../../infrastructure/tokens/user.providers';

@Injectable({
    providedIn: 'root'
})
export class UpdateUserUseCase {
    private readonly userRepository = inject(USER_REPOSITORY_TOKEN);

    execute(id: number, user: UpdateUserModel): Observable<UserListModel> {
        return this.userRepository.updateUser(id, user);
    }
}
