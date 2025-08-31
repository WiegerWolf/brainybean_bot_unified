import type { BotContext } from '../commands';
import mime from 'mime';
import { openAIService } from '../services/openai';
import { chatRepository } from '../db/repositories/chat';
import { analyticsService } from '../services/analytics';
import { withErrorHandling } from './errorHandler';


export const handleDocument = withErrorHandling(async (ctx: BotContext) => {
  const chatId = ctx.chat?.id ?? (ctx as any).chatId;
  const userId = ctx.from?.id!;
  if (!chatId || !userId) {
    await ctx.reply('Unable to process request: missing chat or user information.', { parse_mode: 'Markdown' }).catch(() => {});
    return;
  }
  const document = (ctx.message as any).document;
  const caption = (ctx.message as any).caption;


    const mimeType = document.mime_type || mime.getType(document.file_name || '') || '';
    const allowedPrefixes = ['image/', 'video/', 'audio/']; // keep in sync with media/voice handlers
    const allowedExact = ['text/plain', 'application/pdf'];
    const isAllowed =
      !!mimeType &&
      (allowedPrefixes.some(p => mimeType.startsWith(p)) || allowedExact.includes(mimeType));
    if (!isAllowed) {
      await ctx.reply('Unknown file type. Please send a different file.', { parse_mode: 'Markdown' }).catch(async (err: any) => {
        if (err?.code === 'ETELEGRAM') await ctx.reply('Unknown file type. Please send a different file.');
      });
      return;
    }
    
    // Download file
    const MAX_BYTES = 10 * 1024 * 1024; // 10 MB; tune to backend limits
    if (typeof document.file_size === 'number' && document.file_size > MAX_BYTES) {
      await ctx.reply('File too large. Please send a file under 10 MB.', { parse_mode: 'Markdown' })
        .catch(async (err: any) => { if (err?.code === 'ETELEGRAM') await ctx.reply('File too large. Please send a file under 10 MB.'); });
      return;
    }
    const fileLink = await ctx.telegram.getFileLink(document.file_id);
    const url = typeof fileLink === 'string' ? fileLink : fileLink.href;
    const fetchResponse = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!fetchResponse.ok) {
      throw new Error(`Telegram file fetch failed: ${fetchResponse.status} ${fetchResponse.statusText}`);
    }
    const fileBuffer = Buffer.from(await fetchResponse.arrayBuffer());
    // Double-check post-download in case size metadata was missing
    if (fileBuffer.byteLength > MAX_BYTES) {
      await ctx.reply('File too large. Please send a file under 10 MB.', { parse_mode: 'Markdown' })
        .catch(async (err: any) => { if (err?.code === 'ETELEGRAM') await ctx.reply('File too large. Please send a file under 10 MB.'); });
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
    
    if (mimeType.startsWith('image/')) {
      message = { type: 'image_url', image_url: { url: data } };
    } else {
      message = {
        type: 'file',
        file: {
          filename: document.file_name ?? `${document.file_id}.${mime.getExtension(mimeType) || 'bin'}`,
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

    const finalText = (aiResponse.content || `Received file: ${document.file_name}`).trim() || '…';
    await ctx.reply(finalText, { parse_mode: 'Markdown' }).catch(async (err: any) => {
      if (err?.code === 'ETELEGRAM') await ctx.reply(finalText);
    });

    // Save response
    await chatRepository.addMessage(chat.id, {
      role: 'assistant',
      content: finalText
    });

    await analyticsService.trackDocument(
      userId,
      chat.id,
      document.file_name ?? `${document.file_id}.${mime.getExtension(mimeType) || 'bin'}`
    );

  });