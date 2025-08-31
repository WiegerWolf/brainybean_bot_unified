import { Context } from 'telegraf';
import { logger } from '../utils/logger';
import { config } from '../utils/config';

export type Handler<C extends Context = Context> = (ctx: C) => Promise<void>;

export function withErrorHandling<C extends Context>(handler: Handler<C>): Handler<C> {
  return async (ctx: C) => {
    const sendTyping = () => { void ctx.sendChatAction('typing').catch(() => {}); };
    sendTyping(); // immediate
    const typingInterval = setInterval(sendTyping, 4000);

    try {
      await handler(ctx);
    } catch (error) {
      logger.error('Error in handler:', error);
      if ((error as any)?.name === 'AbortError') {
        await ctx.reply('Download timed out. Please try again.').catch(() => {});
        return;
      }
      await ctx.reply('Sorry, an error occurred. Please try again.').catch(() => {});
      const isAdmin = !!ctx.from && config.isAdmin(ctx.from.id);
      if (isAdmin) {
        const details = error instanceof Error
          ? { name: error.name, message: error.message, stack: error.stack }
          : error;
        const json = JSON.stringify(details, null, 2);
        const body = json.length > 3500 ? `${json.slice(0, 3500)}\n… [truncated]` : json;
        const md = `Error details: \`\`\`json\n${body}\`\`\``;
        await ctx.reply(md, { parse_mode: "Markdown" })
          .catch(async (e: any) => { if (e?.code === 'ETELEGRAM') await ctx.reply(`Error details: ${body}`).catch(() => {}); });
      }
    } finally {
      clearInterval(typingInterval);
    }
  };
}