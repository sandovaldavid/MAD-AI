import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { RoleResponseDto } from '../dto/role/role-response.dto';
import { RoleDetailResponseDto } from '../dto/role/role-detail-response.dto';
import { AssignRoleRequestDto } from '../dto/role/assign-role-request.dto';
import { UpdateRoleRequestDto } from '../dto/role/update-role-request.dto';
import { UpdateRoleResponseDto } from '../dto/role/update-role-response.dto';
import { CreateRoleRequestDto } from '../dto/role/create-role-request.dto';
import { CreateRoleResponseDto } from '../dto/role/create-role-response.dto';

@Injectable({
    providedIn: 'root',
})
export class RoleApiService {
    private readonly baseUrl = `${environment.API_URL}/auth/roles`;

    constructor(private readonly http: HttpClient) {}

    getRoles(): Observable<RoleResponseDto[]> {
        return this.http.get<RoleResponseDto[]>(`${this.baseUrl}/`);
    }

    getRoleById(id: number): Observable<RoleDetailResponseDto> {
        return this.http.get<RoleDetailResponseDto>(`${this.baseUrl}/${id}/`);
    }

    assignRole(request: AssignRoleRequestDto): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/assign/`, request);
    }
    
    unassignRole(request: { user_id: number }): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/unassign/`, request);
    }

    updateRole(id: number, request: UpdateRoleRequestDto): Observable<UpdateRoleResponseDto> {
        return this.http.put<UpdateRoleResponseDto>(`${this.baseUrl}/${id}/update/`, request);
    }

    createRole(request: CreateRoleRequestDto): Observable<CreateRoleResponseDto> {
        return this.http.post<CreateRoleResponseDto>(`${this.baseUrl}/create/`, request);
    }

    deleteRole(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}/delete/`);
    }
}
