import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import * as schema from "./schema";
import { config } from "../utils/config";
import { logger } from "../utils/logger";

let db: ReturnType<typeof drizzle>;

export async function initDatabase() {
  const sqlite = new Database(config.DATABASE_URL);
  db = drizzle(sqlite, { schema });

  // Enable WAL mode for better concurrent access
  sqlite.exec("PRAGMA journal_mode = WAL");

  logger.info("Database initialized");
  return db;
}

export function getDb() {
  if (!db) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return db;
}
