import { getDb } from '../db/client';
import { analytics } from '../db/schema';

class AnalyticsService {
  async track(userId: number, event: string, data?: any) {
    const db = getDb();
    
    await db.insert(analytics)
      .values({
        userId,
        event,
        data: data ? JSON.stringify(data) : null
      })
      .run();
  }
  
  async trackMessage(userId: number, chatId: number, messageLength: number) {
    await this.track(userId, 'message', { chatId, length: messageLength });
  }
  
  async trackVoice(userId: number, chatId: number) {
    await this.track(userId, 'voice', { chatId });
  }
  
  async trackDocument(userId: number, chatId: number, filename: string) {
    await this.track(userId, 'document', { chatId, filename });
  }
  
  async trackError(userId: number, error: string) {
    await this.track(userId, 'error', { error });
  }
}

export const analyticsService = new AnalyticsService();