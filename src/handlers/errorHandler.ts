import { Context } from 'telegraf';
import { logger } from '../utils/logger';
import { config } from '../utils/config';

type Handler = (ctx: Context) => Promise<void>;

export function withErrorHandling(handler: Handler): Handler {
  return async (ctx: Context) => {
    const typingInterval = setInterval(() => {
      ctx.sendChatAction('typing');
    }, 4000);

    try {
      await handler(ctx);
    } catch (error) {
      logger.error('Error in handler:', error);
      await ctx.reply('Sorry, an error occurred. Please try again.');
      if (config.isAdmin(ctx.from!.id)) {
        await ctx.reply(
          `Error details: \`\`\`json\n${JSON.stringify(error, null, 2)}\`\`\``,
          {
            parse_mode: "Markdown",
          }
        );
      }
    } finally {
      clearInterval(typingInterval);
    }
  };
}