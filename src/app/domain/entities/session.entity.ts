import { User } from './user.entity';
import { AccessToken, RefreshToken } from '@domain/value-objects/local-tokens.vo';
import { ValidationError } from '@domain/errors/validation-error.entity';
import { ValidationErrorCode } from '@domain/errors/validation-error-code.enum';
import type { FieldError } from '@domain/errors/field-error.type';
import { DomainEvent, DomainEventType } from '@domain/events/domain-event.entity';
import { ISODateTime } from '@domain/value-objects/iso-datetime.vo';
import { TokenExpirationSpec } from '@domain/specifications/token-expiration.specs';

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
    if (!p.user) {
      throw ValidationError.create({
        field: 'user',
        value: p.user,
        message: 'User is required',
        code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
      });
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
        eventType: DomainEventType.SESSION_EXPIRED,
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
  recordSecurityViolation(violationType: string, details: Record<string, any> = {}): void {
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
          event.eventType === DomainEventType.SESSION_EXPIRED &&
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
   * - Verifica expiración del access token
   * - Verifica "presencia mínima" del refresh token (el VO ya valida longitud mínima)
   */
  validate(nowEpochSeconds: number): void {
    const errors: FieldError[] = [];

    if (!this._user) {
      errors.push({
        field: 'user',
        value: this._user,
        message: 'User is required',
        code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
      });
    }

    if (this.isAccessTokenExpired(nowEpochSeconds)) {
      errors.push({
        field: 'accessToken',
        value: '[redacted]',
        message: 'Access token expired',
        code: ValidationErrorCode.VALIDATION_ERROR,
      });
    }

    if (!RefreshToken.create(this._refresh.getValue())) {
      errors.push({
        field: 'refreshToken',
        value: '[redacted]',
        message: 'Refresh token is invalid',
        code: ValidationErrorCode.VALIDATION_ERROR,
      });
    }

    if (errors.length) {
      throw ValidationError.createFromFields(errors, ValidationErrorCode.VALIDATION_ERROR);
    }
  }
}
