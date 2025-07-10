import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { UserRepository } from '@domain/repositories/user.repository';
import { USER_REPOSITORY_TOKEN } from '@infrastructure/tokens/user.providers';

@Injectable({
    providedIn: 'root'
})
export class DeleteUserUseCase {
    private readonly userRepository: UserRepository = inject(USER_REPOSITORY_TOKEN);

    execute(id: number): Observable<void> {
        return this.userRepository.deleteUser(id);
    }
}
