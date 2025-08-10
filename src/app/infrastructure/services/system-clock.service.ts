import { ClockPort } from '@domain/ports/clock.port';

export class SystemClock implements ClockPort {
    nowEpochSeconds(): number {
        return Math.floor(Date.now() / 1000);
    }
}
