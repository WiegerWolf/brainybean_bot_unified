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
      logger.warn(`Markdown parse error, sending plain text to ${chatId}`);
      return await bot.telegram.sendMessage(chatId, text, options);
    }
    throw error;
  }
}

export async function editMessage(chatId: number, messageId: number, text: string) {
  try {
    return await bot.telegram.editMessageText(chatId, messageId, undefined, text, {
      parse_mode: 'Markdown'
    });
  } catch (error: any) {
    if (error.code === 'ETELEGRAM') {
      return await bot.telegram.editMessageText(chatId, messageId, undefined, text);
    }
    // Ignore other errors (like message not modified)
  }
}