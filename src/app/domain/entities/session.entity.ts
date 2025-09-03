import { User } from './user.entity';
import { AccessToken, RefreshToken } from '@domain/value-objects/local-tokens.vo';
import { ValidationError } from '@domain/errors/validation-error.entity';
import { ValidationErrorCode } from '@domain/errors/validation-error-code.enum';
import type { FieldError } from '@domain/errors/field-error.type';
import { DomainEvent } from '@domain/events/domain-event.entity';
import { DomainEventType } from '../events/domain-event.enum';
import { ISODateTime } from '@domain/value-objects/iso-datetime.vo';
import { TokenExpirationSpec } from '@domain/specifications/token-expiration.specs';
import { TokenSecuritySpec } from '@domain/specifications/token-security.specs';
import { DateTimeBusinessRules } from '@domain/specifications/datetime-business-rules.specs';
import { TokenSecurityLevel } from '@domain/enums/token-security.enum';

export class Session {
  private _domainEvents: DomainEvent[] = [];

  private constructor(
    private readonly _user: User,
    private readonly _access: AccessToken,
    private readonly _refresh: RefreshToken,
    private readonly _createdAt: ISODateTime = ISODateTime.now()
  ) {
    // Evento de autenticación exitosa cuando se crea la sesión
    this.addDomainEvent(
      DomainEvent.create({
        id: `session-authenticated-${this._user.id}-${Date.now()}`,
        eventType: DomainEventType.USER_AUTHENTICATED,
        aggregateId: `session-${this._user.id}`,
        aggregateType: 'Session',
        eventData: {
          userId: this._user.id,
          userEmail: this._user.email,
          username: this._user.username,
          accessTokenExpires: this._access.expSeconds,
          sessionCreatedAt: this._createdAt.value,
        },
        causedByUserId: this._user.id.toString(),
        occurredAt: this._createdAt,
      })
    );
  }

  static create(p: { user: User; access: AccessToken; refresh: RefreshToken }): Session {
    const missingFields: string[] = [];
    if (!p.user) missingFields.push('user');
    if (!p.access) missingFields.push('access');
    if (!p.refresh) missingFields.push('refresh');

    if (missingFields.length > 0) {
      throw ValidationError.forMissingRequiredFields(missingFields);
    }

    // Business Rule Validations using Specifications
    const errors: FieldError[] = [];

    // 1. Token Security Validation - Ensure tokens meet security requirements
    try {
      TokenSecuritySpec.assertMinimumSecurity(p.access, TokenSecurityLevel.MEDIUM);
    } catch {
      errors.push({
        field: 'accessToken',
        value: '[redacted]',
        message: 'Access token does not meet minimum security requirements',
        code: ValidationErrorCode.PERMISSION_DENIED,
      });
    }

    // 2. Token Expiration Validation - Ensure tokens are not already expired
    try {
      const nowEpoch = Math.floor(Date.now() / 1000);
      if (TokenExpirationSpec.isExpired(p.access, nowEpoch)) {
        errors.push({
          field: 'accessToken',
          value: '[redacted]',
          message: 'Access token is already expired',
          code: ValidationErrorCode.ENTITY_EXPIRED,
        });
      }
    } catch {
      errors.push({
        field: 'accessToken',
        value: '[redacted]',
        message: 'Access token expiration validation failed',
        code: ValidationErrorCode.VALIDATION_ERROR,
      });
    }

    // 3. Business Hours Validation - Check if session creation is within business hours
    try {
      const now = ISODateTime.now();
      if (!DateTimeBusinessRules.isWithinBusinessHours(now, 6, 22)) {
        // 6 AM to 10 PM
        errors.push({
          field: 'session',
          value: now.value,
          message: 'Session creation is outside business hours',
          code: ValidationErrorCode.PERMISSION_DENIED,
        });
      }
    } catch (error) {
      // If business hours validation fails, we don't block creation but log it
      console.warn('Business hours validation failed:', error);
    }

    // 4. User Status Validation - Ensure user is active and can have sessions
    try {
      if (!p.user.active) {
        errors.push({
          field: 'user',
          value: p.user.id.toString(),
          message: 'Cannot create session for inactive user',
          code: ValidationErrorCode.INVALID_STATE,
        });
      }
    } catch {
      errors.push({
        field: 'user',
        value: p.user.id.toString(),
        message: 'User status validation failed',
        code: ValidationErrorCode.VALIDATION_ERROR,
      });
    }

    if (errors.length > 0) {
      throw ValidationError.createFromFields(errors, ValidationErrorCode.VALIDATION_ERROR);
    }

    return new Session(p.user, p.access, p.refresh);
  }

