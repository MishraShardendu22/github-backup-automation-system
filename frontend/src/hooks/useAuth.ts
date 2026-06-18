"use client";

import { useCallback, useEffect, useState } from "react";
import { authService } from "@/services/auth.service";
import type { AuthState } from "@/types";

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({ token: null, username: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = authService.getStoredSession();
    if (stored.token && stored.username) {
      setAuth(stored);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = await authService.login(username, password);
      authService.saveSession(token, username);
      setAuth({ token, username });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Login failed");
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.clearSession();
    setAuth({ token: null, username: null });
  }, []);

  return {
    auth,
    login,
    logout,
    loading,
    error,
    isAuthenticated: !!auth.token,
  };
}
