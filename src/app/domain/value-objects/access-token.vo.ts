import { ValidationError } from '../entities/validation-error';
import { ValidationErrorCode } from '../enums/validation-error-code.enum';

export class AccessToken {
    private constructor(public readonly value: string, public readonly exp?: number) {}

    static create(value: string, exp?: number) {
        if (!value?.length) {
            throw new ValidationError(
                'Access token vacío',
                ValidationErrorCode.ACCESS_TOKEN_INVALID
            );
        }
        // Validación básica de formato JWT (3 partes separadas por punto)
        if (value.split('.').length !== 3) {
            throw new ValidationError(
                'Formato de access token inválido',
                ValidationErrorCode.ACCESS_TOKEN_INVALID
            );
        }
        return new AccessToken(value, exp);
    }

    isExpired(): boolean {
        return this.exp ? this.exp < Date.now() / 1000 : false;
    }

    isValid(): boolean {
        return !!this.value && (!this.exp || this.exp > Date.now() / 1000);
    }
}
