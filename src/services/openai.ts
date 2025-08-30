import OpenAI from 'openai';
import { config } from '../utils/config';
import { usageRepository } from '../db/repositories/usage';
import { toolRegistry } from '../tools/registry';

class OpenAIService {
  private client: OpenAI;
  
  constructor() {
    this.client = new OpenAI({
      baseURL: config.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      apiKey: config.OPENAI_API_KEY,
    });
  }
  
  async *streamCompletion(messages: any[], userId: number) {
    const stream = await this.client.chat.completions.create({
      model: config.MODEL,
      messages,
      stream: true,
      tools: toolRegistry.getToolDefinitions(),
      tool_choice: 'auto',
      user: userId.toString(),
    });
    
    let fullResponse = '';
    let usage: any = null;
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        yield content;
      }
      
      // Handle tool calls if needed
      const toolCalls = chunk.choices[0]?.delta?.tool_calls;
      if (toolCalls) {
        // Process tool calls
        for (const toolCall of toolCalls) {
          const result = await toolRegistry.execute(toolCall);
          yield `\n${result}\n`;
        }
      }
      
      // Track usage
      if (chunk.usage) {
        usage = chunk.usage;
      }
    }
    
    // Log usage
    if (usage) {
      await usageRepository.log(userId, usage, config.MODEL);
    }
  }
  
  async completion(messages: any[], userId: number) {
    const response = await this.client.chat.completions.create({
      model: config.MODEL,
      messages,
      tools: toolRegistry.getToolDefinitions(),
      tool_choice: 'auto',
      user: userId.toString(),
    });
    
    // Log usage
    if (response.usage) {
      await usageRepository.log(userId, response.usage, config.MODEL);
    }
    
    return response.choices[0].message;
  }
}

export const openAIService = new OpenAIService();