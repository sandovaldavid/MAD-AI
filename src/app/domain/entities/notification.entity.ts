/**
 * Domain Notification Entity
 *
 * @description
 * Representación simplificada de una notificación en el dominio.
 * Se eliminó la sobreingeniería y se mantuvieron solo las características esenciales.
 */

import { ValidationError } from '../errors/validation-error.entity';
import { ValidationErrorCode } from '../errors/validation-error-code.enum';
import type { FieldError } from '../errors/field-error.type';

export type NotificationId = string;

/**
 * Tipos de notificación disponibles
 */
export enum NotificationType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
}

/**
 * Canales de notificación disponibles
 */
export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
}

/**
 * Especificación para crear nuevas notificaciones
 */
export interface NewNotification {
  readonly type: NotificationType;
  readonly message: string;
  readonly title?: string;
  readonly userId?: string;
  readonly channel?: NotificationChannel;
}

/**
 * Entidad Notification simplificada
 */
export class Notification {
  private constructor(
    private readonly _id: NotificationId,
    private readonly _type: NotificationType,
    private readonly _message: string,
    private readonly _title: string | undefined,
    private readonly _userId: string | undefined,
    private readonly _channel: NotificationChannel,
    private readonly _createdAt: Date,
    private _isRead = false,
    private _readAt?: Date
  ) {}

  /**
   * Factory method simplificado
   */
  static create(props: NewNotification): Notification {
    return Notification.createWithId(props);
  }

  /**
   * Factory method que permite especificar un ID (para uso interno)
   */
  static createWithId(props: NewNotification, customId?: NotificationId): Notification {
    const errors: FieldError[] = [];

    // Validaciones básicas únicamente
    if (!props.message?.trim()) {
      errors.push({
        field: 'message',
        value: props.message,
        message: 'Message is required',
        code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
      });
    }

    if (props.message && props.message.length > 500) {
      errors.push({
        field: 'message',
        value: props.message,
        message: 'Message must be less than 500 characters',
        code: ValidationErrorCode.FIELD_TOO_LONG,
      });
    }

    if (errors.length > 0) {
      throw ValidationError.createFromFields(errors, ValidationErrorCode.VALIDATION_ERROR);
    }

    const id = customId ?? Math.random().toString(36).substring(2);
    const createdAt = new Date();

    return new Notification(
      id,
      props.type,
      props.message.trim(),
      props.title?.trim(),
      props.userId,
      props.channel ?? NotificationChannel.IN_APP,
      createdAt
    );
  }

  // Getters esenciales
  get id(): string {
    return this._id;
  }
  get type(): NotificationType {
    return this._type;
  }
  get message(): string {
    return this._message;
  }
  get title(): string | undefined {
    return this._title;
  }
  get userId(): string | undefined {
    return this._userId;
  }
  get channel(): NotificationChannel {
    return this._channel;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get isRead(): boolean {
    return this._isRead;
  }
  get readAt(): Date | undefined {
    return this._readAt;
  }

  /**
   * Marca la notificación como leída
   */
  markAsRead(): void {
    if (!this._isRead) {
      this._isRead = true;
      this._readAt = new Date();
    }
  }

  /**
   * Verifica si es una notificación del sistema
   */
  isSystemNotification(): boolean {
    return this._userId === undefined;
  }

  /**
   * Convierte a objeto plano
   */
  toPlainObject(): {
    id: string;
    type: NotificationType;
    message: string;
    title?: string;
    userId?: string;
    channel: NotificationChannel;
    createdAt: Date;
    isRead: boolean;
    readAt?: Date;
  } {
    return {
      id: this._id,
      type: this._type,
      message: this._message,
      title: this._title,
      userId: this._userId,
      channel: this._channel,
      createdAt: this._createdAt,
      isRead: this._isRead,
      readAt: this._readAt,
    };
  }

  /**
   * Compara notificaciones por ID
   */
  equals(other: Notification | null | undefined): boolean {
    return !!other && this._id === other._id;
  }
}
