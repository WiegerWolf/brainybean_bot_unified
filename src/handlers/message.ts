import type { BotContext } from "../commands";
import { openAIService } from "../services/openai";
import { chatRepository } from "../db/repositories/chat";
import { analyticsService } from "../services/analytics";
import { withErrorHandling } from "./errorHandler";
import { sendMessage, editMessage } from "../services/telegram";

export const handleTextMessage = withErrorHandling(async (ctx: BotContext) => {
  const chatId = ctx.chat!.id;
  const userId = ctx.from!.id;
  const text = (ctx.message as any).text as string | undefined;
  if (!text) {
    await ctx.reply('Please send a text message.');
    return;
  }

  
    // Get or create chat
    const chat = await chatRepository.getOrCreate(userId, chatId);

    // Add user message to history
    await chatRepository.addMessage(chat.id, {
      role: "user",
      content: text,
    });

    // Get chat history
    const messages = await chatRepository.getMessages(chat.id);

    // Stream response
    let responseText = "";
    let lastEdit = Date.now();
    let sentMessage: any = null;
    const MAX = 4096, SAFE = 3800;
    let lastSentIdx = 0;

    const stream = await openAIService.streamCompletion(messages, userId);

    for await (const chunk of stream) {
      responseText += chunk;

      // Update message every second to avoid rate limits
      if (Date.now() - lastEdit > 1000) {
        if (!sentMessage) {
          sentMessage = await sendMessage(chatId, responseText.slice(lastSentIdx));
          lastSentIdx = responseText.length;
        } else if (responseText.length <= SAFE) {
          await editMessage(chatId, sentMessage.message_id, responseText);
          lastSentIdx = responseText.length;
        } else if (responseText.length - lastSentIdx > 500) {
          await sendMessage(chatId, responseText.slice(lastSentIdx));
          lastSentIdx = responseText.length;
        }
        lastEdit = Date.now();
      }
    }

    // On finalization, send any remaining tail
    if (responseText.length > lastSentIdx) {
      await sendMessage(chatId, responseText.slice(lastSentIdx));
    }

    // Save assistant response
    await chatRepository.addMessage(chat.id, {
      role: "assistant",
      content: responseText,
    });

    // Log analytics
    await analyticsService.trackMessage(userId, chat.id, responseText.length);
  });
