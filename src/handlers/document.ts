import { Context } from 'telegraf';
import mime from 'mime';
import { openAIService } from '../services/openai';
import { chatRepository } from '../db/repositories/chat';
import { analyticsService } from '../services/analytics';
import { withErrorHandling } from './errorHandler';


export const handleDocument = withErrorHandling(async (ctx: Context) => {
  const chatId = ctx.chat!.id;
  const userId = ctx.from!.id;
  const document = (ctx.message as any).document;
  const caption = (ctx.message as any).caption;
  
  
    const mimeType = document.mime_type || mime.getType(document.file_name);
    if (!mimeType) {
      await ctx.reply('Unknown file type. Please send a different file.');
      return;
    }
    
    // Download file
    const fileLink = await ctx.telegram.getFileLink(document.file_id);
  const fetchResponse = await fetch(fileLink.href);
  const fileBuffer = Buffer.from(await fetchResponse.arrayBuffer());
    
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
          filename: document.file_name, 
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

    await ctx.reply(aiResponse.content || `Received file: ${document.file_name}`);

    // Save response
    await chatRepository.addMessage(chat.id, {
      role: 'assistant',
      content: aiResponse.content
    });
    
    await analyticsService.trackDocument(userId, chat.id, document.file_name);
    
  });