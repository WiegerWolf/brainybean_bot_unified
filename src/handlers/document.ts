import type { BotContext } from '../commands';
import mime from 'mime';
import { openAIService } from '../services/openai';
import { chatRepository } from '../db/repositories/chat';
import { analyticsService } from '../services/analytics';
import { withErrorHandling } from './errorHandler';
import { ALLOWED_PREFIXES, ALLOWED_EXACT } from '../constants/mime';
import { replyMarkdownOrPlain } from '../services/telegram';

function splitIntoTelegramChunks(text: string, max = 4096): string[] {
  const parts: string[] = [];
  let i = 0;
  while (i < text.length) {
    let end = Math.min(i + max, text.length);
    // Prefer to split at a newline/space when possible
    if (end < text.length) {
      const nl = text.lastIndexOf('\n', end - 1);
      const sp = text.lastIndexOf(' ', end - 1);
      const splitAt = Math.max(nl, sp);
      if (splitAt > i + Math.floor(max * 0.6)) end = splitAt + 1;
    }
    parts.push(text.slice(i, end));
    i = end;
  }
  return parts;
}

export const handleDocument = withErrorHandling(async (ctx: BotContext) => {
  const chatId = ctx.chat?.id ?? ctx.chatId;
  const userId = ctx.from?.id;
  if (!chatId || !userId) {
    await ctx.reply('Unable to process request: missing chat or user information.', { parse_mode: 'Markdown' }).catch(() => {});
    return;
  }
  const document = (ctx.message as any)?.document;
  const caption = (ctx.message as any)?.caption;
  if (!document) {
    await ctx.reply('No document found in the message.', { parse_mode: 'Markdown' }).catch(() => {});
    return;
  }


    const mimeTypeRaw = document.mime_type || mime.getType(document.file_name || '') || '';
    const mimeType = mimeTypeRaw.toLowerCase();
    const allowedPrefixes = ALLOWED_PREFIXES;
    const allowedExact = ALLOWED_EXACT;
    const isAllowed =
      !!mimeType &&
      (allowedPrefixes.some(p => mimeType.startsWith(p)) || allowedExact.includes(mimeType));
    if (!isAllowed) {
      await replyMarkdownOrPlain(ctx, 'Unsupported file type. Allowed: images, videos, audio, text/plain, PDF.');
      return;
    }
    
    // Download file
    const MAX_BYTES = 10 * 1024 * 1024; // 10 MB; tune to backend limits
    if (typeof document.file_size === 'number' && document.file_size > MAX_BYTES) {
      await replyMarkdownOrPlain(ctx, 'File too large. Please send a file under 10 MB.');
      return;
    }
    const fileLink = await ctx.telegram.getFileLink(document.file_id);
    const url = typeof fileLink === 'string' ? fileLink : fileLink.href;
    const DOWNLOAD_TIMEOUT_MS = 20_000;
    const fetchResponse = await fetch(url, { signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS) });
    if (!fetchResponse.ok) {
      throw new Error(`Telegram file fetch failed: ${fetchResponse.status} ${fetchResponse.statusText}`);
    }
    const fileBuffer = Buffer.from(await fetchResponse.arrayBuffer());
    // Double-check post-download in case size metadata was missing
    if (fileBuffer.byteLength > MAX_BYTES) {
      await replyMarkdownOrPlain(ctx, 'File too large. Please send a file under 10 MB.');
      return;
    }
    
  // Get or create chat
    const chat = await chatRepository.getOrCreate(userId, chatId);
    
    // Add caption if present
    if (caption) {
      await chatRepository.addMessage(chat.id, {
        role: 'user',
        content: caption
      });
    }
    
    // Prepare message based on file type
    let message: any;
    const data = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
    const filename = document.file_name ?? `${document.file_id}.${mime.getExtension(mimeType) || 'bin'}`;

    if (mimeType.startsWith('image/')) {
      message = { type: 'image_url', image_url: { url: data } };
    } else {
      message = {
        type: 'file',
        file: {
          filename,
          file_data: data
        }
      };
    }
    
    // Add document message
    await chatRepository.addMessage(chat.id, {
      role: 'user',
      content: [message]
    });
    
    // Get response
    const messages = await chatRepository.getMessages(chat.id);
    const aiResponse = await openAIService.completion(messages, userId);

    const finalText = (aiResponse.content || `Received file: ${filename}`).trim() || '…';
    for (const chunk of splitIntoTelegramChunks(finalText, 4096)) {
      const trimmedChunk = chunk.trim();
      if (trimmedChunk) {
        await replyMarkdownOrPlain(ctx, trimmedChunk);
      }
    }

    // Save response
    await chatRepository.addMessage(chat.id, {
      role: 'assistant',
      content: finalText
    });

    await analyticsService.trackDocument(
      userId,
      chat.id,
      filename
    );

  });