import { test, expect, describe, beforeEach, mock } from 'bun:test';
import { openAIService } from '../src/services/openai';
import { analyticsService } from '../src/services/analytics';

describe('OpenAI Service', () => {
  test('handles streaming completion', async () => {
    const messages = [
      { role: 'system', content: 'You are a helpful assistant' },
      { role: 'user', content: 'Hello' }
    ];
    
    const chunks: string[] = [];
    const stream = await openAIService.streamCompletion(messages, 123);
    
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    
    expect(chunks.length).toBeGreaterThan(0);
  });
  
  test('handles regular completion', async () => {
    const messages = [
      { role: 'system', content: 'You are a helpful assistant' },
      { role: 'user', content: 'Hello' }
    ];
    
    const response = await openAIService.completion(messages, 123);
    
    expect(response).toHaveProperty('content');
    expect(response.role).toBe('assistant');
  });
});

describe('Analytics Service', () => {
  test('tracks messages correctly', async () => {
    const trackSpy = mock(() => {});
    analyticsService.track = trackSpy;
    
    await analyticsService.trackMessage(123, 456, 100);
    
    expect(trackSpy).toHaveBeenCalledWith(123, 'message', {
      chatId: 456,
      length: 100
    });
  });
  
  test('tracks errors correctly', async () => {
    const trackSpy = mock(() => {});
    analyticsService.track = trackSpy;
    
    await analyticsService.trackError(123, 'Test error');
    
    expect(trackSpy).toHaveBeenCalledWith(123, 'error', {
      error: 'Test error'
    });
  });
});