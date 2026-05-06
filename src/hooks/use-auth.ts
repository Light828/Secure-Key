import { useEffect, useState } from "react";
import { clearSession, getSession, onSessionChange, type SessionState } from "@/lib/auth-client";

export function useAuth() {
  const [session, setSession] = useState<SessionState | null>(null);

  useEffect(() => {
    setSession(getSession());
    return onSessionChange(() => setSession(getSession()));
  }, []);

  return {
    session,
    user: session?.user || null,
    token: session?.token || null,
    isAuthenticated: Boolean(session?.token),
    isAdmin: session?.user?.role === "admin",
    logout: clearSession,
  };
}
