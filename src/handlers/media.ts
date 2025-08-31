import type { BotContext } from '../commands';
import { handleDocument } from './document';
import { withErrorHandling } from './errorHandler';

export const handlePhoto = withErrorHandling(async (ctx: BotContext) => {
  const photo = (ctx.message as any).photo;
  const largestPhoto = photo[photo.length - 1];
  
  // Convert photo to document format and reuse document handler
  (ctx.message as any).document = {
    file_id: largestPhoto.file_id,
    mime_type: 'image/jpeg',
    file_name: 'photo.jpg'
  };

  return handleDocument(ctx);
});

export const handleVideo = withErrorHandling(async (ctx: BotContext) => {
  const video = (ctx.message as any).video;
  
  // Convert video to document format and reuse document handler
  (ctx.message as any).document = {
    file_id: video.file_id,
    mime_type: video.mime_type || 'video/mp4',
    file_name: video.file_name || 'video.mp4'
  };

  return handleDocument(ctx);
});