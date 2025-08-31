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

export const botCommands: BotCommand[] = [
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
      await chatRepository.clearHistory(chatId);
      await ctx.reply('Chat history cleared. Everything above this message has been forgotten.');
    }
  },
  {
    command: 'stats',
    description: 'View usage statistics',
    handler: async (ctx) => {
      if (!ctx.user) return;
      const { getStats } = await import('./tools/implementations');
      const stats = await getStats(ctx.user.id, config.isAdmin(ctx.from!.id));
      await ctx.reply(stats, { parse_mode: 'Markdown' });
    }
  }
];