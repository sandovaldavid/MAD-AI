import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthRepository } from '@domain/repositories/auth.repository';
import { RefreshTokenRequest, RefreshTokenResponse } from '@domain/models/auth/auth.model';

@Injectable({
    providedIn: 'root',
})
export class RefreshTokenUseCase {
    private readonly authRepository = inject(AuthRepository);

    execute(request: RefreshTokenRequest): Observable<RefreshTokenResponse> {
        return this.authRepository.refreshToken(request);
    }
}
