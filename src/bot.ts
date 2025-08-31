import { Telegraf, Context } from 'telegraf';
import { config } from './utils/config';
import { handleTextMessage, handleVoiceMessage, handleDocument, handlePhoto, handleVideo } from './handlers';
import { userRepository } from './db/repositories/user';
import { logger } from './utils/logger';
import { botCommands } from './commands';

interface BotContext extends Context {
  user?: any;
  chatId?: number;
}

export const bot = new Telegraf<BotContext>(config.TELEGRAM_BOT_TOKEN);

// Middleware: Check whitelist and load user
bot.use(async (ctx, next) => {
  const userId = ctx.from?.id;
  if (!userId) return;
  
  if (!config.isWhitelisted(userId)) {
    await ctx.reply('You are not authorized to use this bot.');
    return;
  }
  
  ctx.user = await userRepository.getOrCreate(userId, ctx.from);
  ctx.chatId = ctx.chat?.id;
  
  return next();
});

// Register commands dynamically
botCommands.forEach(({ command, handler }) => {
  bot.command(command, handler);
});

// Message handlers
bot.on('text', handleTextMessage);
bot.on('voice', handleVoiceMessage);
bot.on('document', handleDocument);
bot.on('photo', handlePhoto);
bot.on('video', handleVideo);

// Error handler
bot.catch((err, ctx) => {
  logger.error('Bot error:', err);
  ctx.reply('An error occurred. Please try again.');
});