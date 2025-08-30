import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS_V1 } from '@infrastructure/config/api-endpoints.config';
import { CreateRoleRequestDTO, CreateRoleResponseDTO } from '@infrastructure/dtos/roles/create.dto';
import { RequestUpdateRoleDTO, ResponseUpdateRoleDTO } from '@infrastructure/dtos/roles/update.dto';
import { RolesResponseDTO } from '@infrastructure/dtos/roles/roles.dto';
import { RoleDetailResponseDTO } from '@infrastructure/dtos/roles/detail.dto';
import { AssignRoleRequestDTO, AssignRoleResponseDTO } from '@infrastructure/dtos/roles/assign.dto';
import {
  UnassignRoleRequestDTO,
  UnassignRoleResponseDTO,
} from '@infrastructure/dtos/roles/unassign.dto';
import { DeleteRoleResponseDTO } from '@infrastructure/dtos/roles/delete.dto';

/**
 * Role API Client - Infrastructure Layer
 *
 * Cliente HTTP puro para operaciones de gestión de roles.
 * Encapsula todas las llamadas HTTP relacionadas con roles
 * sin lógica de negocio ni transformación de datos.
 *
 * @description Este cliente sigue el patrón de infraestructura limpia,
 * proporcionando una interfaz pura de HTTP para que los repositories
 * puedan usarla sin conocer los detalles de las llamadas HTTP.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 *
 * @example Basic Usage
 * ```typescript
 * @Injectable()
 * export class HttpRoleRepository implements RoleRepository {
 *   constructor(private roleClient: RoleApiClient) {}
 *
 *   async getById(id: number): Promise<Role> {
 *     const response = await firstValueFrom(this.roleClient.getById(id));
 *     // Transform response to domain entity
 *   }
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class RoleApiClient {
  private readonly http = inject(HttpClient);

  /**
   * Lista roles con filtros
   *
   * @param filters - Filtros opcionales para la consulta
   * @returns Observable con lista de roles
   */
  list(filters?: {
    search?: string;
    is_active?: boolean;
    access_level?: number;
  }): Observable<RolesResponseDTO> {
    let params = new HttpParams();

    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.is_active !== undefined)
      params = params.set('is_active', filters.is_active.toString());
    if (filters?.access_level) params = params.set('access_level', filters.access_level.toString());

    return this.http.get<RolesResponseDTO>(API_ENDPOINTS_V1.ROLES.LIST, { params });
  }

  /**
   * Obtiene rol por ID
   *
   * @param id - ID del rol
   * @returns Observable con detalle del rol
   */
  getById(id: number): Observable<RoleDetailResponseDTO> {
    return this.http.get<RoleDetailResponseDTO>(API_ENDPOINTS_V1.ROLES.DETAIL(id));
  }

  /**
   * Crea un nuevo rol
   *
   * @param roleData - Datos del rol a crear
   * @returns Observable con rol creado
   */
  create(roleData: CreateRoleRequestDTO): Observable<CreateRoleResponseDTO> {
    return this.http.post<CreateRoleResponseDTO>(API_ENDPOINTS_V1.ROLES.CREATE, roleData);
  }

  /**
   * Actualiza un rol existente
   *
   * @param id - ID del rol
   * @param roleData - Datos a actualizar
   * @returns Observable con rol actualizado
   */
  update(id: number, roleData: RequestUpdateRoleDTO): Observable<ResponseUpdateRoleDTO> {
    return this.http.put<ResponseUpdateRoleDTO>(API_ENDPOINTS_V1.ROLES.UPDATE(id), roleData);
  }

  /**
   * Elimina un rol
   *
   * @param id - ID del rol a eliminar
   * @returns Observable con respuesta de eliminación
   */
  delete(id: number): Observable<DeleteRoleResponseDTO> {
    return this.http.delete<DeleteRoleResponseDTO>(API_ENDPOINTS_V1.ROLES.DELETE(id));
  }

  /**
   * Asigna rol a usuario
   *
   * @param assignmentData - Datos de asignación
   * @returns Observable con respuesta de asignación
   */
  assign(assignmentData: AssignRoleRequestDTO): Observable<AssignRoleResponseDTO> {
    return this.http.post<AssignRoleResponseDTO>(API_ENDPOINTS_V1.ROLES.ASSIGN, assignmentData);
  }

  /**
   * Remueve rol de usuario
   *
   * @param unassignmentData - Datos de remoción
   * @returns Observable con respuesta de remoción
   */
  unassign(unassignmentData: UnassignRoleRequestDTO): Observable<UnassignRoleResponseDTO> {
    return this.http.post<UnassignRoleResponseDTO>(
      API_ENDPOINTS_V1.ROLES.UNASSIGN,
      unassignmentData
    );
  }
}
