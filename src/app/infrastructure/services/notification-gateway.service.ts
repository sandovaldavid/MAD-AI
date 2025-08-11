import { Injectable, signal, inject } from '@angular/core';
import { NOTIFICATION_CONFIG, NotificationConfig } from '../../di/tokens';
import { NotificationPort } from '@domain/ports/notification.port';
import {
    NewNotification,
    Notification,
    NotificationId,
} from '@domain/entities/notification.entity';
import { NotificationPosition } from '@domain/enums/notification';

type Unsub = () => void;

@Injectable({ providedIn: 'root' })
export class NotificationGatewayService implements NotificationPort {
    private cfg = inject<NotificationConfig>(NOTIFICATION_CONFIG);
    private listSig = signal<Notification[]>([]);
    private subs = new Set<(list: Notification[]) => void>();
    private timers = new Map<NotificationId, any>();

    // Helpers
    private newId(): NotificationId {
        return Math.random().toString(36).slice(2) + Date.now().toString(36);
    }
    private now() {
        return Date.now();
    }
    private isMobile(): boolean {
        return (
            typeof window !== 'undefined' &&
            window.matchMedia &&
            window.matchMedia('(max-width: 640px)').matches
        );
    }
    private visibleCap(): number {
        return this.isMobile() ? this.cfg.maxVisibleMobile : this.cfg.maxVisibleDesktop;
    }

    // Port API
    onChange(sub: (list: Notification[]) => void): Unsub {
        this.subs.add(sub);
        sub(this.listSig());
        return () => this.subs.delete(sub);
    }
    snapshot(): Notification[] {
        return this.listSig();
    }

    push(n: NewNotification): NotificationId {
        const id = n.id ?? this.newId();

        const def = this.cfg.defaults[n.type as keyof NotificationConfig['defaults']] as any;
        const duration = n.duration ?? def.duration;
        const dismissible = n.dismissible ?? def.dismissible;

        // 👇 posición por notificación (o default)
        const position = n.position ?? this.defaultPosition();

        // dedupe (igual que antes) …
        if (n.key) {
            const now = this.now();
            const dup = this.listSig().find(
                (x) => x.key === n.key && now - x.createdAt <= this.cfg.dedupeWindowMs
            );
            if (dup) {
                if (this.cfg.dedupeMode === 'update') {
                    this.update(dup.id, {
                        message: n.message,
                        title: n.title,
                        type: n.type,
                        position,
                    });
                }
                return dup.id;
            }
        }

        const next: Notification = {
            id,
            type: n.type,
            message: n.message,
            title: n.title,
            duration,
            dismissible,
            icon: n.icon ?? null,
            key: n.key ?? null,
            groupId: n.groupId ?? null,
            createdAt: this.now(),
            position,
            action: n.action ?? null,
            secondaryAction: n.secondaryAction ?? null,
            data: n.data,
        };

        this.listSig.set([...this.listSig(), next]);
        this.notifySubs();
        this.armTimer(next, duration);
        return id;
    }

    update(id: NotificationId, patch: Partial<Notification>): void {
        this.listSig.update((list) => list.map((x) => (x.id === id ? { ...x, ...patch } : x)));
        this.notifySubs();
    }

    dismiss(id: NotificationId): void {
        this.disarmTimer(id);
        this.listSig.update((list) => list.filter((x) => x.id !== id));
        this.notifySubs();
    }

    clear(): void {
        for (const id of this.timers.keys()) this.disarmTimer(id);
        this.listSig.set([]);
        this.notifySubs();
    }

    // Timers
    private armTimer(n: Notification, duration?: number | 0) {
        if (!duration || duration <= 0) return; // sticky
        this.disarmTimer(n.id);
        const t = setTimeout(() => this.dismiss(n.id), duration);
        this.timers.set(n.id, t);
    }
    private disarmTimer(id: NotificationId) {
        const t = this.timers.get(id);
        if (t) {
            clearTimeout(t);
            this.timers.delete(id);
        }
    }

    // Hover pause/resume desde UI
    pause(id: NotificationId) {
        this.disarmTimer(id);
    }

    resume(id: NotificationId) {
        const n = this.listSig().find((x) => x.id === id);
        if (n && n.duration && n.duration > 0) this.armTimer(n, n.duration);
    }

    // Notificar a suscriptores externos (Facade)
    private notifySubs() {
        const snap = this.listSig();
        for (const s of this.subs) s(snap);
    }

    private defaultPosition(): NotificationPosition {
        const isMobile =
            typeof window !== 'undefined' && window.matchMedia?.('(max-width: 640px)').matches;
        return isMobile ? this.cfg.defaults.position.mobile : this.cfg.defaults.position.desktop;
    }
}
