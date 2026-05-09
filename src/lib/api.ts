const RAW_API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function resolveApiBase(raw: string) {
  let base = String(raw || "");
  try {
    if (typeof window !== "undefined") {
      // If someone provided just a port like ":8082", prefix hostname/protocol
      if (base.startsWith(":")) {
        base = `${window.location.protocol}//${window.location.hostname}${base}`;
      }

      // If provided a bare port number (e.g. "8082"), normalize to hostname
      if (/^\d{1,5}$/.test(base)) {
        base = `${window.location.protocol}//${window.location.hostname}:${base}`;
      }
    }
  } catch (e) {
    // ignore and fall back to raw value
  }

  return base;
}

const API_BASE = resolveApiBase(RAW_API_BASE);

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface RequestOptions extends RequestInit {
  token?: string | null;
  isFormData?: boolean;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, isFormData, ...rest } = options;

  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(payload.message || "Request failed", response.status);
  }

  return payload as T;
}

export { API_BASE };
