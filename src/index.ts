import "dotenv/config";
import { bot } from "./bot";
import { config } from "./utils/config";
import { logger } from "./utils/logger";
import { initDatabase } from "./db/client";
import { botCommands } from "./commands";

async function main() {
  try {
    // Initialize database
    await initDatabase();

    // Start bot (this won't resolve until the bot is stopped)
    await bot.launch(async () => {
      logger.info(`Bot started with model: ${config.MODEL}`);
      // Set bot commands
      try {
        const commandsForAPI = botCommands.map(({ command, description }) => ({
          command,
          description,
        }));
        await bot.telegram.setMyCommands(commandsForAPI);
        logger.info("Bot commands set successfully");
      } catch (error) {
        logger.error("Failed to set bot commands:", error);
      }
    });

    // Graceful shutdown
    process.once("SIGINT", () => bot.stop("SIGINT"));
    process.once("SIGTERM", () => bot.stop("SIGTERM"));
  } catch (error) {
    logger.fatal("Failed to start bot:", error);
    process.exit(1);
  }
}

main();
