import { test, expect, describe, beforeEach, afterEach } from 'bun:test';
import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from '../src/db/schema';
import { userRepository } from '../src/db/repositories/user';
import { chatRepository } from '../src/db/repositories/chat';
import { usageRepository } from '../src/db/repositories/usage';

describe('Database Repositories', () => {
  let db: ReturnType<typeof drizzle>;
  
  beforeEach(() => {
    // Use in-memory database for tests
    const sqlite = new Database(':memory:');
    db = drizzle(sqlite, { schema });
    
    // Create tables
    sqlite.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id INTEGER UNIQUE NOT NULL,
        name TEXT NOT NULL,
        language_code TEXT,
        created_at INTEGER DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        telegram_chat_id INTEGER NOT NULL,
        created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
        updated_at INTEGER DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id INTEGER NOT NULL REFERENCES chats(id),
        role TEXT NOT NULL,
        content TEXT,
        metadata TEXT,
        created_at INTEGER DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        chat_id INTEGER REFERENCES chats(id),
        model TEXT NOT NULL,
        prompt_tokens INTEGER NOT NULL,
        completion_tokens INTEGER NOT NULL,
        total_tokens INTEGER NOT NULL,
        cost_in_cents REAL,
        created_at INTEGER DEFAULT CURRENT_TIMESTAMP
      );
    `);
  });
  
  test('creates and retrieves user', async () => {
    const userData = {
      id: 123456,
      first_name: 'John',
      last_name: 'Doe',
      language_code: 'en'
    };
    
    const user = await userRepository.getOrCreate(123456, userData);
    
    expect(user.telegramId).toBe(123456);
    expect(user.name).toBe('John Doe');
    expect(user.languageCode).toBe('en');
  });
  
  test('creates and retrieves chat', async () => {
    // First create a user
    const user = await db.insert(schema.users)
      .values({
        telegramId: 123456,
        name: 'Test User',
        languageCode: 'en'
      })
      .returning()
      .get();
    
    const chat = await chatRepository.getOrCreate(user.id, 789);
    
    expect(chat.userId).toBe(user.id);
    expect(chat.telegramChatId).toBe(789);
  });
  
  test('adds and retrieves messages', async () => {
    // Create user and chat
    const user = await db.insert(schema.users)
      .values({
        telegramId: 123456,
        name: 'Test User',
        languageCode: 'en'
      })
      .returning()
      .get();
    
    const chat = await db.insert(schema.chats)
      .values({
        userId: user.id,
        telegramChatId: 789
      })
      .returning()
      .get();
    
    // Add messages
    await chatRepository.addMessage(chat.id, {
      role: 'user',
      content: 'Hello'
    });
    
    await chatRepository.addMessage(chat.id, {
      role: 'assistant',
      content: 'Hi there!'
    });
    
    const messages = await chatRepository.getMessages(chat.id);
    
    expect(messages).toHaveLength(2);
    expect(messages[0].content).toBe('Hello');
    expect(messages[1].content).toBe('Hi there!');
  });
  
  test('logs and calculates usage correctly', async () => {
    const user = await db.insert(schema.users)
      .values({
        telegramId: 123456,
        name: 'Test User',
        languageCode: 'en'
      })
      .returning()
      .get();
    
    const usageData = {
      prompt_tokens: 100,
      completion_tokens: 50,
      total_tokens: 150
    };
    
    await usageRepository.log(user.id, usageData, 'gpt-4o');
    
    const stats = await usageRepository.getUserStats(user.id);
    
    expect(stats.messageCount).toBe(1);
    expect(stats.totalTokens).toBe(150);
    expect(stats.totalCost).toBeGreaterThan(0);
  });
});