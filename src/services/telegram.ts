import { Context } from 'telegraf';
import { bot } from '../bot';
import { logger } from '../utils/logger';

export async function sendMessage(chatId: number, text: string, options?: any) {
  try {
    return await bot.telegram.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      ...options
    });
  } catch (error: any) {
    if (error.code === 'ETELEGRAM') {
      logger.debug(`Markdown parse error, sending plain text to ${chatId}: ${error.message}`);
      return await bot.telegram.sendMessage(chatId, text, options);
    }
    throw error;
  }
}

export async function replyMarkdownOrPlain(ctx: Context, text: string) {
  try {
    await ctx.reply(text, { parse_mode: 'Markdown' });
  } catch (e: any) {
    if (e?.code === 'ETELEGRAM') await ctx.reply(text).catch(() => {});
    else throw e;
  }
}

export async function editMessage(chatId: number, messageId: number, text: string) {
  try {
    return await bot.telegram.editMessageText(chatId, messageId, undefined, text, {
      parse_mode: 'Markdown'
    });
  } catch (error: any) {
    if (error.code === 'ETELEGRAM') {
      logger.debug(`Markdown parse error, editing without parse_mode for message ${messageId}: ${error.message}`);
      return await bot.telegram.editMessageText(chatId, messageId, undefined, text);
    }
    // Ignore benign errors (e.g., "message is not modified"), rethrow others
    const desc = (error?.response && error.response.description) || error.message || String(error);
    if (typeof desc === 'string' && /message is not modified/i.test(desc)) {
      logger.debug(`Edit skipped for message ${messageId}: ${desc}`);
      return;
    }
    logger.debug(`Error editing message ${messageId}: ${desc}`);
    throw error;
  }
}