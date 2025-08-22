import { ClockPort } from '@domain/repositories/system/clock.repository';

export class SystemClock implements ClockPort {
    nowEpochSeconds(): number {
        return Math.floor(Date.now() / 1000);
    }

    nowDate(): Date {
        return new Date();
    }

    nowEpochMilliseconds(): number {
        return Date.now();
    }

    nowISOString(): string {
        return new Date().toISOString();
    }
}
