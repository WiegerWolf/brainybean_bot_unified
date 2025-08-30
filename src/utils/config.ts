import { z } from 'zod';

const configSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string(),
  OPENAI_API_KEY: z.string(),
  MODEL: z.string().default('gpt-4o'),
  DATABASE_URL: z.string().default('./data/bot.db'),
  WHITELIST: z.string().transform(s => s.split(',').map(id => parseInt(id.trim()))),
  OPENAI_BASE_URL: z.string().optional(),
  ENABLE_STREAMING: z.boolean().default(true),
  ENABLE_TOOLS: z.boolean().default(true),
  ENABLE_VOICE: z.boolean().default(true),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

class Config {
  private data: z.infer<typeof configSchema>;
  
  constructor() {
    this.data = configSchema.parse(process.env);
  }
  
  get TELEGRAM_BOT_TOKEN() { return this.data.TELEGRAM_BOT_TOKEN; }
  get OPENAI_API_KEY() { return this.data.OPENAI_API_KEY; }
  get MODEL() { return this.data.MODEL; }
  get DATABASE_URL() { return this.data.DATABASE_URL; }
  get OPENAI_BASE_URL() { return this.data.OPENAI_BASE_URL; }
  
  isWhitelisted(userId: number): boolean {
    return this.data.WHITELIST.includes(userId);
  }
  
  isAdmin(userId: number): boolean {
    return this.data.WHITELIST[0] === userId;
  }
}

export const config = new Config();