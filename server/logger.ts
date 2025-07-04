import { format } from "date-fns";

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  userId?: number;
  requestId?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';
  
  private formatMessage(level: LogLevel, message: string, data?: any, userId?: number, requestId?: string): string {
    const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      ...(data && { data }),
      ...(userId && { userId }),
      ...(requestId && { requestId })
    };
    
    if (this.isDevelopment) {
      // Pretty print for development
      let output = `[${timestamp}] ${level}: ${message}`;
      if (userId) output += ` (User: ${userId})`;
      if (requestId) output += ` (Request: ${requestId})`;
      if (data) output += `\n${JSON.stringify(data, null, 2)}`;
      return output;
    } else {
      // JSON format for production
      return JSON.stringify(logEntry);
    }
  }

  error(message: string, data?: any, userId?: number, requestId?: string) {
    console.error(this.formatMessage(LogLevel.ERROR, message, data, userId, requestId));
  }

  warn(message: string, data?: any, userId?: number, requestId?: string) {
    console.warn(this.formatMessage(LogLevel.WARN, message, data, userId, requestId));
  }

  info(message: string, data?: any, userId?: number, requestId?: string) {
    console.log(this.formatMessage(LogLevel.INFO, message, data, userId, requestId));
  }

  debug(message: string, data?: any, userId?: number, requestId?: string) {
    if (this.isDevelopment) {
      console.log(this.formatMessage(LogLevel.DEBUG, message, data, userId, requestId));
    }
  }

  // Database operation logging
  dbOperation(operation: string, table: string, success: boolean, duration?: number, userId?: number) {
    const message = `DB ${operation} on ${table} ${success ? 'succeeded' : 'failed'}`;
    const data = { operation, table, success, ...(duration && { duration: `${duration}ms` }) };
    
    if (success) {
      this.debug(message, data, userId);
    } else {
      this.error(message, data, userId);
    }
  }

  // API request logging
  apiRequest(method: string, path: string, statusCode: number, duration: number, userId?: number, requestId?: string) {
    const message = `${method} ${path} ${statusCode}`;
    const data = { method, path, statusCode, duration: `${duration}ms` };
    
    if (statusCode >= 500) {
      this.error(message, data, userId, requestId);
    } else if (statusCode >= 400) {
      this.warn(message, data, userId, requestId);
    } else {
      this.debug(message, data, userId, requestId);
    }
  }
}

export const logger = new Logger();