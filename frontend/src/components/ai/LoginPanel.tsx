import { useState } from "react";

interface LoginPanelProps {
  onLogin: (username: string, password: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function LoginPanel({ onLogin, loading, error }: LoginPanelProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) onLogin(username, password);
  };

  return (
    <div className="ai-login-panel">
      <div className="ai-login-icon" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a5 5 0 0 1 5 5v2H7V7a5 5 0 0 1 5-5z" />
          <rect x="3" y="9" width="18" height="13" rx="2" />
          <circle cx="12" cy="15" r="1.5" />
        </svg>
      </div>
      <p className="ai-login-label">Sign in to access the AI Observatory Dashboard</p>
      <form onSubmit={handleSubmit} className="ai-login-form" noValidate>
        <input
          type="text"
          className="ai-login-input"
          placeholder="Username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          className="ai-login-input"
          placeholder="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p role="alert" className="ai-login-error">{error}</p>}
        <button type="submit" className="sendBtn" disabled={loading || !username || !password} style={{ width: "100%", marginTop: 4 }}>
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
