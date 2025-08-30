import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS_V1 } from '@infrastructure/config/api-endpoints.config';
import {
  ListUsersResponseDTO,
  CreateUserRequestDTO,
  CreateUserResponseDTO,
  UpdateUserRequestDTO,
  UpdateUserResponseDTO,
  UserDetailResponseDTO,
  ChangePasswordRequestDTO,
  ChangePasswordResponseDTO,
  DeactivateUserResponseDTO,
} from '@infrastructure/dtos/user';

/**
 * User API Client - Infrastructure Layer
 *
 * Cliente HTTP puro para operaciones de gestión de usuarios.
 * Encapsula todas las llamadas HTTP relacionadas con usuarios
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
 * export class HttpUserRepository implements UserRepository {
 *   constructor(private userClient: UserApiClient) {}
 *
 *   async getById(id: number): Promise<User> {
 *     const response = await firstValueFrom(this.userClient.getById(id));
 *     // Transform response to domain entity
 *   }
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class UserApiClient {
  private readonly http = inject(HttpClient);

  /**
   * Lista usuarios con filtros y paginación
   *
   * @param filters - Filtros opcionales para la consulta
   * @returns Observable con lista de usuarios
   */
  list(filters?: {
    search?: string;
    status?: string;
    role_id?: number;
    limit?: number;
    offset?: number;
  }): Observable<ListUsersResponseDTO> {
    let params = new HttpParams();

    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.role_id) params = params.set('role_id', filters.role_id.toString());
    if (filters?.limit) params = params.set('limit', filters.limit.toString());
    if (filters?.offset) params = params.set('offset', filters.offset.toString());

    return this.http.get<ListUsersResponseDTO>(API_ENDPOINTS_V1.USERS.LIST, { params });
  }

  /**
   * Obtiene usuario por ID
   *
   * @param id - ID del usuario
   * @returns Observable con detalle del usuario
   */
  getById(id: number): Observable<UserDetailResponseDTO> {
    return this.http.get<UserDetailResponseDTO>(API_ENDPOINTS_V1.USERS.DETAIL(id));
  }

  /**
   * Busca usuario por email
   * Nota: Este endpoint podría no estar disponible en la API actual
   *
   * @param email - Email del usuario
   * @returns Observable con usuario encontrado
   */
  getByEmail(email: string): Observable<UserDetailResponseDTO> {
    // Este método requiere que el endpoint esté disponible
    // Por ahora, usaremos la lista filtrada como alternativa
    const params = new HttpParams().set('email', email);
    return this.http.get<UserDetailResponseDTO>(API_ENDPOINTS_V1.USERS.LIST, { params });
  }

  /**
   * Busca usuario por username
   * Nota: Este endpoint podría no estar disponible en la API actual
   *
   * @param username - Username del usuario
   * @returns Observable con usuario encontrado
   */
  getByUsername(username: string): Observable<UserDetailResponseDTO> {
    // Este método requiere que el endpoint esté disponible
    // Por ahora, usaremos la lista filtrada como alternativa
    const params = new HttpParams().set('username', username);
    return this.http.get<UserDetailResponseDTO>(API_ENDPOINTS_V1.USERS.LIST, { params });
  }

  /**
   * Crea un nuevo usuario
   *
   * @param userData - Datos del usuario a crear
   * @returns Observable con usuario creado
   */
  create(userData: CreateUserRequestDTO): Observable<CreateUserResponseDTO> {
    return this.http.post<CreateUserResponseDTO>(API_ENDPOINTS_V1.USERS.CREATE, userData);
  }

  /**
   * Actualiza un usuario existente
   *
   * @param id - ID del usuario
   * @param userData - Datos a actualizar
   * @returns Observable con usuario actualizado
   */
  update(id: number, userData: UpdateUserRequestDTO): Observable<UpdateUserResponseDTO> {
    return this.http.put<UpdateUserResponseDTO>(API_ENDPOINTS_V1.USERS.UPDATE(id), userData);
  }

  /**
   * Elimina un usuario
   *
   * @param id - ID del usuario a eliminar
   * @returns Observable vacío
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(API_ENDPOINTS_V1.USERS.DELETE(id));
  }

  /**
   * Activa un usuario
   *
   * @param id - ID del usuario
   * @returns Observable con respuesta de activación
   */
  activate(id: number): Observable<DeactivateUserResponseDTO> {
    return this.http.post<DeactivateUserResponseDTO>(API_ENDPOINTS_V1.USERS.ACTIVATE(id), {});
  }

  /**
   * Desactiva un usuario
   *
   * @param id - ID del usuario
   * @returns Observable con respuesta de desactivación
   */
  deactivate(id: number): Observable<DeactivateUserResponseDTO> {
    return this.http.post<DeactivateUserResponseDTO>(API_ENDPOINTS_V1.USERS.DEACTIVATE(id), {});
  }

  /**
   * Cambia la contraseña de un usuario
   *
   * @param passwordData - Datos del cambio de contraseña
   * @returns Observable con respuesta del cambio
   */
  changePassword(passwordData: ChangePasswordRequestDTO): Observable<ChangePasswordResponseDTO> {
    return this.http.post<ChangePasswordResponseDTO>(
      API_ENDPOINTS_V1.USERS.CHANGE_PASSWORD,
      passwordData
    );
  }

  /**
   * Cambia el rol de un usuario
   *
   * @param userId - ID del usuario
   * @param roleId - ID del nuevo rol
   * @returns Observable vacío
   */
  changeRole(userId: number, roleId: number): Observable<void> {
    return this.http.post<void>(API_ENDPOINTS_V1.USERS.CHANGE_ROLE(userId), { role_id: roleId });
  }
}
