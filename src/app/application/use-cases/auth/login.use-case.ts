import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthRepository } from '@domain/repositories/auth.repository';
import { LoginRequest, LoginResponse } from '@domain/models/auth/auth.model';

@Injectable({
    providedIn: 'root',
})
export class LoginUseCase {
    private readonly authRepository = inject(AuthRepository);

    execute(loginData: LoginRequest): Observable<LoginResponse> {
        return this.authRepository.login(loginData);
    }
}
