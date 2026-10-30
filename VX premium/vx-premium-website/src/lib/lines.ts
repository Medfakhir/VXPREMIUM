import { randomUUID } from "node:crypto";
import { ApiError } from "@/lib/api";
import {
  decryptSecret,
  deviceKeyFingerprint,
  safeEqual,
} from "@/lib/crypto";
import {
  deleteJson,
  listJsonKeys,
  readJson,
  readJsonIfExists,
  writeJson,
} from "@/lib/json-store";
import { getPlaylist, listPlaylists } from "@/lib/playlists";
import type { PlaylistRecord } from "@/lib/playlists";
import { parseXtreamPlaylistUrl } from "@/lib/xtream-link";
import { deletePortalSessionsForLine } from "@/lib/portal-session-store";
import type {
  AdminUser,
  LineStatus,
  LineView,
  PlayerActivationResponse,
  PlayerPlaylist,
} from "@/lib/types";
import { createUser, getUser, isExpired, listUsers } from "@/lib/users";
import type { DeviceRecord } from "@/lib/users";

const LINE_PREFIX = "lines/";
const DEVICE_PREFIX = "devices/";

// Self-service devices register on first sign-in without an admin step and get
// a short free trial. After the trial ends an admin adds time to the device.
const SELF_SERVICE_PLAN = "Self-service";
const SELF_SERVICE_TTL_DAYS = 3650;
const SELF_SERVICE_TRIAL_DAYS = 7;

