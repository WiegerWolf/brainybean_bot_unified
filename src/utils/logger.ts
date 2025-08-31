import { Logger } from "tslog";
import { config } from "./config";

// Map config log levels to tslog minLevel
const levelMap: Record<string, number> = {
  trace: 1, // tslog trace
  debug: 2, // tslog debug
  info: 3, // tslog info
  warn: 4, // tslog warn
  error: 5, // tslog error
  fatal: 6, // tslog fatal
};

const logger = new Logger({
  type: process.env.NODE_ENV === "production" ? "json" : "pretty",
  minLevel: levelMap[config.LOG_LEVEL],
  name: "BrainyBeanBot",
  maskValuesOfKeys: config.keysForMasking,
  maskValuesOfKeysCaseInsensitive: true,
});

export { logger };
