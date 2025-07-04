import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { UserResponseDto } from '../dto/user/user-response.dto';
import { CreateUserRequestDto } from '../dto/user/create-user-request.dto';
import { UpdateUserRequestDto } from '../dto/user/update-user-request.dto';
import { environment } from '@env/environment';

@Injectable({
    providedIn: 'root',
})
export class UserApiClient {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.API_URL}/auth/users`;

    getUsers(): Observable<UserResponseDto[]> {
        return this.http.get<UserResponseDto[]>(`${this.baseUrl}/`);
    }

    getUserById(id: number): Observable<UserResponseDto> {
        return this.http.get<UserResponseDto>(`${this.baseUrl}/${id}/`);
    }

    createUser(user: CreateUserRequestDto): Observable<UserResponseDto> {
        return this.http.post<UserResponseDto>(`${this.baseUrl}/create/`, user);
    }

    updateUser(id: number, user: UpdateUserRequestDto): Observable<UserResponseDto> {
        return this.http.put<UserResponseDto>(`${this.baseUrl}/${id}/`, user);
    }

    deleteUser(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}/`);
    }
}
