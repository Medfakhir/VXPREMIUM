"use client";

const TOKEN_KEY = "vx_admin_token";

export class AdminRequestError extends Error {
  status: number;
  issues: Array<{ path: string; message: string }>;

  constructor(
    message: string,
    status: number,
    issues: Array<{ path: string; message: string }> = [],
  ) {
    super(message);
    this.name = "AdminRequestError";
    this.status = status;
    this.issues = issues;
  }
}

export function getAdminToken() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string) {
  window.sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(TOKEN_KEY);
}

export async function adminFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getAdminToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (response.status === 401) {
    clearAdminToken();
    window.dispatchEvent(new Event("vx:unauthorized"));
  }

  if (!response.ok) {
    let body: {
      error?: string;
      issues?: Array<{ path: string; message: string }>;
    } = {};
    try {
      body = await response.json();
    } catch {
      body = {};
    }
    throw new AdminRequestError(
      body.error ?? `Request failed (${response.status})`,
      response.status,
      body.issues,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}
