import { Context } from 'telegraf';
import { config } from './utils/config';

export interface BotContext extends Context {
  user?: any;
  chatId?: number;
}

export interface BotCommand {
  command: string;
  description: string;
  handler: (ctx: BotContext) => Promise<void>;
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
      await chatRepository.clearHistory(ctx.chatId!);
      await ctx.reply('Chat history cleared. Everything above this message has been forgotten.');
    }
  },
  {
    command: 'stats',
    description: 'View usage statistics',
    handler: async (ctx) => {
      const { getStats } = await import('./tools/implementations');
      const stats = await getStats(ctx.user.id, config.isAdmin(ctx.from!.id));
      await ctx.reply(stats, { parse_mode: 'Markdown' });
    }
  }
];