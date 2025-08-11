import { NewNotification, Notification, NotificationId } from '../entities/notification.entity';

export interface NotificationPort {
    /** Suscripción a cambios (retorna unsubscribe) */
    onChange(sub: (list: Notification[]) => void): () => void;

    /** Snapshot actual (para primer render) */
    snapshot(): Notification[];

    /** Agrega notificación, retorna su id */
    push(n: NewNotification): NotificationId;

    /** Actualiza parcialmente una notificación existente */
    update(id: NotificationId, patch: Partial<Notification>): void;

    /** Cierra una notificación por id */
    dismiss(id: NotificationId): void;

    /** Limpia todas las notificaciones */
    clear(): void;
}
