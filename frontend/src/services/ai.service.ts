const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:8000";

export const aiService = {
  async chat(token: string, question: string, sessionId: string) {
    const res = await fetch(`${AGENT_URL}/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        question: question.trim(),
        session_id: sessionId,
      }),
    });

    if (!res.ok || !res.body) {
      throw new Error(`Agent error: ${res.statusText}`);
    }

    return res.body.getReader();
  },

  async confirmAction(token: string, confirmId: string, approve: boolean) {
    const res = await fetch(`${AGENT_URL}/chat/confirm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ confirm_id: confirmId, approve }),
    });

    if (!res.ok) {
      throw new Error("Failed to confirm action");
    }
  },
};
