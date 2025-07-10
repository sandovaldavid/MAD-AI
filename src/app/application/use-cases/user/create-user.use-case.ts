import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateUserModel } from '@domain/models/user/create-user.model';
import { UserEntity } from '@domain/entities/user.entity';
import { UserRepository } from '@domain/repositories/user.repository';
import { USER_REPOSITORY_TOKEN } from '@infrastructure/tokens/user.providers';

@Injectable({
    providedIn: 'root'
})
export class CreateUserUseCase {
    private readonly userRepository: UserRepository = inject(USER_REPOSITORY_TOKEN);

    execute(user: CreateUserModel): Observable<UserEntity> {
        return this.userRepository.createUser(user);
    }
}
