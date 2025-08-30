import { Injectable } from '@angular/core';
import { Logger, LogLevel, LogContext } from '../interfaces/logger.interface';

@Injectable({ providedIn: 'root' })
export class LoggerService implements Logger {
  private globalContext: LogContext = {};
  private minLevel: LogLevel = LogLevel.DEBUG;

  constructor() {
    // En producción, cambiar el nivel mínimo
    this.minLevel = this.isProduction() ? LogLevel.INFO : LogLevel.DEBUG;
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context);
  }

  setGlobalContext(context: LogContext): void {
    this.globalContext = { ...context };
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (level < this.minLevel) {
      return;
    }

    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const mergedContext = { ...this.globalContext, ...context };

    const logEntry = {
      timestamp,
      level: levelName,
      message,
      ...mergedContext,
    };

    // Output simple - en Core solo console
    if (level >= LogLevel.ERROR) {
      console.error(`[${timestamp}] ${levelName}: ${message}`, mergedContext);
    } else if (level >= LogLevel.WARN) {
      console.warn(`[${timestamp}] ${levelName}: ${message}`, mergedContext);
    } else {
      console.log(`[${timestamp}] ${levelName}: ${message}`, mergedContext);
    }
  }

  private isProduction(): boolean {
    // Método simple para detectar producción
    return typeof window !== 'undefined' && window.location.hostname !== 'localhost';
  }
}
