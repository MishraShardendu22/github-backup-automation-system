const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:8000";

interface Session {
  id: string;
  session_name: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  tool_calls?: any[];
}

export const sessionService = {
  async list(token?: string | null): Promise<Session[]> {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${AGENT_URL}/sessions`, { headers });
    if (!res.ok) throw new Error("Failed to fetch sessions");

    const data = await res.json();
    return data.data || [];
  },

  async create(token: string, id: string, name: string): Promise<void> {
    const res = await fetch(`${AGENT_URL}/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id, session_name: name }),
    });

    if (!res.ok) throw new Error("Failed to create session");
  },

  async rename(token: string, id: string, name: string): Promise<void> {
    const res = await fetch(`${AGENT_URL}/sessions/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ session_name: name.trim() }),
    });

    if (!res.ok) throw new Error("Failed to rename session");
  },

  async delete(token: string, id: string): Promise<void> {
    const res = await fetch(`${AGENT_URL}/sessions/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Failed to delete session");
  },

  async getMessages(
    token: string | null,
    sessionId: string,
  ): Promise<Message[]> {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${AGENT_URL}/sessions/${sessionId}/messages`, {
      headers,
    });
    if (!res.ok) throw new Error("Failed to load messages");

    const data = await res.json();
    return data.data || [];
  },
};
