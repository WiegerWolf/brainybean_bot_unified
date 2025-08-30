export interface Tool {
  name: string;
  description: string;
  parameters?: any;
  execute: (args: any, context?: any) => Promise<string>;
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters?: any;
  };
}