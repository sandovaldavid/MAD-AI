export interface DateTimeOptions {
  timezone?: string;
  locale?: string;
  format?: string;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface BusinessHours {
  start: string; // HH:mm format
  end: string; // HH:mm format
  timezone: string;
  workingDays: number[]; // 0 = Sunday, 1 = Monday, etc.
}

/**
 * Date Time Service - Core Layer
 *
 * Servicio transversal para operaciones de fechas y tiempo del negocio.
 * Maneja zonas horarias, formatos, cálculos de tiempo de negocio, etc.
 * Completamente independiente del framework - puede ser reutilizado en cualquier plataforma.
 *
 * @architecture Core Layer - Cross-cutting Concern
 * @crossCutting Usado por: Auth, Users, Notifications, Reports, etc.
 * @frameworkIndependent Sin dependencias de Angular u otros frameworks
 */
export class DateTimeService {
  // Default business hours (configurable)
  private readonly defaultBusinessHours: BusinessHours = {
    start: '08:00',
    end: '18:00',
    timezone: 'America/Bogota',
    workingDays: [1, 2, 3, 4, 5], // Monday to Friday
  };

  constructor() {
    // Initialize timezone handling
    this.initializeTimezoneSupport();
  }

  private initializeTimezoneSupport(): void {
    // Ensure Intl.DateTimeFormat is available (framework-independent check)
    if (typeof Intl === 'undefined' || !Intl.DateTimeFormat) {
      console.warn('Intl.DateTimeFormat not available, date formatting may be limited');
    }
  }

  // ===== BASIC DATE OPERATIONS =====

  now(): Date {
    return new Date();
  }

  today(): Date {
    const now = this.now();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  createDate(year: number, month: number, day: number, hours = 0, minutes = 0, seconds = 0): Date {
    return new Date(year, month - 1, day, hours, minutes, seconds);
  }

  parseDate(dateString: string, options?: DateTimeOptions): Date | null {
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }

  // ===== FORMATTING =====

  formatDate(date: Date, format = 'DD/MM/YYYY', options?: DateTimeOptions): string {
    const locale = options?.locale || 'es-CO';
    const timezone = options?.timezone || 'America/Bogota';

    try {
      return new Intl.DateTimeFormat(locale, {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: format.includes('HH') ? '2-digit' : undefined,
        minute: format.includes('mm') ? '2-digit' : undefined,
        second: format.includes('ss') ? '2-digit' : undefined,
      }).format(date);
    } catch (error) {
      // Fallback to basic formatting
      return this.basicFormat(date, format);
    }
  }

  formatTime(date: Date, format = 'HH:mm', options?: DateTimeOptions): string {
    const locale = options?.locale || 'es-CO';
    const timezone = options?.timezone || 'America/Bogota';

    try {
      return new Intl.DateTimeFormat(locale, {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: format.includes('ss') ? '2-digit' : undefined,
      }).format(date);
    } catch (error) {
      return this.basicTimeFormat(date, format);
    }
  }

  private basicFormat(date: Date, format: string): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();

    return format.replace('DD', day).replace('MM', month).replace('YYYY', year);
  }

  private basicTimeFormat(date: Date, format: string): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    return format.replace('HH', hours).replace('mm', minutes).replace('ss', seconds);
  }

  // ===== DATE CALCULATIONS =====

  addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  addHours(date: Date, hours: number): Date {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
  }

  addMinutes(date: Date, minutes: number): Date {
    const result = new Date(date);
    result.setMinutes(result.getMinutes() + minutes);
    return result;
  }

  addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  addYears(date: Date, years: number): Date {
    const result = new Date(date);
    result.setFullYear(result.getFullYear() + years);
    return result;
  }

  // ===== DATE COMPARISONS =====

  isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  isSameMonth(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth();
  }

  isSameYear(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear();
  }

  isBefore(date1: Date, date2: Date): boolean {
    return date1.getTime() < date2.getTime();
  }

  isAfter(date1: Date, date2: Date): boolean {
    return date1.getTime() > date2.getTime();
  }

  isBetween(date: Date, start: Date, end: Date): boolean {
    return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
  }

  // ===== BUSINESS TIME CALCULATIONS =====

  isBusinessDay(date: Date, businessHours = this.defaultBusinessHours): boolean {
    const dayOfWeek = date.getDay();
    return businessHours.workingDays.includes(dayOfWeek);
  }

  isBusinessHours(date: Date, businessHours = this.defaultBusinessHours): boolean {
    if (!this.isBusinessDay(date, businessHours)) {
      return false;
    }

    const timeString = this.formatTime(date, 'HH:mm');
    return timeString >= businessHours.start && timeString <= businessHours.end;
  }

  getNextBusinessDay(date: Date, businessHours = this.defaultBusinessHours): Date {
    let nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    while (!this.isBusinessDay(nextDay, businessHours)) {
      nextDay.setDate(nextDay.getDate() + 1);
    }

    return nextDay;
  }

  calculateBusinessDays(start: Date, end: Date, businessHours = this.defaultBusinessHours): number {
    let businessDays = 0;
    let current = new Date(start);

    while (current <= end) {
      if (this.isBusinessDay(current, businessHours)) {
        businessDays++;
      }
      current.setDate(current.getDate() + 1);
    }

    return businessDays;
  }

  // ===== TIMEZONE OPERATIONS =====

  convertTimezone(date: Date, fromTimezone: string, toTimezone: string): Date {
    // This is a simplified implementation
    // In a real app, you might use a library like moment-timezone
    try {
      const fromTime = new Intl.DateTimeFormat('en-US', {
        timeZone: fromTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(date);

      return new Date(fromTime + ' GMT');
    } catch (error) {
      console.warn('Timezone conversion failed, returning original date');
      return date;
    }
  }

  getTimezoneOffset(timezone: string): number {
    try {
      const now = new Date();
      const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
      const targetDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
      return (targetDate.getTime() - utcDate.getTime()) / (1000 * 60);
    } catch (error) {
      return 0;
    }
  }

  // ===== UTILITY METHODS =====

  getStartOfDay(date: Date): Date {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  getEndOfDay(date: Date): Date {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end;
  }

  getStartOfWeek(date: Date, startOfWeek: number = 1): Date {
    // 0 = Sunday, 1 = Monday
    const result = new Date(date);
    const day = result.getDay();
    const diff = result.getDate() - day + (startOfWeek === 0 ? 0 : day === 0 ? -6 : 1);
    result.setDate(diff);
    return this.getStartOfDay(result);
  }

  getEndOfWeek(date: Date, startOfWeek: number = 1): Date {
    const startOfWeekDate = this.getStartOfWeek(date, startOfWeek);
    return this.getEndOfDay(this.addDays(startOfWeekDate, 6));
  }

  getStartOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  getEndOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  // ===== VALIDATION =====

  isValidDate(date: any): date is Date {
    return date instanceof Date && !isNaN(date.getTime());
  }

  isValidDateRange(range: DateRange): boolean {
    return this.isValidDate(range.start) && this.isValidDate(range.end) && range.start <= range.end;
  }

  // ===== RELATIVE TIME =====

  getRelativeTime(date: Date, now = this.now()): string {
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'ahora mismo';
    if (diffInMinutes < 60) return `hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
    if (diffInHours < 24) return `hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    if (diffInDays < 7) return `hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;

    return this.formatDate(date, 'DD/MM/YYYY');
  }

  // ===== CONFIGURATION =====

  setDefaultBusinessHours(businessHours: BusinessHours): void {
    // In a real app, this might be stored in configuration service
    (this as any).defaultBusinessHours = businessHours;
  }

  getDefaultBusinessHours(): BusinessHours {
    return { ...this.defaultBusinessHours };
  }
}
