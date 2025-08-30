import pino from 'pino';
import { config } from './config';

const level = (config as any).LOG_LEVEL || 'info';

const logger = pino({
  level,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
      ignore: 'pid,hostname',
    },
  },
});

// Wrapper to match the existing interface for error method
const wrappedLogger = {
  debug: (message: string, ...args: any[]) => logger.debug(message, ...args),
  info: (message: string, ...args: any[]) => logger.info(message, ...args),
  warn: (message: string, ...args: any[]) => logger.warn(message, ...args),
  error: (message: string, error?: any) => {
    if (error) {
      logger.error(error, message);
    } else {
      logger.error(message);
    }
  },
};

export { wrappedLogger as logger };