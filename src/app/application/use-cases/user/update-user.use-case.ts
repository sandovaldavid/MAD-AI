import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { UpdateUserData } from '@domain/models/user/user.dto';
import { UserEntity } from '@domain/entities/user.entity';
import { UserRepository } from '@domain/repositories/user.repository';
import { USER_REPOSITORY_TOKEN } from '@infrastructure/tokens/user.providers';

@Injectable({
    providedIn: 'root',
})
export class UpdateUserUseCase {
    private readonly userRepository: UserRepository = inject(USER_REPOSITORY_TOKEN);

    execute(id: number, user: UpdateUserData): Observable<UserEntity> {
        return this.userRepository.updateUser(id, user);
    }
}
