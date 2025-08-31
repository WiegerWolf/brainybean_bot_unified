import type { Context, Middleware } from 'telegraf';
import { config } from './utils/config';

export interface BotContext extends Context {
  user?: { id: number };
  chatId?: number;
}

export interface BotCommand {
  command: string;
  description: string;
  handler: Middleware<BotContext>;
}

export const botCommands = [
  {
    command: 'start',
    description: 'Start the bot and get welcome message',
    handler: async (ctx) => {
      await ctx.reply(`Welcome! I'm using model: ${config.MODEL}`);
    }
  },
  {
    command: 'reset',
    description: 'Clear chat history',
    handler: async (ctx) => {
      const { chatRepository } = await import('./db/repositories/chat');
      const chatId = ctx.chat?.id ?? ctx.chatId;
      if (!chatId) {
        await ctx.reply('Cannot determine which chat to reset.');
        return;
      }
      try {
        await chatRepository.clearHistory(chatId);
        await ctx.reply('Chat history cleared. Everything above this message has been forgotten.');
      } catch (err) {
        await ctx.reply('Failed to clear chat history. Please try again later.');
        throw err;
      }
    }
  },
  {
    command: 'stats',
    description: 'View usage statistics',
    handler: async (ctx) => {
      const { getStats } = await import('./tools/implementations');
      const userId = ctx.user?.id ?? ctx.from?.id;
      if (!userId || !ctx.from?.id) {
        await ctx.reply('Cannot determine user for stats.');
        return;
      }
      const stats = await getStats(userId, config.isAdmin(ctx.from.id));
      await ctx.reply(stats, { parse_mode: 'Markdown' });
    }
  }
] as const satisfies ReadonlyArray<BotCommand>;