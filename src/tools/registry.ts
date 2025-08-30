import { Tool, ToolDefinition } from './types';
import { logger } from '../utils/logger';

class ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  
  register(tool: Tool) {
    this.tools.set(tool.name, tool);
    logger.debug(`Registered tool: ${tool.name}`);
  }
  
  getToolDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }
    }));
  }
  
  async execute(toolCall: any): Promise<string> {
    const tool = this.tools.get(toolCall.function.name);
    if (!tool) {
      throw new Error(`Unknown tool: ${toolCall.function.name}`);
    }
    
    const args = JSON.parse(toolCall.function.arguments);
    return await tool.execute(args);
  }
}

export const toolRegistry = new ToolRegistry();