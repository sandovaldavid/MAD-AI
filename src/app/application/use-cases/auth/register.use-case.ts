import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthRepository } from '@domain/repositories/auth.repository';
import { RegisterRequest, RegisterResponse } from '@domain/models/auth/auth.model';

@Injectable({
    providedIn: 'root',
})
export class RegisterUseCase {
    private readonly authRepository = inject(AuthRepository);

    execute(request: RegisterRequest): Observable<RegisterResponse> {
        return this.authRepository.register(request);
    }
}
