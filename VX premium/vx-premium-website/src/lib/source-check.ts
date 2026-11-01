import { decryptSecret } from "@/lib/crypto";
import type { PlaylistType, SourceCheck } from "@/lib/types";

/**
 * Server-side validation of an IPTV source.
 *
 * When an admin (or a user with their own playlist) saves a source we probe it
 * once so nobody assigns a dead playlist to a device:
 *   - Xtream: hit `player_api.php` and confirm the login is accepted.
 *   - M3U:     download the head of the file and confirm it is a real playlist.
 *
 * The probe never throws: a failure is returned as `{ ok: false, message }` so
 * the caller can show a warning without blocking the save (a provider may be
 * briefly unreachable while still being valid).
 */

/** Hard cap on how long any single probe may take. */
const CHECK_TIMEOUT_MS = 10_000;
/** Only download this much of an M3U when counting entries. */
const M3U_SAMPLE_BYTES = 2_000_000;
/** Xtream JSON is tiny; 512 KB is plenty. */
const JSON_MAX_BYTES = 512_000;

export type SourceCheckInput = {
  type: PlaylistType;
  serverUrl: string;
  username: string;
  password: string;
  m3uUrl: string;
};

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function result(
  ok: boolean,
  kind: PlaylistType,
  latencyMs: number,
  message: string,
  extra: Partial<SourceCheck> = {},
): SourceCheck {
  return {
    ok,
    kind,
    checkedAt: new Date().toISOString(),
    latencyMs,
    message,
    ...extra,
  };
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
      redirect: "follow",
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Reads at most `maxBytes` of a response body and decodes it as UTF-8. */
async function readTextLimited(
  response: Response,
  maxBytes: number,
): Promise<string> {
  const body = response.body;
  if (!body) return "";
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let text = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        received += value.byteLength;
        text += decoder.decode(value, { stream: true });
        if (received >= maxBytes) {
          try {
            await reader.cancel();
          } catch {
            /* ignore */
          }
          break;
        }
      }
    }
    text += decoder.decode();
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* ignore */
    }
  }
  return text;
}

function describeError(error: unknown, latencyMs: number): string {
  if (error instanceof DOMException && error.name === "AbortError") {
    return `No response within ${Math.round(CHECK_TIMEOUT_MS / 1000)}s — the server is unreachable or too slow.`;
  }
  const message = error instanceof Error ? error.message : String(error);
  if (/abort/i.test(message)) {
    return `No response within ${Math.round(CHECK_TIMEOUT_MS / 1000)}s — the server is unreachable or too slow.`;
  }
  return `Could not reach the server: ${message || "network error"}.`;
}

/** Turns an Xtream expiry (unix seconds/ms or ISO string) into a short label. */
function formatExpiry(value: unknown): string {
  if (value === null || value === undefined || value === "" || value === "0") {
    return "";
  }
  const num = typeof value === "number" ? value : Number(value);
  if (Number.isFinite(num) && num > 0) {
    const ms = num > 1e12 ? num : num * 1000;
    const date = new Date(ms);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10);
    }
  }
  return String(value);
}

