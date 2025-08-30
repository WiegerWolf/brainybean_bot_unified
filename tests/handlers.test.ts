import { test, expect, describe, beforeEach } from 'bun:test';
import { handleTextMessage } from '../src/handlers/message';

describe('Message Handlers', () => {
  beforeEach(() => {
    // Setup test database
  });
  
  test('handles text messages correctly', async () => {
    const mockCtx = {
      chat: { id: 123 },
      from: { id: 456 },
      message: { text: 'Hello bot' },
      reply: jest.fn(),
      sendChatAction: jest.fn(),
    };
    
    await handleTextMessage(mockCtx as any);
    
    expect(mockCtx.reply).toHaveBeenCalled();
    expect(mockCtx.sendChatAction).toHaveBeenCalledWith('typing');
  });
  
  test('handles voice messages with transcription', async () => {
    // Test voice handling
  });
});