  // --- Domain Events Management ---

  /**
   * Agrega un evento de dominio a la cola de eventos
   */
  private addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  /**
   * Obtiene todos los eventos de dominio pendientes
   */
  getDomainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  /**
   * Limpia los eventos de dominio después de ser procesados
   */
  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  /**
   * Termina la sesión por logout del usuario
   */
  terminate(reason: 'user_logout' | 'admin_action' = 'user_logout'): void {
    const now = ISODateTime.now();

    this.addDomainEvent(
      DomainEvent.create({
        id: `session-terminated-${this._user.id}-${Date.now()}`,
        eventType: DomainEventType.SESSION_TERMINATED,
        aggregateId: `session-${this._user.id}`,
        aggregateType: 'Session',
        eventData: {
          userId: this._user.id,
          terminationReason: reason,
          sessionDuration: now.toDate().getTime() - this._createdAt.toDate().getTime(),
          terminatedAt: now.value,
        },
        causedByUserId: this._user.id.toString(),
        occurredAt: now,
      })
    );
  }

  /**
   * Marca la sesión como expirada
   */
  markAsExpired(nowEpochSeconds: number): void {
    const now = ISODateTime.now();

    this.addDomainEvent(
      DomainEvent.create({
        id: `session-expired-${this._user.id}-${Date.now()}`,
        eventType: DomainEventType.USER_SESSION_EXPIRED,
        aggregateId: `session-${this._user.id}`,
        aggregateType: 'Session',
        eventData: {
          userId: this._user.id,
          expiredAt: now.value,
          accessTokenExpiry: this._access.expSeconds,
          currentTimestamp: nowEpochSeconds,
          sessionDuration: now.toDate().getTime() - this._createdAt.toDate().getTime(),
        },
        causedByUserId: this._user.id.toString(),
        occurredAt: now,
      })
    );
  }

  /**
   * Registra un intento de acceso no autorizado
   */
  recordUnauthorizedAccess(
    details: {
      attemptedAction?: string;
      ipAddress?: string;
      userAgent?: string;
      reason?: string;
    } = {}
  ): void {
    const now = ISODateTime.now();

    this.addDomainEvent(
      DomainEvent.create({
        id: `unauthorized-access-${this._user.id}-${Date.now()}`,
        eventType: DomainEventType.UNAUTHORIZED_ACCESS_ATTEMPTED,
        aggregateId: `session-${this._user.id}`,
        aggregateType: 'Session',
        eventData: {
          userId: this._user.id,
          attemptedAction: details.attemptedAction || 'unknown',
          ipAddress: details.ipAddress,
          userAgent: details.userAgent,
          reason: details.reason || 'Token expired or invalid',
          detectedAt: now.value,
        },
        causedByUserId: this._user.id.toString(),
        occurredAt: now,
      })
    );
  }

  /**
   * Registra una violación de seguridad
   */
  recordSecurityViolation(violationType: string, details: Record<string, unknown> = {}): void {
    const now = ISODateTime.now();

    this.addDomainEvent(
      DomainEvent.create({
        id: `security-violation-${this._user.id}-${Date.now()}`,
        eventType: DomainEventType.SECURITY_VIOLATION_DETECTED,
        aggregateId: `session-${this._user.id}`,
        aggregateType: 'Session',
        eventData: {
          userId: this._user.id,
          violationType,
          details,
          detectedAt: now.value,
          securityLevel: 'critical',
        },
        causedByUserId: this._user.id.toString(),
        occurredAt: now,
      })
    );
  }

  // --- Getters ---
  get user(): User {
    return this._user;
  }

  get access(): AccessToken {
    return this._access;
  }

  get refresh(): RefreshToken {
    return this._refresh;
  }

  get createdAt(): ISODateTime {
    return this._createdAt;
  }

