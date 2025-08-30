import pino from "pino";
import { config } from "./config";
import type { LevelWithSilent } from "pino";

const rawLevel = String(
  (config as any)?.LOG_LEVEL ?? process.env.LOG_LEVEL ?? "info"
).toLowerCase();

const allowed = [
  "fatal",
  "error",
  "warn",
  "info",
  "debug",
  "trace",
  "silent",
] as const;

const level: LevelWithSilent = (allowed as readonly string[]).includes(rawLevel)
  ? (rawLevel as LevelWithSilent)
  : "info";

const pretty = ((config as any)?.LOG_PRETTY ?? process.env.NODE_ENV !== 'production');
const logger = pino({
  level,
  ...(pretty && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l",
        ignore: "pid,hostname",
      },
    },
  }),
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
