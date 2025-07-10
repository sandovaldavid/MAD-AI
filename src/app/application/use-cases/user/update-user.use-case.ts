import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { UpdateUserModel } from '@domain/models/user/update-user.model';
import { UserEntity } from '@domain/entities/user.entity';
import { UserRepository } from '@domain/repositories/user.repository';
import { USER_REPOSITORY_TOKEN } from '@infrastructure/tokens/user.providers';

@Injectable({
    providedIn: 'root',
})
export class UpdateUserUseCase {
    private readonly userRepository: UserRepository = inject(USER_REPOSITORY_TOKEN);

    execute(id: number, user: UpdateUserModel): Observable<UserEntity> {
        return this.userRepository.updateUser(id, user);
    }
}
