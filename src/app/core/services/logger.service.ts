import { Logger, LogLevel, LogContext } from '../interfaces/logger.interface';

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
    const levelName = this.getLevelName(level);
    const mergedContext = { ...this.globalContext, ...context };

    const logEntry = {
      timestamp,
      level: levelName,
      message,
      ...mergedContext,
    };

    // Output basado en el nivel
    this.outputLog(level, logEntry);
  }

  private getLevelName(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return 'DEBUG';
      case LogLevel.INFO:
        return 'INFO';
      case LogLevel.WARN:
        return 'WARN';
      case LogLevel.ERROR:
        return 'ERROR';
      default:
        return 'UNKNOWN';
    }
  }

  private outputLog(level: LogLevel, logEntry: Record<string, unknown>): void {
    const { timestamp, level: levelName, message, ...context } = logEntry;
    const formattedMessage = `[${timestamp}] ${levelName}: ${message}`;
    const hasContext = Object.keys(context).length > 0;

    if (level >= LogLevel.ERROR) {
      console.error(formattedMessage, hasContext ? context : '');
    } else if (level >= LogLevel.WARN) {
      console.warn(formattedMessage, hasContext ? context : '');
    } else {
      console.log(formattedMessage, hasContext ? context : '');
    }
  }

  private isProduction(): boolean {
    return (
      typeof window !== 'undefined' &&
      !window.location.hostname.includes('localhost') &&
      !window.location.hostname.includes('127.0.0.1')
    );
  }
}
