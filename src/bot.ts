import { Telegraf, Context } from 'telegraf';
import { config } from './utils/config';
import { handleTextMessage, handleVoiceMessage, handleDocument, handlePhoto, handleVideo } from './handlers';
import { userRepository } from './db/repositories/user';
import { logger } from './utils/logger';

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

// Command handlers
bot.command('start', async (ctx) => {
  await ctx.reply(`Welcome! I'm using model: ${config.MODEL}`);
});

bot.command('reset', async (ctx) => {
  const { chatRepository } = await import('./db/repositories/chat');
  await chatRepository.clearHistory(ctx.chatId!);
  await ctx.reply('Chat history cleared. Everything above this message has been forgotten.');
});

bot.command('stats', async (ctx) => {
  const { getStats } = await import('./tools/implementations');
  const stats = await getStats(ctx.user.id, config.isAdmin(ctx.from!.id));
  await ctx.reply(stats, { parse_mode: 'Markdown' });
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