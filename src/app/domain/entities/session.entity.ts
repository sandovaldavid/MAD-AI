/**
 * Domain Session Entity - Simplified Version
 *
 * @description
 * Representación simplificada de una sesión en el dominio.
 * Se eliminó la sobreingeniería y se mantuvieron solo los invariantes críticos.
 */

import { User } from './user.entity';
import { AccessToken, RefreshToken } from '../value-objects/local-tokens.vo';
import { ValidationError } from '../errors/validation-error.entity';
import { ValidationErrorCode } from '../errors/validation-error-code.enum';
import { ISODateTime } from '../value-objects/iso-datetime.vo';

export type SessionId = string;

/**
 * Entidad Session simplificada
 */
export class Session {
  private constructor(
    private readonly _id: SessionId,
    private readonly _user: User,
    private readonly _accessToken: AccessToken,
    private readonly _refreshToken: RefreshToken,
    private readonly _createdAt: ISODateTime
  ) {}

  /**
   * Factory method simplificado - Solo invariantes críticos
   */
  static create(params: {
    id: SessionId;
    user: User;
    accessToken: AccessToken;
    refreshToken: RefreshToken;
  }): Session {
    // Solo validaciones de invariantes críticos
    if (!params.id?.trim()) {
      throw ValidationError.createFromFields(
        [
          {
            field: 'id',
            value: params.id,
            message: 'Session ID is required',
            code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
          },
        ],
        ValidationErrorCode.VALIDATION_ERROR
      );
    }

    if (!params.user) {
      throw ValidationError.createFromFields(
        [
          {
            field: 'user',
            value: '[missing]',
            message: 'User is required',
            code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
          },
        ],
        ValidationErrorCode.VALIDATION_ERROR
      );
    }

    if (!params.accessToken) {
      throw ValidationError.createFromFields(
        [
          {
            field: 'accessToken',
            value: '[missing]',
            message: 'Access token is required',
            code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
          },
        ],
        ValidationErrorCode.VALIDATION_ERROR
      );
    }

    if (!params.refreshToken) {
      throw ValidationError.createFromFields(
        [
          {
            field: 'refreshToken',
            value: '[missing]',
            message: 'Refresh token is required',
            code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
          },
        ],
        ValidationErrorCode.VALIDATION_ERROR
      );
    }

    return new Session(
      params.id,
      params.user,
      params.accessToken,
      params.refreshToken,
      ISODateTime.now()
    );
  }

  // Getters esenciales
  get id(): SessionId {
    return this._id;
  }
  get user(): User {
    return this._user;
  }
  get accessToken(): AccessToken {
    return this._accessToken;
  }
  get refreshToken(): RefreshToken {
    return this._refreshToken;
  }
  get createdAt(): ISODateTime {
    return this._createdAt;
  }

  /**
   * Método de negocio simple - Verifica si la sesión es válida
   */
  isValid(currentEpochSeconds: number): boolean {
    // Verificamos si el token tiene tiempo de expiración y si no ha expirado
    if (this._accessToken.expSeconds !== undefined) {
      return currentEpochSeconds < this._accessToken.expSeconds;
    }
    // Si no tiene tiempo de expiración, consideramos que es válido
    return true;
  }

  /**
   * Convierte a objeto plano
   */
  toPlainObject(): {
    id: string;
    userId: string;
    accessToken: string;
    refreshToken: string;
    createdAt: string;
  } {
    return {
      id: this._id,
      userId: this._user.id.toString(),
      accessToken: this._accessToken.getValue(),
      refreshToken: this._refreshToken.getValue(),
      createdAt: this._createdAt.value,
    };
  }

  /**
   * Compara sesiones por ID
   */
  equals(other: Session | null | undefined): boolean {
    return !!other && this._id === other._id;
  }
}