async function checkXtream(input: SourceCheckInput): Promise<SourceCheck> {
  const started = Date.now();
  const base = input.serverUrl.trim().replace(/\/+$/, "");
  if (!isHttpUrl(base)) {
    return result(false, "xtream", 0, "Enter a valid http or https server URL.");
  }
  const url = `${base}/player_api.php?username=${encodeURIComponent(
    input.username.trim(),
  )}&password=${encodeURIComponent(input.password)}`;

  let response: Response;
  try {
    response = await fetchWithTimeout(
      url,
      { headers: { accept: "application/json, text/plain, */*" } },
      CHECK_TIMEOUT_MS,
    );
  } catch (error) {
    return result(false, "xtream", Date.now() - started, describeError(error, 0));
  }

  const latencyMs = Date.now() - started;
  const status = response.status;

  if (!response.ok) {
    return result(
      false,
      "xtream",
      latencyMs,
      `Xtream server responded HTTP ${status}.`,
      { status },
    );
  }

  let text = "";
  try {
    text = await readTextLimited(response, JSON_MAX_BYTES);
  } catch (error) {
    return result(false, "xtream", latencyMs, describeError(error, latencyMs), {
      status,
    });
  }

  let data: unknown = null;
  try {
    data = JSON.parse(text);
  } catch {
    return result(
      false,
      "xtream",
      latencyMs,
      "The server did not return Xtream JSON. Check the Server URL points at the panel root.",
      { status },
    );
  }

  if (!data || typeof data !== "object") {
    return result(false, "xtream", latencyMs, "Empty Xtream response.", {
      status,
    });
  }

  let userInfo: unknown = (data as Record<string, unknown>).user_info;
  if (Array.isArray(userInfo)) {
    userInfo = userInfo.length ? userInfo[0] : null;
  }

  if (!userInfo || typeof userInfo !== "object") {
    return result(
      false,
      "xtream",
      latencyMs,
      "Xtream login rejected — check the username and password.",
      { status },
    );
  }

  const info = userInfo as Record<string, unknown>;
  const auth = info.auth;
  const statusText = String(info.status ?? "").toLowerCase();
  const authMissing = auth === undefined || auth === null;
  const authorized =
    auth === 1 ||
    auth === true ||
    String(auth) === "1" ||
    (authMissing &&
      (statusText === "active" || statusText === "trial" || statusText === "enabled"));

  if (!authorized) {
    const expiry = formatExpiry(info.exp_date);
    return result(
      false,
      "xtream",
      latencyMs,
      `Xtream login rejected${expiry ? ` (expires ${expiry})` : ""} — check credentials or account status.`,
      { status },
    );
  }

  const expiryLabel = formatExpiry(info.exp_date);
  return result(
    true,
    "xtream",
    latencyMs,
    `Xtream login verified${expiryLabel ? `, expires ${expiryLabel}` : ""}.`,
    { status },
  );
}

async function checkM3u(input: SourceCheckInput): Promise<SourceCheck> {
  const started = Date.now();
  const url = input.m3uUrl.trim();
  if (!isHttpUrl(url)) {
    return result(false, "m3u", 0, "Enter a valid http or https M3U URL.");
  }

  let response: Response;
  try {
    response = await fetchWithTimeout(
      url,
      { headers: { accept: "*/*", "user-agent": "VXPremium-SourceCheck/1.0" } },
      CHECK_TIMEOUT_MS,
    );
  } catch (error) {
    return result(false, "m3u", Date.now() - started, describeError(error, 0));
  }

  const latencyMs = Date.now() - started;
  const status = response.status;

  if (!response.ok) {
    return result(false, "m3u", latencyMs, `M3U URL responded HTTP ${status}.`, {
      status,
    });
  }

  let text = "";
  try {
    text = await readTextLimited(response, M3U_SAMPLE_BYTES);
  } catch (error) {
    return result(false, "m3u", latencyMs, describeError(error, latencyMs), {
      status,
    });
  }

  const trimmed = text.trimStart();
  const looksLikePlaylist =
    /^#EXTM3U/i.test(trimmed) || /#EXTINF/i.test(text);

  if (!looksLikePlaylist) {
    return result(
      false,
      "m3u",
      latencyMs,
      "The URL responded but does not look like an M3U playlist (no #EXTM3U header).",
      { status },
    );
  }

  const channelCount = (text.match(/#EXTINF/gi) ?? []).length;
  if (channelCount === 0) {
    return result(
      false,
      "m3u",
      latencyMs,
      "The M3U playlist is empty (no #EXTINF entries).",
      { status, channelCount },
    );
  }

  return result(
    true,
    "m3u",
    latencyMs,
    `M3U playlist verified — ${channelCount} entries found.`,
    { status, channelCount },
  );
}

export async function checkSource(input: SourceCheckInput): Promise<SourceCheck> {
  if (input.type === "xtream") {
    return checkXtream(input);
  }
  return checkM3u(input);
}

/** Convenience wrapper for a stored playlist record (decrypts its secret). */
export async function checkPlaylistRecord(record: {
  type: PlaylistType;
  serverUrl: string;
  username: string;
  secret: Parameters<typeof decryptSecret>[0];
  epgSecret: Parameters<typeof decryptSecret>[0] | null;
}): Promise<SourceCheck> {
  let secret = "";
  try {
    secret = decryptSecret(record.secret);
  } catch {
    secret = "";
  }
  return checkSource({
    type: record.type,
    serverUrl: record.serverUrl,
    username: record.username,
    password: record.type === "xtream" ? secret : "",
    m3uUrl: record.type === "m3u" ? secret : "",
  });
}
