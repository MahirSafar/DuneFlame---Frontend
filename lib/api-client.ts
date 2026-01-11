import { API_URL } from "./config";

export interface ApiError extends Error {
  status?: number;
  data?: unknown;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setTokens(tokens: { accessToken: string; refreshToken: string } | null) {
  accessToken = tokens?.accessToken ?? null;
  refreshToken = tokens?.refreshToken ?? null;
}

async function refreshTokens(): Promise<boolean> {
  try {
    if (!refreshToken) return false;
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ accessToken, refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data?.accessToken && data?.refreshToken) {
      setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      if (typeof window !== "undefined") {
        localStorage.setItem("df_tokens", JSON.stringify({ accessToken: data.accessToken, refreshToken: data.refreshToken }));
      }
      return true;
    }
  } catch (e) {
    // ignore
  }
  return false;
}

export async function apiFetch<T>(path: string, init: RequestInit & { method?: HttpMethod } = {}): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as any),
  };
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  const doFetch = async () =>
    fetch(url, {
      ...init,
      headers,
      credentials: "include",
    });

  let res = await doFetch();

  if (res.status === 401) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      // Retry with new access token
      const retryHeaders = { ...headers };
      if (accessToken) retryHeaders["Authorization"] = `Bearer ${accessToken}`;
      res = await fetch(url, { ...init, headers: retryHeaders, credentials: "include" });
    }
  }

  if (!res.ok) {
    let data: any = undefined;
    try {
      data = await res.json();
    } catch {}
    const err: ApiError = new Error(data?.message || `Request failed with ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as unknown as T);
}
