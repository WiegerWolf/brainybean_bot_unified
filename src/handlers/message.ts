import type { BotContext } from '../commands';
import { openAIService } from '../services/openai';
import { chatRepository } from '../db/repositories/chat';
import { analyticsService } from '../services/analytics';
import { logger } from '../utils/logger';

export async function handleTextMessage(ctx: BotContext) {
  const chatId = ctx.chat!.id;
  const userId = ctx.from!.id;
  const text = ctx.message!.text!;
  
  // Show typing indicator
  const typingInterval = setInterval(() => {
    ctx.sendChatAction('typing');
  }, 4000);
  
  try {
    // Get or create chat
    const chat = await chatRepository.getOrCreate(userId, chatId);
    
    // Add user message to history
    await chatRepository.addMessage(chat.id, {
      role: 'user',
      content: text
    });
    
    // Get chat history
    const messages = await chatRepository.getMessages(chat.id);
    
    // Stream response
    let responseText = '';
    let lastEdit = Date.now();
    let sentMessage: any = null;
    
    const stream = await openAIService.streamCompletion(messages, userId);
    
    for await (const chunk of stream) {
      responseText += chunk;
      
      // Update message every second to avoid rate limits
      if (Date.now() - lastEdit > 1000) {
        if (sentMessage) {
          await ctx.telegram.editMessageText(
            chatId,
            sentMessage.message_id,
            undefined,
            responseText
          ).catch(() => {}); // Ignore edit errors
        } else {
          sentMessage = await ctx.reply(responseText);
        }
        lastEdit = Date.now();
      }
    }
    
    // Final update
    if (sentMessage) {
      await ctx.telegram.editMessageText(
        chatId,
        sentMessage.message_id,
        undefined,
        responseText
      ).catch(() => {});
    } else {
      await ctx.reply(responseText);
    }
    
    // Save assistant response
    await chatRepository.addMessage(chat.id, {
      role: 'assistant',
      content: responseText
    });
    
    // Log analytics
    await analyticsService.trackMessage(userId, chat.id, responseText.length);
    
  } catch (error) {
    logger.error('Error handling text message:', error);
    await ctx.reply('Sorry, an error occurred. Please try again.');
  } finally {
    clearInterval(typingInterval);
  }
}