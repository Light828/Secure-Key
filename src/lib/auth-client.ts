export interface SessionUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  addressLine?: string | null;
  city?: string | null;
  role: "client" | "admin";
}

export interface SessionState {
  token: string;
  user: SessionUser;
}

const SESSION_KEY = "locksmith_session";
const EVENT_NAME = "locksmith-auth-change";

export function getSession(): SessionState | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SessionState;
  } catch {
    return null;
  }
}

export function setSession(session: SessionState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function onSessionChange(callback: () => void) {
  if (typeof window === "undefined") return () => {};

  const listener = () => callback();
  window.addEventListener(EVENT_NAME, listener);
  window.addEventListener("storage", listener);

  return () => {
    window.removeEventListener(EVENT_NAME, listener);
    window.removeEventListener("storage", listener);
  };
}
