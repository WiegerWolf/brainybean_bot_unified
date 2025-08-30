import { eq, sql } from 'drizzle-orm';
import { getDb } from '../client';
import { usage } from '../schema';

const MODEL_PRICING: Record<string, { prompt: number; completion: number }> = {
  'gpt-4o': { prompt: 0.005, completion: 0.015 },
  'gpt-4-turbo': { prompt: 0.01, completion: 0.03 },
  'gpt-4': { prompt: 0.03, completion: 0.06 },
  'gpt-3.5-turbo': { prompt: 0.0005, completion: 0.0015 },
  'claude-3-opus': { prompt: 0.015, completion: 0.075 },
  'claude-3-sonnet': { prompt: 0.003, completion: 0.015 },
};

class UsageRepository {
  async log(userId: number, usageData: any, model: string, chatId?: number) {
    const db = getDb();
    
    // Calculate cost
    const pricing = MODEL_PRICING[model] || { prompt: 0, completion: 0 };
    const costInCents = (
      (usageData.prompt_tokens * pricing.prompt / 1000) +
      (usageData.completion_tokens * pricing.completion / 1000)
    ) * 100;
    
    return db.insert(usage)
      .values({
        userId,
        chatId,
        model,
        promptTokens: usageData.prompt_tokens,
        completionTokens: usageData.completion_tokens,
        totalTokens: usageData.total_tokens,
        costInCents
      })
      .returning()
      .get();
  }
  
  async getUserStats(userId: number) {
    const db = getDb();
    
    const result = await db.select({
      totalCost: sql`SUM(${usage.costInCents})`.mapWith(Number),
      totalTokens: sql`SUM(${usage.totalTokens})`.mapWith(Number),
      messageCount: sql`COUNT(*)`.mapWith(Number)
    })
    .from(usage)
    .where(eq(usage.userId, userId))
    .get();
    
    return {
      totalCost: (result?.totalCost || 0) / 100,
      totalTokens: result?.totalTokens || 0,
      messageCount: result?.messageCount || 0
    };
  }
  
  async getAllStats() {
    const db = getDb();
    
    const result = await db.select({
      totalCost: sql`SUM(${usage.costInCents})`.mapWith(Number),
      totalTokens: sql`SUM(${usage.totalTokens})`.mapWith(Number),
      messageCount: sql`COUNT(*)`.mapWith(Number),
      uniqueUsers: sql`COUNT(DISTINCT ${usage.userId})`.mapWith(Number)
    })
    .from(usage)
    .get();
    
    return {
      totalCost: (result?.totalCost || 0) / 100,
      totalTokens: result?.totalTokens || 0,
      messageCount: result?.messageCount || 0,
      uniqueUsers: result?.uniqueUsers || 0
    };
  }
}

export const usageRepository = new UsageRepository();