import { config } from './config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };
  
  private colors = {
    debug: '\x1b[36m',  // cyan
    info: '\x1b[32m',   // green
    warn: '\x1b[33m',   // yellow
    error: '\x1b[31m',  // red
    reset: '\x1b[0m'
  };
  
  private shouldLog(level: LogLevel): boolean {
    const configLevel = (config as any).LOG_LEVEL || 'info';
    return this.levels[level] >= this.levels[configLevel];
  }
  
  private log(level: LogLevel, message: string, ...args: any[]) {
    if (!this.shouldLog(level)) return;
    
    const timestamp = new Date().toISOString();
    const color = this.colors[level];
    const reset = this.colors.reset;
    
    console.log(
      `${color}[${timestamp}] [${level.toUpperCase()}]${reset} ${message}`,
      ...args
    );
  }
  
  debug(message: string, ...args: any[]) {
    this.log('debug', message, ...args);
  }
  
  info(message: string, ...args: any[]) {
    this.log('info', message, ...args);
  }
  
  warn(message: string, ...args: any[]) {
    this.log('warn', message, ...args);
  }
  
  error(message: string, error?: any) {
    this.log('error', message);
    if (error) {
      console.error(error);
    }
  }
}

export const logger = new Logger();