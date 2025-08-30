import { Context } from 'telegraf';
import { spawn } from 'node:child_process';
import { openAIService } from '../services/openai';
import { chatRepository } from '../db/repositories/chat';
import { analyticsService } from '../services/analytics';
import { logger } from '../utils/logger';

async function convertVoiceToMp3(oggBuffer: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-i', 'pipe:0',   // input from stdin
      '-ac', '1',       // mono
      '-ar', '16000',   // sample rate 16 kHz (voice-optimized)
      '-b:a', '32k',    // bitrate
      '-f', 'mp3',      // output format
      'pipe:1'          // output to stdout
    ]);
    
    const chunks: Buffer[] = [];
    ffmpeg.stdout.on('data', chunk => chunks.push(chunk));
    ffmpeg.on('error', reject);
    ffmpeg.on('close', code => {
      if (code !== 0) return reject(new Error(`ffmpeg exited with code ${code}`));
      resolve(Buffer.concat(chunks));
    });
    
    ffmpeg.stdin.write(oggBuffer);
    ffmpeg.stdin.end();
  });
}

export async function handleVoiceMessage(ctx: Context) {
  const chatId = ctx.chat!.id;
  const userId = ctx.from!.id;
  const voice = (ctx.message as any).voice;
  const caption = (ctx.message as any).caption;
  
  const typingInterval = setInterval(() => {
    ctx.sendChatAction('typing');
  }, 4000);
  
  try {
    // Get voice file
    const fileLink = await ctx.telegram.getFileLink(voice.file_id);
    const response = await fetch(fileLink.href);
    const oggBuffer = Buffer.from(await response.arrayBuffer());
    
    // Convert to MP3
    const mp3Buffer = await convertVoiceToMp3(oggBuffer);
    
    // Get or create chat
    const chat = await chatRepository.getOrCreate(userId, chatId);
    
    // Add caption if present
    if (caption) {
      await chatRepository.addMessage(chat.id, {
        role: 'user',
        content: caption
      });
    }
    
    // Add voice message
    await chatRepository.addMessage(chat.id, {
      role: 'user',
      content: [{
        type: 'input_audio',
        input_audio: {
          data: mp3Buffer.toString('base64'),
          format: 'mp3'
        }
      }]
    });
    
    // Get response
    const messages = await chatRepository.getMessages(chat.id);
    const response = await openAIService.completion(messages, userId);
    
    await ctx.reply(response.content || 'I received your voice message.');
    
    // Save response
    await chatRepository.addMessage(chat.id, {
      role: 'assistant',
      content: response.content
    });
    
    await analyticsService.trackVoice(userId, chat.id);
    
  } catch (error) {
    logger.error('Error handling voice message:', error);
    await ctx.reply('Sorry, I couldn\'t process your voice message.');
  } finally {
    clearInterval(typingInterval);
  }
}