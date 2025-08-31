import { Logger } from "tslog";
import { config } from './config';

// Map config log levels to tslog minLevel
const levelMap: Record<string, number> = {
  debug: 2, // tslog debug
  info: 3,  // tslog info
  warn: 4,  // tslog warn
  error: 5  // tslog error
};

const logger = new Logger({
  type: "pretty",
  minLevel: levelMap[config.LOG_LEVEL] || 3, // default to info
  name: "BrainyBeanBot"
});

export { logger };