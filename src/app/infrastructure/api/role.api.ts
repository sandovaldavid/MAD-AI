import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../env/environment';
import { RoleResponseDto } from '../dto/role/role-response.dto';
import { AssignRoleRequestDto } from '../dto/role/assign-role-request.dto';

@Injectable({
    providedIn: 'root'
})
export class RoleApiService {
    private readonly baseUrl = `${environment.API_URL}/auth/roles`;

    constructor(private readonly http: HttpClient) {}

    getRoles(): Observable<RoleResponseDto[]> {
        return this.http.get<RoleResponseDto[]>(`${this.baseUrl}/`);
    }

    assignRole(request: AssignRoleRequestDto): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/assign/`, request);
    }
}
