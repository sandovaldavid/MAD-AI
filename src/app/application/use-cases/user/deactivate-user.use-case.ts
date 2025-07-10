import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { UserEntity } from '@domain/entities/user.entity';
import { UserRepository } from '@domain/repositories/user.repository';
import { USER_REPOSITORY_TOKEN } from '@infrastructure/tokens/user.providers';

@Injectable({
    providedIn: 'root',
})
export class DeactivateUserUseCase {
    private readonly userRepository: UserRepository = inject(USER_REPOSITORY_TOKEN);

    execute(id: number, reason?: string): Observable<UserEntity> {
        return this.userRepository.deactivateUser(id, reason);
    }
}