export type LineRecord = {
  id: string;
  name: string;
  mac: string;
  deviceKeyHash: string;
  userId: string;
  playlistId: string;
  playlistIds?: string[];
  status: LineStatus;
  expiresAt: string;
  lastSeenAt: string;
  lastIp: string;
  lastDeviceName: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateLineInput = {
  name: string;
  mac: string;
  deviceKey: string;
  userId: string;
  playlistId: string;
  playlistIds?: string[];
  status: LineStatus;
  expiresAt: string;
};

export type UpdateLineInput = {
  name?: string;
  playlistId?: string;
  playlistIds?: string[];
  status?: LineStatus;
  expiresAt?: string;
  addDays?: number;
};

export function linePlaylistIds(
  line: Pick<LineRecord, "playlistId" | "playlistIds">,
) {
  return Array.from(
    new Set([line.playlistId, ...(line.playlistIds ?? [])].filter(Boolean)),
  );
}

export function normalizeMac(value: string) {
  const compact = value
    .trim()
    .toUpperCase()
    .replace(/[^0-9A-F]/g, "");
  if (compact.length !== 12) {
    throw new ApiError("Enter a valid 12-character MAC address", 422);
  }
  return compact.match(/.{2}/g)!.join(":");
}

export function normalizeDeviceKey(value: string) {
  const key = value.trim();
  if (!/^\d{6}$/.test(key)) {
    throw new ApiError("Device key must be 6 digits", 422);
  }
  return key;
}

function normalizeExpiry(value: string) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T23:59:59.999Z`)
    : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ApiError("Enter a valid expiry date", 422);
  }
  return date.toISOString();
}

function isLineExpired(line: Pick<LineRecord, "expiresAt">) {
  return new Date(line.expiresAt).getTime() <= Date.now();
}

export async function listLines() {
  const keys = await listJsonKeys(LINE_PREFIX);
  const lines = await Promise.all(keys.map((key) => readJson<LineRecord>(key)));
  return lines
    .filter((line): line is LineRecord => line !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getLine(id: string) {
  return readJsonIfExists<LineRecord>(`${LINE_PREFIX}${id}`);
}

export async function findLineByMac(mac: string) {
  const normalized = normalizeMac(mac);
  const lines = await listLines();
  return lines.find((line) => line.mac === normalized) ?? null;
}

async function assertMacAvailable(mac: string, exceptId?: string) {
  const lines = await listLines();
  const duplicate = lines.find(
    (line) => line.id !== exceptId && line.mac === mac,
  );
  if (duplicate) {
    throw new ApiError("A line already exists for that MAC address", 409);
  }
}

async function assertPlaylistForUser(playlistId: string, userId: string) {
  const playlist = await getPlaylist(playlistId);
  if (!playlist) {
    throw new ApiError("Playlist not found", 404);
  }
  if (playlist.userId !== userId) {
    throw new ApiError("That playlist does not belong to this user", 422);
  }
  return playlist;
}

async function assertPlaylistsForUser(playlistIds: string[], userId: string) {
  const unique = Array.from(new Set(playlistIds.filter(Boolean)));
  await Promise.all(
    unique.map((playlistId) => assertPlaylistForUser(playlistId, userId)),
  );
  return unique;
}

async function assertConnectionSlot(userId: string) {
  const user = await getUser(userId);
  if (!user) {
    throw new ApiError("User not found", 404);
  }
  const lines = await listLines();
  const activeCount = lines.filter(
    (line) =>
      line.userId === userId &&
      line.status === "active" &&
      !isLineExpired(line),
  ).length;
  if (activeCount >= Math.max(1, user.maxConnections)) {
    throw new ApiError(
      `This user has reached its ${user.maxConnections}-connection limit`,
      409,
    );
  }
  return user;
}

export async function createLine(input: CreateLineInput) {
  const mac = normalizeMac(input.mac);
  normalizeDeviceKey(input.deviceKey);
  const playlistIds = await assertPlaylistsForUser(
    [input.playlistId, ...(input.playlistIds ?? [])],
    input.userId,
  );
  await assertMacAvailable(mac);
  const user = await assertConnectionSlot(input.userId);
  const primaryPlaylist = playlistIds.length
    ? await getPlaylist(playlistIds[0])
    : null;

  const now = new Date().toISOString();
  const line: LineRecord = {
    id: randomUUID(),
    name:
      input.name.trim() ||
      `${user.name} - ${primaryPlaylist?.name ?? "Device"}`,
    mac,
    deviceKeyHash: deviceKeyFingerprint(input.deviceKey),
    userId: user.id,
    playlistId: playlistIds[0] ?? "",
    playlistIds,
    status: input.status,
    expiresAt: input.expiresAt.trim()
      ? normalizeExpiry(input.expiresAt)
      : user.expiresAt,
    lastSeenAt: "",
    lastIp: "",
    lastDeviceName: "",
    createdAt: now,
    updatedAt: now,
  };
  await writeJson(`${LINE_PREFIX}${line.id}`, line);
  return line;
}

export async function updateLine(id: string, patch: UpdateLineInput) {
  const line = await getLine(id);
  if (!line) {
    throw new ApiError("Line not found", 404);
  }

  if (patch.name !== undefined) line.name = patch.name.trim() || line.name;
  if (patch.playlistIds !== undefined || patch.playlistId !== undefined) {
    const requested =
      patch.playlistIds !== undefined
        ? patch.playlistIds
        : [patch.playlistId ?? ""];
    const playlistIds = await assertPlaylistsForUser(requested, line.userId);
    line.playlistIds = playlistIds;
    line.playlistId = playlistIds[0] ?? "";
  }
  if (patch.status !== undefined) line.status = patch.status;
  if (patch.expiresAt !== undefined && patch.expiresAt.trim()) {
    line.expiresAt = normalizeExpiry(patch.expiresAt);
  }
  if (patch.addDays !== undefined) {
    const current = new Date(line.expiresAt).getTime();
    const base = Math.max(current, Date.now());
    line.expiresAt = new Date(base + patch.addDays * 86_400_000).toISOString();
  }
  line.updatedAt = new Date().toISOString();
  await writeJson(`${LINE_PREFIX}${line.id}`, line);
  return line;
}

export async function addPlaylistToLine(lineId: string, playlistId: string) {
  const line = await getLine(lineId);
  if (!line) {
    throw new ApiError("Line not found", 404);
  }
  await assertPlaylistForUser(playlistId, line.userId);
  const playlistIds = linePlaylistIds(line);
  if (!playlistIds.includes(playlistId)) {
    playlistIds.push(playlistId);
  }
  line.playlistIds = playlistIds;
  if (!line.playlistId) line.playlistId = playlistIds[0] ?? "";
  line.updatedAt = new Date().toISOString();
  await writeJson(`${LINE_PREFIX}${line.id}`, line);
  return line;
}

export async function removePlaylistFromLine(
  lineId: string,
  playlistId: string,
) {
  const line = await getLine(lineId);
  if (!line) {
    throw new ApiError("Line not found", 404);
  }
  const playlistIds = linePlaylistIds(line).filter((id) => id !== playlistId);
  line.playlistIds = playlistIds;
  line.playlistId = playlistIds[0] ?? "";
  line.updatedAt = new Date().toISOString();
  await writeJson(`${LINE_PREFIX}${line.id}`, line);
  return line;
}

export async function deleteLine(id: string) {
  const line = await getLine(id);
  if (!line) {
    throw new ApiError("Line not found", 404);
  }
  const playlists = await listPlaylists();
  const owned = playlists.filter((playlist) => playlist.ownerLineId === line.id);
  await Promise.all([
    deleteJson(`${LINE_PREFIX}${line.id}`),
    deleteJson(`${DEVICE_PREFIX}line-${line.id}`),
    deletePortalSessionsForLine(line.id),
    ...owned.map((playlist) => deleteJson(`playlists/${playlist.id}`)),
  ]);
  return line;
}

export function toLineView(
  line: LineRecord,
  userName: string,
  allPlaylists: PlaylistRecord[],
): LineView {
  const playlists = linePlaylistIds(line)
    .map((id) => allPlaylists.find((playlist) => playlist.id === id))
    .filter((playlist): playlist is PlaylistRecord => Boolean(playlist))
    .map((playlist) => ({
      id: playlist.id,
      name: playlist.name,
      type: playlist.type,
      status: playlist.status ?? "active",
    }));
  return {
    id: line.id,
    name: line.name,
    mac: line.mac,
    userId: line.userId,
    userName,
    playlistId: playlists[0]?.id ?? "",
    playlistName: playlists[0]?.name ?? "No playlist",
    playlists,
    status: line.status,
    expiresAt: line.expiresAt,
    lastSeenAt: line.lastSeenAt || null,
    lastDeviceName: line.lastDeviceName,
    createdAt: line.createdAt,
    updatedAt: line.updatedAt,
  };
}

export async function listLineViews() {
  const [lines, users, playlists] = await Promise.all([
    listLines(),
    listUsers(),
    listPlaylists(),
  ]);
  const userNames = new Map(users.map((user) => [user.id, user.name]));
  return lines.map((line) =>
    toLineView(
      line,
      userNames.get(line.userId) ?? "Unknown user",
      playlists,
    ),
  );
}

async function updateDevice(
  line: LineRecord,
  deviceName: string,
  now: string,
) {
  const device: DeviceRecord = {
    id: `line-${line.id}`,
    userId: line.userId,
    name: deviceName,
    lastSeenAt: now,
    lineId: line.id,
    mac: line.mac,
  };
  await writeJson(`${DEVICE_PREFIX}${device.id}`, device);
}

function selfServiceUsername(mac: string) {
  return `device-${mac.replace(/[^0-9A-F]/gi, "").toLowerCase()}`;
}

async function ensureSelfServiceUser(mac: string) {
  const username = selfServiceUsername(mac);
  const users = await listUsers();
  const existing = users.find((user) => user.username === username);
  if (existing) {
    return existing;
  }
  const expiresAt = new Date(
    Date.now() + SELF_SERVICE_TTL_DAYS * 86_400_000,
  ).toISOString();
  return createUser({
    username,
    name: `Device ${mac}`,
    email: "",
    plan: SELF_SERVICE_PLAN,
    status: "active",
    expiresAt,
    maxConnections: 1,
    allowOwnPlaylists: true,
    notes: "Auto-created when this device signed in without an admin step.",
  });
}

async function createSelfServiceLine(
  user: AdminUser,
  mac: string,
  deviceKey: string,
  deviceName?: string,
  ip?: string,
) {
  const now = new Date().toISOString();
  const name = deviceName?.trim() || `Device ${mac}`;
  const line: LineRecord = {
    id: randomUUID(),
    name,
    mac,
    deviceKeyHash: deviceKeyFingerprint(deviceKey),
    userId: user.id,
    playlistId: "",
    playlistIds: [],
    status: "active",
    expiresAt: new Date(
      Date.now() + SELF_SERVICE_TRIAL_DAYS * 86_400_000,
    ).toISOString(),
    lastSeenAt: now,
    lastIp: ip?.trim() || "",
    lastDeviceName: name,
    createdAt: now,
    updatedAt: now,
  };
  await Promise.all([
    writeJson(`${LINE_PREFIX}${line.id}`, line),
    updateDevice(line, name, now),
  ]);
  return line;
}

/**
 * Finds the line for a device. When no admin has provisioned the MAC address
 * yet, a self-service account is created on first use so the device can sign
 * in and add its own playlists without any admin step.
 */
export async function resolveDeviceLine(input: {
  mac: string;
  deviceKey: string;
  deviceName?: string;
  ip?: string;
}): Promise<{ line: LineRecord; user: AdminUser; created: boolean }> {
  const mac = normalizeMac(input.mac);
  const deviceKey = normalizeDeviceKey(input.deviceKey);
  const existing = await findLineByMac(mac);
  if (!existing) {
    const user = await ensureSelfServiceUser(mac);
    const line = await createSelfServiceLine(
      user,
      mac,
      deviceKey,
      input.deviceName,
      input.ip,
    );
    return { line, user, created: true };
  }
  if (!safeEqual(deviceKeyFingerprint(deviceKey), existing.deviceKeyHash)) {
    throw new ApiError("Device key does not match this line", 403, "device_key");
  }
  if (existing.status !== "active") {
    throw new ApiError("This device is disabled", 403, "disabled");
  }
  if (isLineExpired(existing)) {
    throw new ApiError(
      "This device's free trial has expired",
      403,
      "expired",
    );
  }
  const user = await getUser(existing.userId);
  if (!user || user.status !== "active") {
    throw new ApiError("This user account is inactive", 403, "disabled");
  }
  if (isExpired(user)) {
    throw new ApiError("This user account has expired", 403, "expired");
  }
  return { line: existing, user, created: false };
}

export async function activateLine(input: {
  mac: string;
  deviceKey: string;
  deviceName?: string;
  ip?: string;
}): Promise<PlayerActivationResponse> {
  const { line, created } = await resolveDeviceLine(input);

  const allPlaylists = await listPlaylists();
  const assigned = linePlaylistIds(line)
    .map((id) => allPlaylists.find((playlist) => playlist.id === id))
    .filter(
      (playlist): playlist is PlaylistRecord =>
        Boolean(playlist) && (playlist?.status ?? "active") === "active",
    );
  if (!assigned.length) {
    throw new ApiError(
      created
        ? "This device is registered but has no playlist yet. Add an Xtream or M3U source in the web portal, then try again."
        : "No active playlist is assigned to this device",
      404,
    );
  }

  const playlists: PlayerPlaylist[] = assigned.map((playlist) => {
    let epgUrl: string | null = null;
    if (playlist.epgSecret) {
      try {
        epgUrl = decryptSecret(playlist.epgSecret);
      } catch {
        epgUrl = null;
      }
    }
    if (playlist.type === "m3u") {
      let m3uUrl = "";
      try {
        m3uUrl = decryptSecret(playlist.secret);
      } catch {
        m3uUrl = "";
      }
      // An Xtream-style M3U link is delivered with derived Xtream credentials
      // so the player can stream it, but it keeps the type the owner chose
      // (M3U) so the app shows the exact source type on the account card.
      const xtream = parseXtreamPlaylistUrl(m3uUrl);
      if (xtream) {
        return {
          id: playlist.id,
          name: playlist.name,
          type: playlist.type,
          serverUrl: xtream.serverUrl,
          username: xtream.username,
          password: xtream.password,
          m3uUrl: null,
          epgUrl,
        };
      }
      return {
        id: playlist.id,
        name: playlist.name,
        type: playlist.type,
        serverUrl: "",
        username: "",
        password: "",
        m3uUrl,
        epgUrl,
      };
    }
    return {
      id: playlist.id,
      name: playlist.name,
      type: playlist.type,
      serverUrl: playlist.serverUrl,
      username: playlist.username,
      password: decryptSecret(playlist.secret),
      m3uUrl: null,
      epgUrl,
    };
  });

  const now = new Date().toISOString();
  const deviceName = input.deviceName?.trim() || "Unknown device";
  line.lastSeenAt = now;
  line.lastIp = input.ip?.trim() || "";
  line.lastDeviceName = deviceName;
  line.updatedAt = now;
  await Promise.all([
    writeJson(`${LINE_PREFIX}${line.id}`, line),
    updateDevice(line, deviceName, now),
  ]);

  return {
    line: {
      id: line.id,
      name: line.name,
      status: line.status,
      expiresAt: line.expiresAt,
    },
    playlist: playlists[0],
    playlists,
  };
}
