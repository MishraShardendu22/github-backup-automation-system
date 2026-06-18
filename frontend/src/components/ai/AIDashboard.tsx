"use client";

import { useEffect, useRef, useState } from "react";
import { LoginPanel, MessageBubble, WorkflowDiagram } from "@/components/ai";
import { LoaderPanel, MetricCard, ToolBadge } from "@/components/ui";
import { LOADING_MESSAGES, PREMADE_PROMPTS } from "@/constants";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import { useSessions } from "@/hooks/useSessions";
import { useStats } from "@/hooks/useStats";
import { useStreamingAgent } from "@/hooks/useStreamingAgent";

const PlusIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const DashboardIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <rect x="3" y="3" width="7" height="9" />
    <rect x="14" y="3" width="7" height="5" />
    <rect x="14" y="12" width="7" height="9" />
    <rect x="3" y="16" width="7" height="5" />
  </svg>
);
const ChatIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const EditIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const TrashIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);
const LockIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export function AIDashboard() {
  const {
    auth,
    login,
    logout,
    loading: authLoading,
    error: authError,
    isAuthenticated,
  } = useAuth();
  const {
    stats,
    loading: statsLoading,
    refresh: refreshStats,
  } = useStats(auth.token);
  const {
    sessions,
    loading: sessionsLoading,
    error: sessionsError,
    createSession,
    renameSession,
    deleteSession,
  } = useSessions(auth.token);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<"dashboard" | "chat">(
    "dashboard",
  );
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(
    null,
  );
  const [renameInput, setRenameInput] = useState("");
  const [input, setInput] = useState("");
  const [loadMsg, setLoadMsg] = useState("");

  const {
    messages,
    loading: messagesLoading,
    addMessage,
    updateMessage,
    clearMessages,
  } = useChat(auth.token, activeSessionId);
  const {
    sending,
    activeStep,
    activeConfirmation,
    sendMessage: sendStreamMessage,
    confirmAction,
  } = useStreamingAgent({
    onLogout: logout,
    onStatsRefresh: refreshStats,
  });

  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.add("ai-page-active");
    document.body.classList.add("ai-page-active");
    return () => {
      document.documentElement.classList.remove("ai-page-active");
      document.body.classList.remove("ai-page-active");
    };
  }, []);

  useEffect(() => {
    if (statsLoading || sessionsLoading || messagesLoading) {
      setLoadMsg(
        LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)],
      );
    }
  }, [statsLoading, sessionsLoading, messagesLoading]);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (
      sessionsError &&
      (sessionsError.includes("401") ||
        sessionsError.includes("Unauthorized") ||
        sessionsError.includes("credentials"))
    ) {
      logout();
    }
  }, [sessionsError, logout]);

  const handleCreateSession = async () => {
    if (!isAuthenticated) return;
    const newSessionId = crypto.randomUUID();
    try {
      await createSession(newSessionId, "Analytics Session");
      setActiveSessionId(newSessionId);
      clearMessages();
      setCurrentView("chat");
    } catch (err: any) {
      console.error("Failed to create session:", err);
      if (
        err.message &&
        (err.message.includes("401") ||
          err.message.includes("Unauthorized") ||
          err.message.includes("credentials"))
      ) {
        logout();
      } else {
        alert(err.message || "An error occurred while creating session.");
      }
    }
  };

  const handleSendMessage = async (question: string) => {
    if (!auth.token || !question.trim() || sending) return;

    let sessionId = activeSessionId;
    try {
      if (!sessionId) {
        const newSessionId = crypto.randomUUID();
        await createSession(
          newSessionId,
          question.trim().slice(0, 30) +
            (question.trim().length > 30 ? "..." : ""),
        );
        sessionId = newSessionId;
        setActiveSessionId(newSessionId);
        setCurrentView("chat");
      } else {
        setCurrentView("chat");
      }

      await sendStreamMessage(
        auth.token,
        question,
        sessionId,
        updateMessage,
        addMessage,
      );
      setInput("");
    } catch (err: any) {
      console.error("Failed to send message:", err);
      if (
        err.message &&
        (err.message.includes("401") ||
          err.message.includes("Unauthorized") ||
          err.message.includes("credentials"))
      ) {
        logout();
      } else {
        alert(
          err.message ||
            "An error occurred while communicating with the agent.",
        );
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await deleteSession(id);
      if (activeSessionId === id) {
        setActiveSessionId(null);
        clearMessages();
        setCurrentView("dashboard");
      }
    } catch (err: any) {
      console.error("Failed to delete session:", err);
      if (
        err.message &&
        (err.message.includes("401") ||
          err.message.includes("Unauthorized") ||
          err.message.includes("credentials"))
      ) {
        logout();
      } else {
        alert(err.message || "An error occurred while deleting the session.");
      }
    }
  };

  return (
    <div className="ai-dashboard-container">
      {/* Sidebar */}
      <aside className="ai-sidebar">
        <div className="ai-sidebar-header">
          <button
            className="ai-new-chat-btn"
            onClick={handleCreateSession}
            disabled={!isAuthenticated}
            style={
              !isAuthenticated ? { opacity: 0.6, cursor: "not-allowed" } : {}
            }
          >
            {isAuthenticated ? <PlusIcon /> : <LockIcon />}
            New Analysis Chat
          </button>
        </div>

        <div className="ai-sidebar-list">
          <div
            className={`ai-session-item ${currentView === "dashboard" && !activeSessionId ? "active" : ""}`}
            onClick={() => {
              setActiveSessionId(null);
              clearMessages();
              setCurrentView("dashboard");
            }}
          >
            <div className="ai-session-title-wrap">
              <DashboardIcon />
              <span className="ai-session-title">Stats Dashboard</span>
            </div>
          </div>

          <div
            style={{
              fontSize: "10px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--text-secondary)",
              padding: "12px 12px 4px",
            }}
          >
            Chat History
          </div>

          {sessionsLoading && sessions.length === 0 ? (
            <div
              style={{
                padding: "12px 16px",
                color: "var(--text-secondary)",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                className="ai-loader-spinner"
                style={{ width: 12, height: 12, borderWidth: 1.5, margin: 0 }}
              />
              <span>Syncing history...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div
              style={{
                padding: "12px 16px",
                color: "var(--text-faint)",
                fontSize: "12.5px",
              }}
            >
              No active conversations.
            </div>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                className={`ai-session-item ${activeSessionId === s.id ? "active" : ""}`}
              >
                <div
                  className="ai-session-title-wrap"
                  onClick={() => {
                    setActiveSessionId(s.id);
                    setCurrentView("chat");
                  }}
                >
                  <ChatIcon />
                  {renamingSessionId === s.id ? (
                    <input
                      className="ai-session-rename-input"
                      value={renameInput}
                      onChange={(e) => setRenameInput(e.target.value)}
                      onBlur={() => renameSession(s.id, renameInput)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") renameSession(s.id, renameInput);
                        if (e.key === "Escape") setRenamingSessionId(null);
                      }}
                    />
                  ) : (
                    <span className="ai-session-title">{s.session_name}</span>
                  )}
                </div>
                {renamingSessionId !== s.id && (
                  <div className="ai-session-actions">
                    <button
                      className="ai-session-action-btn"
                      onClick={() => {
                        setRenamingSessionId(s.id);
                        setRenameInput(s.session_name);
                      }}
                      disabled={!isAuthenticated}
                    >
                      <EditIcon />
                    </button>
                    {isAuthenticated && (
                      <button
                        className="ai-session-action-btn delete"
                        onClick={() => handleDeleteSession(s.id)}
                      >
                        <TrashIcon />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="ai-sidebar-footer">
          <div className="ai-sidebar-footer-row" style={{ marginTop: 8 }}>
            {isAuthenticated ? (
              <>
                <span style={{ color: "var(--text)" }}>{auth.username}</span>
                <button
                  className="btn btn-outline"
                  style={{ padding: "4px 10px", fontSize: "11px" }}
                  onClick={logout}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <span style={{ color: "var(--text-secondary)" }}>
                  Guest Mode
                </span>
                <button
                  className="btn btn-outline"
                  style={{
                    padding: "4px 10px",
                    fontSize: "11px",
                    borderColor: "var(--accent)",
                    color: "var(--accent)",
                  }}
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <main className="ai-main-area">
        <header className="ai-agent-header">
          <div className="ai-agent-identity">
            <div className="ai-agent-info">
              <div className="ai-agent-name">
                GitHub Backup Observatory Agent
              </div>
              <div className="ai-agent-status">
                <span className={`ai-status-dot ${sending ? "busy" : ""}`} />
                <span>
                  {sending
                    ? "Processing Query..."
                    : "Online · Ready to analyze telemetry"}
                </span>
              </div>
            </div>
          </div>

          {sending && (
            <div style={{ flex: "1 1 auto", minWidth: 200, maxWidth: 500 }}>
              <WorkflowDiagram activeStep={activeStep} />
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: "var(--text-secondary)",
                display: "flex",
                alignItems: "center",
                gap: 4,
                whiteSpace: "nowrap",
              }}
            >
              <span>Active Model:</span>
              <code
                style={{
                  fontSize: "11px",
                  color: "var(--accent)",
                  textTransform: "none",
                  background: "rgba(212, 168, 50, 0.06)",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  border: "1px solid rgba(212, 168, 50, 0.2)",
                }}
              >
                {stats?.model_name || "loading..."}
              </code>
            </div>
            {isAuthenticated && (
              <button
                type="button"
                className="ai-new-chat-btn"
                style={{
                  width: "auto",
                  padding: "4px 12px",
                  fontSize: "11px",
                  background: "rgba(212, 168, 50, 0.12)",
                  borderColor: "var(--accent)",
                  color: "var(--accent)",
                  marginTop: 0,
                  height: 24,
                  display: "flex",
                  alignItems: "center",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
                onClick={() =>
                  handleSendMessage(
                    "Generate a full backup health report and email it to me.",
                  )
                }
                disabled={sending}
              >
                Generate & Email Report
              </button>
            )}
            <div
              className="ai-tools-list"
              style={{ marginTop: 0, flexShrink: 0 }}
            >
              <ToolBadge name="Metrics" />
              <ToolBadge name="Backup Runs" />
              <ToolBadge name="Logs" />
              <ToolBadge name="Analytics" />
            </div>
          </div>
        </header>

        <div
          className="ai-content-scroll-area"
          ref={currentView === "chat" ? feedRef : undefined}
        >
          {currentView === "dashboard" ? (
            statsLoading && !stats ? (
              <LoaderPanel message={loadMsg} />
            ) : (
              <div className="ai-dashboard-panel">
                <div style={{ marginBottom: "28px" }}>
                  <div className="page-kicker">Observatory Operations</div>
                  <h1 className="hero-title" style={{ margin: "4px 0" }}>
                    Backup Agent Dashboard
                  </h1>
                  <p
                    className="hero-subtitle"
                    style={{ fontSize: "14px", color: "var(--text-secondary)" }}
                  >
                    Real-time analysis statistics from agent database
                    executions, success parameters, and tool call distribution
                    metrics.
                  </p>
                </div>

                <div className="ai-dashboard-grid">
                  <MetricCard
                    label="Total Conversations"
                    value={stats?.total_conversations ?? 0}
                  />
                  <MetricCard
                    label="Agent Executions"
                    value={stats?.total_agent_runs ?? 0}
                  />
                  <MetricCard
                    label="Model Success Rate"
                    value={
                      stats ? `${stats.success_rate.toFixed(1)}%` : "100.0%"
                    }
                  />
                  <MetricCard
                    label="Database Memory"
                    value={`${stats?.memory_stats.total_messages ?? 0} msgs`}
                  />
                </div>

                <div className="ai-dashboard-section-title">
                  Telemetry Tool Call Statistics
                </div>
                <div
                  className="ai-rich-table-container"
                  style={{ marginBottom: 32 }}
                >
                  <table className="ai-rich-table">
                    <thead>
                      <tr>
                        <th>Tool Name</th>
                        <th>Invocations</th>
                        <th>Avg Latency</th>
                        <th>Success Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats?.tool_usage && stats.tool_usage.length > 0 ? (
                        stats.tool_usage.map((tool, idx) => (
                          <tr key={idx}>
                            <td
                              style={{
                                fontFamily: "monospace",
                                color: "var(--accent)",
                                fontSize: "12.5px",
                              }}
                            >
                              {tool.name}
                            </td>
                            <td>{tool.count} runs</td>
                            <td>{tool.avg_duration.toFixed(0)} ms</td>
                            <td>
                              <span
                                className={`badge ${tool.success_rate > 90 ? "badge-success" : "badge-warning"}`}
                              >
                                {tool.success_rate.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            style={{
                              textAlign: "center",
                              color: "var(--text-secondary)",
                              padding: 20,
                            }}
                          >
                            No tool call logs recorded in the database yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="ai-dashboard-section-title">
                  Ask the Agent About Backups
                </div>
                <div className="premadeGrid" style={{ marginTop: 12 }}>
                  {PREMADE_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className="premadeBtn"
                      onClick={() => {
                        if (isAuthenticated) {
                          handleSendMessage(prompt);
                        }
                      }}
                      disabled={sending || !isAuthenticated}
                      style={
                        !isAuthenticated
                          ? {
                              opacity: 0.6,
                              cursor: "not-allowed",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                            }
                          : {}
                      }
                    >
                      {!isAuthenticated && <LockIcon />}
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )
          ) : (
            <div className="ai-chat-messages">
              {messagesLoading ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "200px",
                    color: "var(--text-secondary)",
                    fontSize: "14px",
                  }}
                >
                  <LoaderPanel
                    message={loadMsg || "Retrieving conversation history..."}
                  />
                </div>
              ) : messages.length === 0 ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "200px",
                    color: "var(--text-secondary)",
                    fontSize: "14px",
                  }}
                >
                  No messages in this chat session yet. Ask a question below to
                  start.
                </div>
              ) : (
                messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
              )}
            </div>
          )}
        </div>

        <div className="ai-chat-composer-wrap">
          {isAuthenticated ? (
            <form
              onSubmit={handleSubmit}
              className="composerWrap"
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
              }}
            >
              <textarea
                className="composer"
                style={{
                  flex: 1,
                  minHeight: "38px",
                  height: "38px",
                  maxHeight: "80px",
                  resize: "none",
                  margin: 0,
                  padding: "8px 12px",
                  lineHeight: "20px",
                }}
                placeholder={
                  currentView === "dashboard"
                    ? "Type here to start a new analysis chat..."
                    : "Ask the agent anything about your backups..."
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(input);
                  }
                }}
                disabled={sending}
                rows={1}
              />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  flexShrink: 0,
                }}
              >
                <button
                  type="submit"
                  className="sendBtn"
                  style={{
                    height: "32px",
                    padding: "0 16px",
                    marginTop: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12.5px",
                  }}
                  disabled={sending || !input.trim()}
                >
                  {sending ? "Processing…" : "Execute Reasoning →"}
                </button>
                <span
                  className="promptHint"
                  style={{
                    fontSize: "10px",
                    margin: 0,
                    color: "var(--text-secondary)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {sending
                    ? "Agent reasoning…"
                    : "Enter to send · Shift+Enter new line"}
                </span>
              </div>
            </form>
          ) : (
            <LoginPanel
              onLogin={login}
              loading={authLoading}
              error={authError}
            />
          )}
        </div>
      </main>

      {activeConfirmation && (
        <div className="ai-confirm-overlay">
          <div className="ai-confirm-modal">
            <h3>Confirm Sensitive Action</h3>
            <p>
              The agent wants to execute the tool{" "}
              <code>{activeConfirmation.name}</code> to send an email report:
            </p>
            <div className="ai-confirm-details">
              <div>
                <strong>Subject:</strong>{" "}
                {String(activeConfirmation.args?.subject || "")}
              </div>
              <div style={{ marginTop: 4 }}>
                <strong>Recipients:</strong>{" "}
                {Array.isArray(activeConfirmation.args?.recipients)
                  ? activeConfirmation.args.recipients.join(", ")
                  : "Default Recipient (SMTP_TO)"}
              </div>
            </div>
            <div className="ai-confirm-actions">
              <button
                type="button"
                className="ai-confirm-btn"
                onClick={() => confirmAction(auth.token!, true)}
              >
                Yes, Send Email
              </button>
              <button
                type="button"
                className="ai-confirm-btn-abort"
                onClick={() => confirmAction(auth.token!, false)}
              >
                No, Abort
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
