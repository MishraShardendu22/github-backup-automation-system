export type Role = "user" | "assistant";

export interface MessageToolCall {
  name: string;
  args: any;
  success: boolean;
  running: boolean;
  duration_ms: number | null;
  result?: any;
  error?: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  streaming?: boolean;
  timestamp: Date;
  toolCalls?: MessageToolCall[];
  iteration?: number;
}

export interface StreamEvent {
  type: "info" | "agent_reasoning" | "confirm_required" | "tool_start" | "tool_end" | "token" | "done";
  iteration?: number;
  confirm_id?: string;
  name?: string;
  args?: any;
  success?: boolean;
  duration_ms?: number;
  result?: any;
  error?: string;
  text?: string;
  answer?: string;
}
