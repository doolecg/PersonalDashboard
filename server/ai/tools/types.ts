// A dashboard "function" the AI assistant can call. Register new capabilities
// in registry.ts and the assistant exposes them to the model automatically.
export type ToolContext = {
  /** Verified Supabase user id (or "local" in dev mode). Tools must scope all data access to it. */
  userId: string;
};

export type AssistantTool = {
  name: string;
  description: string;
  /** JSON Schema for the tool arguments (OpenAI function-calling format). */
  parameters: Record<string, unknown>;
  execute: (args: Record<string, unknown>, ctx: ToolContext) => Promise<unknown>;
};
