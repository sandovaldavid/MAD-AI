import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthRepository } from '@domain/repositories/auth.repository';
import { LogoutRequest } from '@domain/models/auth/auth.model';

@Injectable({
    providedIn: 'root',
})
export class LogoutUseCase {
    private readonly authRepository = inject(AuthRepository);

    execute(logoutData: LogoutRequest): Observable<void> {
        return this.authRepository.logout(logoutData);
    }
}
