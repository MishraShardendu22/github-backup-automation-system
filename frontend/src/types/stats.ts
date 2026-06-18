export interface ToolStat {
  name: string;
  count: number;
  avg_duration: number;
  success_count: number;
  success_rate: number;
}

export interface DashboardStats {
  total_conversations: number;
  total_agent_runs: number;
  success_rate: number;
  tool_usage: ToolStat[];
  memory_stats: {
    total_messages: number;
  };
  recent_activity: {
    request_id: string;
    question: string;
    status: string;
    created_at: string;
  }[];
  system_health: {
    database: string;
    status: string;
  };
  model_name?: string;
}
