import { AccessToken } from '../value-objects/access-token.vo';
import { RefreshToken } from '../value-objects/refresh-token.vo';
import { User } from './user.entity';
import { ValidationError } from './validation-error';
import { ValidationErrorCode } from '../enums/validation-error-code.enum';

export class Session {
    private readonly _user: User;
    private readonly _access: AccessToken;
    private readonly _refresh: RefreshToken;

    private constructor(user: User, access: AccessToken, refresh: RefreshToken) {
        this._user = user;
        this._access = access;
        this._refresh = refresh;
    }

    static create(p: { user: User; access: AccessToken; refresh: RefreshToken }) {
        return new Session(p.user, p.access, p.refresh);
    }

    get user(): User {
        return this._user;
    }

    get access(): AccessToken {
        return this._access;
    }

    get refresh(): RefreshToken {
        return this._refresh;
    }

    /**
     * Indica si el access token está expirado
     */
    get isAccessTokenExpired(): boolean {
        return this._access.exp ? this._access.exp < Date.now() / 1000 : false;
    }

    /**
     * Indica si el refresh token es válido (no vacío)
     */
    get isRefreshTokenValid(): boolean {
        return !!this._refresh.value && this._refresh.value.length > 0;
    }

    /**
     * Devuelve los segundos restantes antes de expirar el access token
     */
    get expiresInSeconds(): number | null {
        return this._access.exp ? this._access.exp - Date.now() / 1000 : null;
    }

    /**
     * Valida la sesión y lanza ValidationError si hay problemas
     */
    validate(): void {
        if (!this._user) {
            throw new ValidationError(
                'Usuario no presente en sesión',
                ValidationErrorCode.USER_NOT_FOUND
            );
        }
        if (!this._access.value || this._access.value.length === 0) {
            throw new ValidationError(
                'Access token vacío',
                ValidationErrorCode.ACCESS_TOKEN_INVALID
            );
        }
        if (this.isAccessTokenExpired) {
            throw new ValidationError(
                'Access token expirado',
                ValidationErrorCode.ACCESS_TOKEN_EXPIRED
            );
        }
        if (!this.isRefreshTokenValid) {
            throw new ValidationError(
                'Refresh token inválido',
                ValidationErrorCode.REFRESH_TOKEN_INVALID
            );
        }
    }
}
