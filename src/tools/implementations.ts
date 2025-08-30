import { toolRegistry } from './registry';
import { usageRepository } from '../db/repositories/usage';
import { getDb } from '../db/client';
import { users, chats, messages } from '../db/schema';
import { eq, sql, count } from 'drizzle-orm';

// Get user stats tool
toolRegistry.register({
  name: 'get_user_stats',
  description: 'Get user statistics including messages, cost, and tokens',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute(args: any, context?: any) {
    const userId = context?.userId;
    if (!userId) return 'User ID not found';
    
    const stats = await usageRepository.getUserStats(userId);
    
    return `📊 Your Statistics:
• Messages: ${stats.messageCount}
• Tokens used: ${stats.totalTokens}
• Total cost: $${stats.totalCost.toFixed(4)}
• Avg cost/message: $${(stats.totalCost / stats.messageCount).toFixed(4)}`;
  }
});

// Get all stats (admin only)
toolRegistry.register({
  name: 'get_all_stats',
  description: 'Get statistics for all users (admin only)',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  },
  async execute(args: any, context?: any) {
    const stats = await usageRepository.getAllStats();
    
    return `📊 Global Statistics:
• Total users: ${stats.uniqueUsers}
• Total messages: ${stats.messageCount}
• Total tokens: ${stats.totalTokens}
• Total cost: $${stats.totalCost.toFixed(2)}`;
  }
});

// Export for direct use
export async function getStats(userId: number, isAdmin: boolean): Promise<string> {
  if (isAdmin) {
    const stats = await usageRepository.getAllStats();
    return `📊 *Global Statistics*
• Total users: ${stats.uniqueUsers}
• Total messages: ${stats.messageCount}
• Total tokens: ${stats.totalTokens}
• Total cost: $${stats.totalCost.toFixed(2)}`;
  } else {
    const stats = await usageRepository.getUserStats(userId);
    return `📊 *Your Statistics*
• Messages: ${stats.messageCount}
• Tokens used: ${stats.totalTokens}
• Total cost: $${stats.totalCost.toFixed(4)}`;
  }
}