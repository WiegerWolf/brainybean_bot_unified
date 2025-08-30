import { eq } from 'drizzle-orm';
import { getDb } from '../client';
import { users } from '../schema';
import { logger } from '../../utils/logger';

class UserRepository {
  async getOrCreate(telegramId: number, userData: any) {
    const db = getDb();
    
    // Try to find existing user
    let user = await db.select().from(users)
      .where(eq(users.telegramId, telegramId))
      .get();
    
    if (!user) {
      // Create new user
      const name = userData.last_name 
        ? `${userData.first_name} ${userData.last_name}`
        : userData.first_name || 'Unknown';
      
      user = await db.insert(users)
        .values({
          telegramId,
          name,
          languageCode: userData.language_code || 'en'
        })
        .returning()
        .get();
      
      logger.info(`New user created: ${name} (${telegramId})`);
    }
    
    return user;
  }
  
  async findById(id: number) {
    const db = getDb();
    return db.select().from(users).where(eq(users.id, id)).get();
  }
}

export const userRepository = new UserRepository();