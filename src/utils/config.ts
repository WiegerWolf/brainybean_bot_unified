import { z } from 'zod';

const configSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1, 'TELEGRAM_BOT_TOKEN is required'),
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  MODEL: z.string().default('gpt-4o'),
  DATABASE_URL: z.string().default('./data/bot.db'),
  WHITELIST: z.string().default('').transform(s => s.trim() === '' ? [] : s.split(',').map(id => parseInt(id.trim()))),
  OPENAI_BASE_URL: z.string().optional(),
  ENABLE_STREAMING: z.preprocess((val) => {
    if (typeof val === 'string') return val.toLowerCase() === 'true' || val === '1';
    return val;
  }, z.boolean().default(true)),
  ENABLE_TOOLS: z.preprocess((val) => {
    if (typeof val === 'string') return val.toLowerCase() === 'true' || val === '1';
    return val;
  }, z.boolean().default(true)),
  ENABLE_VOICE: z.preprocess((val) => {
    if (typeof val === 'string') return val.toLowerCase() === 'true' || val === '1';
    return val;
  }, z.boolean().default(true)),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

class Config {
  private data: z.infer<typeof configSchema>;
  
  constructor() {
    try {
      this.data = configSchema.parse(process.env);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const msgs = err.issues.map(i => `${i.path.join('.') || '<root>'}: ${i.message}`).join('; ');
        throw new Error(`Invalid environment configuration: ${msgs}. Copy .env.example to .env and set required variables like TELEGRAM_BOT_TOKEN and OPENAI_API_KEY.`);
      }
      throw err;
    }
  }
  
  get TELEGRAM_BOT_TOKEN() { return this.data.TELEGRAM_BOT_TOKEN; }
  get OPENAI_API_KEY() { return this.data.OPENAI_API_KEY; }
  get MODEL() { return this.data.MODEL; }
  get DATABASE_URL() { return this.data.DATABASE_URL; }
  get OPENAI_BASE_URL() { return this.data.OPENAI_BASE_URL; }
  get LOG_LEVEL() { return this.data.LOG_LEVEL; }
  
  isWhitelisted(userId: number): boolean {
    return this.data.WHITELIST.includes(userId);
  }
  
  isAdmin(userId: number): boolean {
    return this.data.WHITELIST[0] === userId;
  }
}

export const config = new Config();