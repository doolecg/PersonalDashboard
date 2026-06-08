import { calendarTool, notesTool, remindersTool, todosTool } from "./dashboardTools.js";
import type { AssistantTool } from "./types.js";
import { weatherTool } from "./weatherTool.js";

// All tools the assistant can call. Add new dashboard capabilities here and
// they become available to the model with no other wiring required.
export const assistantTools: AssistantTool[] = [weatherTool, todosTool, remindersTool, notesTool, calendarTool];

const toolsByName = new Map(assistantTools.map((tool) => [tool.name, tool]));

export function getAssistantTool(name: string): AssistantTool | undefined {
  return toolsByName.get(name);
}

// Shape the tool list for the OpenAI chat-completions `tools` parameter.
export function toolSpecsForOpenAi() {
  return assistantTools.map((tool) => ({
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }
  }));
}
