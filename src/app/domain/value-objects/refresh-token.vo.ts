import { ValidationError } from '../entities/validation-error';
import { ValidationErrorCode } from '../enums/validation-error-code.enum';

export class RefreshToken {
    private constructor(public readonly value: string) {}

    static create(value: string) {
        if (!value?.length) {
            throw new ValidationError(
                'Refresh token vacío',
                ValidationErrorCode.REFRESH_TOKEN_INVALID
            );
        }
        // Validación de longitud mínima (ejemplo: 20 caracteres)
        if (value.length < 20) {
            throw new ValidationError(
                'Refresh token demasiado corto',
                ValidationErrorCode.REFRESH_TOKEN_INVALID
            );
        }
        return new RefreshToken(value);
    }

    isValid(): boolean {
        return !!this.value && this.value.length >= 20;
    }
}
