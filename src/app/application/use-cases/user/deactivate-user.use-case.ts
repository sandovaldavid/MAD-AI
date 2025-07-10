import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { UserEntity } from '@domain/entities/user.entity';
import { UserRepository } from '@domain/repositories/user.repository';
import { DeactivateUserData } from '@domain/models/user/user.dto';
import { USER_REPOSITORY_TOKEN } from '@infrastructure/tokens/user.providers';

@Injectable({
    providedIn: 'root',
})
export class DeactivateUserUseCase {
    private readonly userRepository: UserRepository = inject(USER_REPOSITORY_TOKEN);

    execute(id: number, reason?: string): Observable<UserEntity> {
        // Transform string to DTO
        const deactivateData: DeactivateUserData | undefined = reason ? { reason } : undefined;

        return this.userRepository.deactivateUser(id, deactivateData);
    }
}
