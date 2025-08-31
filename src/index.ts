import 'dotenv/config';
import { bot } from './bot';
import { config } from './utils/config';
import { logger } from './utils/logger';
import { initDatabase } from './db/client';

async function main() {
  try {
    // Initialize database
    await initDatabase();
    
    // Start bot
    await bot.launch(() => {
      logger.info(`Bot started with model: ${config.MODEL}`);
    });

    // Graceful shutdown
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  } catch (error) {
    logger.fatal('Failed to start bot:', error);
    process.exit(1);
  }
}

main();