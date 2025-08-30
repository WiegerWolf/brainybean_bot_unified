import { eq, desc, and } from 'drizzle-orm';
import { getDb } from '../client';
import { chats, messages } from '../schema';
import { logger } from '../../utils/logger';

class ChatRepository {
  async getOrCreate(userId: number, telegramChatId: number) {
    const db = getDb();
    
    // Try to find existing chat
    let chat = await db.select().from(chats)
      .where(and(
        eq(chats.userId, userId),
        eq(chats.telegramChatId, telegramChatId)
      ))
      .orderBy(desc(chats.updatedAt))
      .get();
    
    if (!chat) {
      // Create new chat
      chat = await db.insert(chats)
        .values({ userId, telegramChatId })
        .returning()
        .get();
      
      // Add system message
      await this.addMessage(chat.id, {
        role: 'system',
        content: 'You are a helpful assistant.'
      });
      
      logger.info(`New chat created for user ${userId}`);
    }
    
    return chat;
  }
  
  async addMessage(chatId: number, message: any) {
    const db = getDb();
    
    const content = typeof message.content === 'string' 
      ? message.content 
      : JSON.stringify(message.content);
    
    return db.insert(messages)
      .values({
        chatId,
        role: message.role,
        content,
        metadata: message.metadata
      })
      .returning()
      .get();
  }
  
  async getMessages(chatId: number, limit = 50) {
    const db = getDb();
    
    const results = await db.select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .all();
    
    // Reverse to get chronological order and parse content
    return results.reverse().map(msg => ({
      role: msg.role,
      content: msg.content?.startsWith('[') || msg.content?.startsWith('{')
        ? JSON.parse(msg.content)
        : msg.content
    }));
  }
  
  async clearHistory(telegramChatId: number) {
    const db = getDb();
    
    // Find and delete all messages for this chat
    const chat = await db.select().from(chats)
      .where(eq(chats.telegramChatId, telegramChatId))
      .get();
    
    if (chat) {
      await db.delete(messages).where(eq(messages.chatId, chat.id));
      logger.info(`Chat history cleared for chat ${telegramChatId}`);
    }
  }
}

export const chatRepository = new ChatRepository();