import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateUserModel } from '../../../domain/models/user/create-user.model';
import { UserListModel } from '../../../domain/models/user/user-list.model';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { USER_REPOSITORY_TOKEN } from '../../../infrastructure/tokens/user.providers';

@Injectable({
    providedIn: 'root'
})
export class CreateUserUseCase {
    private readonly userRepository = inject(USER_REPOSITORY_TOKEN);

    execute(user: CreateUserModel): Observable<UserListModel> {
        return this.userRepository.createUser(user);
    }
}
