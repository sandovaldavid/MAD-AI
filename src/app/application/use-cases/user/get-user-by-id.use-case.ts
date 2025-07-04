import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { UserListModel } from '../../../domain/models/user/user-list.model';
import { USER_REPOSITORY_TOKEN } from '../../../infrastructure/tokens/user.providers';

@Injectable({
    providedIn: 'root'
})
export class GetUserByIdUseCase {
    private readonly userRepository = inject(USER_REPOSITORY_TOKEN);

    execute(id: number): Observable<UserListModel> {
        return this.userRepository.getUserById(id);
    }
}
