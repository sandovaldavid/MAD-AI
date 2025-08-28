import { ValidationError } from '@domain/errors/validation-error.entity';
import { TokenLength } from '../enums/token-length.enum';
import { FieldError } from '../errors/field-error.type';
import { ValidationErrorCode } from '../errors/validation-error-code.enum';

export class AccessToken {
  private constructor(
    public readonly value: string,
    public readonly expSeconds?: number
  ) {}

  static create(value: string, expSeconds?: number): AccessToken {
    const errors: FieldError[] = [];
    if (!value || typeof value !== 'string' || !value.trim()) {
      errors.push({
        field: 'accessToken',
        value,
        message: 'Access token is required',
        code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
      });
    } else {
      const trimmed = value.trim();
      if (trimmed.length < TokenLength.ACCESS_TOKEN_MIN) {
        errors.push({
          field: 'accessToken',
          value: trimmed,
          message: `Must be at least ${TokenLength.ACCESS_TOKEN_MIN} chars`,
          code: ValidationErrorCode.FIELD_TOO_SHORT,
        });
      }
      if (trimmed.length > TokenLength.ACCESS_TOKEN_MAX) {
        errors.push({
          field: 'accessToken',
          value: trimmed,
          message: `Must be at most ${TokenLength.ACCESS_TOKEN_MAX} chars`,
          code: ValidationErrorCode.FIELD_TOO_LONG,
        });
      }
      // Validar caracteres permitidos (alfanuméricos, guiones, puntos, guiones bajos)
      if (!/^[A-Za-z0-9._-]+$/.test(trimmed)) {
        errors.push({
          field: 'accessToken',
          value: trimmed,
          message: 'Access token contains invalid characters',
          code: ValidationErrorCode.INVALID_FORMAT,
        });
      }
    }
    // Validar tiempo de expiración si se proporciona
    if (expSeconds !== undefined) {
      if (typeof expSeconds !== 'number' || expSeconds < 0) {
        errors.push({
          field: 'expSeconds',
          value: expSeconds,
          message: 'Expiration seconds must be a non-negative number',
          code: ValidationErrorCode.INVALID_FORMAT,
        });
      } else if (!Number.isInteger(expSeconds)) {
        errors.push({
          field: 'expSeconds',
          value: expSeconds,
          message: 'Expiration seconds must be an integer',
          code: ValidationErrorCode.INVALID_FORMAT,
        });
      } else if (expSeconds > 4102444800) {
        // año 2100 aprox
        errors.push({
          field: 'expSeconds',
          value: expSeconds,
          message: 'Expiration date cannot be beyond year 2100',
          code: ValidationErrorCode.INVALID_FORMAT,
        });
      }
    }

    if (errors.length > 0)
      throw ValidationError.createFromFields(errors, ValidationErrorCode.VALIDATION_ERROR);
    return new AccessToken(value.trim(), expSeconds);
  }

  /**
   * Obtiene el valor del token
   */
  getValue(): string {
    return this.value;
  }

  equals(other: AccessToken): boolean {
    return this.value === other.value && this.expSeconds === other.expSeconds;
  }
}

export class RefreshToken {
  private constructor(private readonly value: string) {}

  static create(value: string): RefreshToken {
    const errors: FieldError[] = [];

    if (!value || typeof value !== 'string' || !value.trim()) {
      errors.push({
        field: 'refreshToken',
        value,
        message: 'Refresh token is required',
        code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
      });
    } else {
      const trimmed = value.trim();

      if (trimmed.length < TokenLength.REFRESH_TOKEN_MIN) {
        errors.push({
          field: 'refreshToken',
          value: trimmed,
          message: `Must be at least ${TokenLength.REFRESH_TOKEN_MIN} chars`,
          code: ValidationErrorCode.FIELD_TOO_SHORT,
        });
      }

      if (trimmed.length > TokenLength.REFRESH_TOKEN_MAX) {
        errors.push({
          field: 'refreshToken',
          value: trimmed,
          message: `Must be at most ${TokenLength.REFRESH_TOKEN_MAX} chars`,
          code: ValidationErrorCode.FIELD_TOO_LONG,
        });
      }

      // Validar caracteres permitidos (alfanuméricos, guiones, puntos, guiones bajos, slash, más)
      if (!/^[A-Za-z0-9._+-/=]+$/.test(trimmed)) {
        errors.push({
          field: 'refreshToken',
          value: trimmed,
          message: 'Refresh token contains invalid characters',
          code: ValidationErrorCode.INVALID_FORMAT,
        });
      }
    }

    if (errors.length > 0)
      throw ValidationError.createFromFields(errors, ValidationErrorCode.VALIDATION_ERROR);
    return new RefreshToken(value.trim());
  }

  getValue(): string {
    return this.value;
  }
}

export class TokenPair {
  constructor(
    public readonly accessToken: AccessToken,
    public readonly refreshToken: RefreshToken
  ) {
    if (!accessToken) {
      throw new Error('AccessToken is required');
    }
    if (!refreshToken) {
      throw new Error('RefreshToken is required');
    }
  }

  /**
   * Compara dos pares de tokens por valor
   */
  equals(other: TokenPair): boolean {
    return (
      this.accessToken.equals(other.accessToken) &&
      this.refreshToken.getValue() === other.refreshToken.getValue()
    );
  }
}
