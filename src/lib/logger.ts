/**
 * Centralized logging system for debugging and monitoring
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  page: string;
  action: string;
  userId?: string;
  userType?: string;
  message: string;
  error?: any;
  data?: any;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  log(
    level: LogLevel,
    page: string,
    action: string,
    message: string,
    options?: {
      userId?: string;
      userType?: string;
      error?: any;
      data?: any;
    }
  ) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      page,
      action,
      userId: options?.userId,
      userType: options?.userType,
      message,
      error: options?.error,
      data: options?.data,
    };

    this.logs.push(entry);

    // Keep only last 100 logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output for development
    const logStyle = this.getLogStyle(level);
    console.log(
      `%c[${entry.timestamp}] ${level} - ${page}/${action}`,
      logStyle,
      message,
      options?.error || options?.data || ''
    );
  }

  debug(page: string, action: string, message: string, data?: any) {
    this.log(LogLevel.DEBUG, page, action, message, { data });
  }

  info(page: string, action: string, message: string, data?: any) {
    this.log(LogLevel.INFO, page, action, message, { data });
  }

  warn(page: string, action: string, message: string, data?: any) {
    this.log(LogLevel.WARN, page, action, message, { data });
  }

  error(page: string, action: string, message: string, error?: any, data?: any) {
    this.log(LogLevel.ERROR, page, action, message, { error, data });
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }

  private getLogStyle(level: LogLevel): string {
    const styles = {
      [LogLevel.DEBUG]: 'color: #888; font-weight: normal;',
      [LogLevel.INFO]: 'color: #0066cc; font-weight: bold;',
      [LogLevel.WARN]: 'color: #ff9900; font-weight: bold;',
      [LogLevel.ERROR]: 'color: #cc0000; font-weight: bold;',
    };
    return styles[level];
  }
}

export const logger = new Logger();
