import { Context } from 'telegraf';
import { spawn } from 'node:child_process';
import { openAIService } from '../services/openai';
import { chatRepository } from '../db/repositories/chat';
import { analyticsService } from '../services/analytics';
import { withErrorHandling } from './errorHandler';

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

export const handleVoiceMessage = withErrorHandling(async (ctx: Context) => {
  const chatId = ctx.chat!.id;
  const userId = ctx.from!.id;
  const voice = (ctx.message as any).voice;
  const caption = (ctx.message as any).caption;
  
  
    // Get voice file
    const fileLink = await ctx.telegram.getFileLink(voice.file_id);
  const fetchResponse = await fetch(fileLink.href);
  const oggBuffer = Buffer.from(await fetchResponse.arrayBuffer());
    
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
    const aiResponse = await openAIService.completion(messages, userId);

    const replyText = aiResponse.content || 'I received your voice message.';
    await ctx.reply(replyText);

    // Save response
    await chatRepository.addMessage(chat.id, {
      role: 'assistant',
      content: replyText
    });
    
    await analyticsService.trackVoice(userId, chat.id);
    
  });