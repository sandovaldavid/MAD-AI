import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS_V1 } from '../../config/api-endpoints.config';
import {
  LoginRequestDTO,
  LoginResponseDTO,
  MeResponseDTO,
  RefreshRequestDTO,
  RefreshResponseDTO,
  LogoutRequestDTO,
  LogoutResponseDTO,
  ConfirmEmailResponseDTO,
  RegisterRequestDTO,
  RegisterResponseDTO,
  ResetPasswordRequestDTO,
  ResetPasswordResponseDTO,
  ResetPasswordConfirmRequestDTO,
  ResetPasswordConfirmResponseDTO,
} from '../../dtos/auth';

/**
 * Auth API Client - Infrastructure Layer
 *
 * Cliente HTTP puro para operaciones de autenticación.
 * Encapsula todas las llamadas HTTP relacionadas con autenticación
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
 * export class HttpAuthRepository implements AuthRepository {
 *   constructor(private authClient: AuthApiClient) {}
 *
 *   async login(credentials: CredentialsContract): Promise<Session> {
 *     const response = await firstValueFrom(this.authClient.login(credentials));
 *     // Transform response to domain entities
 *   }
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class AuthApiClient {
  private readonly http = inject(HttpClient);

  /**
   * Realiza login de usuario
   *
   * @param credentials - Credenciales de login
   * @returns Observable con respuesta de login
   */
  login(credentials: LoginRequestDTO): Observable<LoginResponseDTO> {
    return this.http.post<LoginResponseDTO>(API_ENDPOINTS_V1.AUTH.LOGIN, credentials);
  }

  /**
   * Obtiene información del usuario actual
   *
   * @returns Observable con información del usuario
   */
  me(): Observable<MeResponseDTO> {
    return this.http.get<MeResponseDTO>(API_ENDPOINTS_V1.AUTH.ME);
  }

  /**
   * Refresca el token de acceso
   *
   * @param refreshData - Datos para refresh token
   * @returns Observable con nuevos tokens
   */
  refresh(refreshData: RefreshRequestDTO): Observable<RefreshResponseDTO> {
    return this.http.post<RefreshResponseDTO>(API_ENDPOINTS_V1.AUTH.REFRESH, refreshData);
  }

  /**
   * Realiza logout del usuario
   *
   * @param logoutData - Datos para logout
   * @returns Observable con respuesta de logout
   */
  logout(logoutData: LogoutRequestDTO): Observable<LogoutResponseDTO> {
    return this.http.post<LogoutResponseDTO>(API_ENDPOINTS_V1.AUTH.LOGOUT, logoutData);
  }

  /**
   * Registra un nuevo usuario
   *
   * @param registrationData - Datos de registro
   * @returns Observable con respuesta de registro
   */
  register(registrationData: RegisterRequestDTO): Observable<RegisterResponseDTO> {
    return this.http.post<RegisterResponseDTO>(API_ENDPOINTS_V1.AUTH.REGISTER, registrationData);
  }

  /**
   * Confirma email con token
   *
   * @param token - Token de confirmación
   * @returns Observable con respuesta de confirmación
   */
  confirmEmail(token: string): Observable<ConfirmEmailResponseDTO> {
    return this.http.post<ConfirmEmailResponseDTO>(API_ENDPOINTS_V1.AUTH.CONFIRM_EMAIL, { token });
  }

  /**
   * Solicita reset de contraseña
   *
   * @param resetData - Datos para solicitud de reset
   * @returns Observable con respuesta de solicitud
   */
  requestPasswordReset(resetData: ResetPasswordRequestDTO): Observable<ResetPasswordResponseDTO> {
    return this.http.post<ResetPasswordResponseDTO>(
      API_ENDPOINTS_V1.AUTH.RESET_PASSWORD,
      resetData
    );
  }

  /**
   * Confirma reset de contraseña
   *
   * @param confirmData - Datos para confirmar reset
   * @returns Observable con respuesta de confirmación
   */
  confirmPasswordReset(
    confirmData: ResetPasswordConfirmRequestDTO
  ): Observable<ResetPasswordConfirmResponseDTO> {
    return this.http.post<ResetPasswordConfirmResponseDTO>(
      API_ENDPOINTS_V1.AUTH.RESET_PASSWORD_CONFIRM,
      confirmData
    );
  }
}