  // --- Reglas/consultas de dominio (dependen del tiempo externo) ---
  isAccessTokenExpired(nowEpochSeconds: number): boolean {
    const isExpired = TokenExpirationSpec.isExpired(this._access, nowEpochSeconds);

    // Si el token está expirado y no hemos registrado el evento, lo registramos
    if (isExpired) {
      // Solo registramos si no hay eventos de expiración recientes para evitar spam
      const hasRecentExpirationEvent = this._domainEvents.some(
        (event) =>
          event.eventType === DomainEventType.USER_SESSION_EXPIRED &&
          Date.now() - event.occurredAt.toDate().getTime() < 60000 // Último minuto
      );

      if (!hasRecentExpirationEvent) {
        this.markAsExpired(nowEpochSeconds);
      }
    }

    return isExpired;
  }

  expiresInSeconds(nowEpochSeconds: number): number | null {
    const exp = this._access.expSeconds;
    return typeof exp === 'number' ? exp - nowEpochSeconds : null;
  }

  /**
   * Valida la sesión con respecto al tiempo actual.
   * Agrega errores de dominio (no de infraestructura).
   * - Requiere user
   * - Verifica expiración del access token usando specifications
   * - Verifica seguridad del token usando specifications
   * - Verifica sesión inactiva por tiempo usando business rules
   * - Verifica "presencia mínima" del refresh token (el VO ya valida longitud mínima)
   */
  validate(nowEpochSeconds: number): void {
    const errors: FieldError[] = [];

    // Check for required fields - though this should never happen in a constructed Session
    if (!this._user) {
      errors.push({
        field: 'user',
        value: '[missing]',
        message: 'Session user is required',
        code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
      });
    }

    // Check token expiration using specifications
    if (this.isAccessTokenExpired(nowEpochSeconds)) {
      errors.push({
        field: 'accessToken',
        value: '[redacted]',
        message: 'Access token has expired',
        code: ValidationErrorCode.ENTITY_EXPIRED,
      });
    }

    // Validate token security using specifications
    try {
      TokenSecuritySpec.assertMinimumSecurity(this._access, TokenSecurityLevel.MEDIUM);
    } catch {
      errors.push({
        field: 'accessToken',
        value: '[redacted]',
        message: 'Access token does not meet security requirements',
        code: ValidationErrorCode.PERMISSION_DENIED,
      });
    }

    // Validate session inactivity using business rules
    try {
      const now = ISODateTime.now();
      const sessionAgeHours =
        (now.toDate().getTime() - this._createdAt.toDate().getTime()) / (1000 * 60 * 60);

      // Business rule: Sessions inactive for more than 8 hours should be terminated
      if (sessionAgeHours > 8) {
        errors.push({
          field: 'session',
          value: sessionAgeHours.toFixed(2),
          message: 'Session has been inactive for too long',
          code: ValidationErrorCode.ENTITY_EXPIRED,
        });
      }
    } catch (error) {
      console.warn('Session inactivity validation failed:', error);
    }

    // Validate refresh token format (not re-creating, just checking validity)
    try {
      RefreshToken.create(this._refresh.getValue());
    } catch {
      errors.push({
        field: 'refreshToken',
        value: '[redacted]',
        message: 'Refresh token format is invalid',
        code: ValidationErrorCode.INVALID_FORMAT,
      });
    }

    if (errors.length) {
      throw ValidationError.createFromFields(errors, ValidationErrorCode.VALIDATION_ERROR);
    }
  }

  /**
   * Valida si la sesión debe renovarse usando business rules
   * Business rule: Sesiones deben renovarse antes de expirar
   */
  shouldRenew(nowEpochSeconds: number): boolean {
    try {
      const expiresInSeconds = this.expiresInSeconds(nowEpochSeconds);
      if (expiresInSeconds === null) return false;

      // Business rule: Renew if expires in less than 15 minutes
      return expiresInSeconds < 900; // 15 minutes
    } catch (error) {
      console.warn('Session renewal validation failed:', error);
      return false;
    }
  }

  /**
   * Valida si la sesión está dentro de horas de negocio
   * Business rule: Algunas operaciones pueden estar restringidas fuera de horario
   */
  isWithinBusinessHours(): boolean {
    try {
      return DateTimeBusinessRules.isWithinBusinessHours(this._createdAt, 6, 22);
    } catch (error) {
      console.warn('Business hours validation failed:', error);
      return true; // Default to allowed if validation fails
    }
  }
}
