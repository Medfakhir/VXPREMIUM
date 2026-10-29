import { cookies } from "next/headers";
import { ApiError, errorResponse } from "@/lib/api";
import {
  deviceKeyFingerprint,
  hashToken,
  safeEqual,
} from "@/lib/crypto";
import {
  findLineByMac,
  getLine,
  normalizeDeviceKey,
  normalizeMac,
} from "@/lib/lines";
import type { LineRecord } from "@/lib/lines";
import {
  createPortalSessionRecord,
  deletePortalSessionRecord,
  PORTAL_SESSION_TTL_MS,
  readPortalSessionRecord,
} from "@/lib/portal-session-store";
import type { PortalSessionRecord } from "@/lib/portal-session-store";
import type { AdminUser, PortalLineView } from "@/lib/types";
import { getUser, isExpired } from "@/lib/users";

export const PORTAL_COOKIE = "vx_portal";

export type PortalAuthContext = {
  line: LineRecord;
  user: AdminUser;
  session: PortalSessionRecord;
  tokenHash: string;
};

export function isLineExpired(line: Pick<LineRecord, "expiresAt">) {
  return new Date(line.expiresAt).getTime() <= Date.now();
}

export function toPortalLineView(
  line: LineRecord,
  user: AdminUser,
): PortalLineView {
  return {
    id: line.id,
    name: line.name,
    mac: line.mac,
    status: line.status,
    expiresAt: line.expiresAt,
    userName: user.name,
    allowOwnPlaylists: user.allowOwnPlaylists,
    lastSeenAt: line.lastSeenAt || null,
    lastDeviceName: line.lastDeviceName,
  };
}

export async function authenticatePortalLine(mac: string, deviceKey: string) {
  const normalizedMac = normalizeMac(mac);
  const normalizedKey = normalizeDeviceKey(deviceKey);
  const line = await findLineByMac(normalizedMac);
  if (!line) {
    throw new ApiError("This device is not activated yet", 404);
  }
  if (!safeEqual(deviceKeyFingerprint(normalizedKey), line.deviceKeyHash)) {
    throw new ApiError("Device key does not match this line", 403);
  }
  if (line.status !== "active") {
    throw new ApiError("This device is disabled", 403);
  }
  if (isLineExpired(line)) {
    throw new ApiError("This device has expired", 403);
  }
  const user = await getUser(line.userId);
  if (!user || user.status !== "active" || isExpired(user)) {
    throw new ApiError("This user account is inactive", 403);
  }
  return { line, user };
}

export async function createPortalSession(lineId: string) {
  return createPortalSessionRecord(lineId);
}

export async function destroyPortalSession(tokenHash: string) {
  await deletePortalSessionRecord(tokenHash);
}

function parseCookies(header: string | null) {
  const result = new Map<string, string>();
  if (!header) return result;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) result.set(key, decodeURIComponent(value));
  }
  return result;
}

async function readSessionByToken(token: string | undefined | null) {
  if (!token) return null;
  const tokenHash = hashToken(token);
  const session = await readPortalSessionRecord(tokenHash);
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    await deletePortalSessionRecord(tokenHash);
    return null;
  }
  const line = await getLine(session.lineId);
  if (!line || line.status !== "active" || isLineExpired(line)) {
    await deletePortalSessionRecord(tokenHash);
    return null;
  }
  const user = await getUser(line.userId);
  if (!user || user.status !== "active" || isExpired(user)) {
    await deletePortalSessionRecord(tokenHash);
    return null;
  }
  return { line, user, session, tokenHash } satisfies PortalAuthContext;
}

export async function readPortalSession(request: Request) {
  const token = parseCookies(request.headers.get("cookie")).get(PORTAL_COOKIE);
  return readSessionByToken(token);
}

export async function getPortalSessionFromCookies() {
  const store = await cookies();
  return readSessionByToken(store.get(PORTAL_COOKIE)?.value);
}

export async function withPortal(
  request: Request,
  handler: (auth: PortalAuthContext) => Promise<Response>,
) {
  try {
    const auth = await readPortalSession(request);
    if (!auth) throw new ApiError("Unauthorized", 401);
    return await handler(auth);
  } catch (error) {
    return errorResponse(error);
  }
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const allowed = new Set<string>();
  try {
    allowed.add(new URL(request.url).origin);
  } catch {
  }
  const host = request.headers.get("host");
  if (host) {
    const proto =
      request.headers.get("x-forwarded-proto") ??
      (host.startsWith("localhost") || host.startsWith("127.0.0.1")
        ? "http"
        : "https");
    allowed.add(`${proto}://${host}`);
  }
  if (!allowed.has(origin)) {
    throw new ApiError("Invalid request origin", 403);
  }
}

function secureCookie() {
  return process.env.NETLIFY === "true" ? "; Secure" : "";
}

export function portalCookieHeader(token: string) {
  const maxAge = Math.floor(PORTAL_SESSION_TTL_MS / 1000);
  return `${PORTAL_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secureCookie()}`;
}

export function clearPortalCookieHeader() {
  return `${PORTAL_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureCookie()}`;
}
