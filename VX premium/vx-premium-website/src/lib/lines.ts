import { randomUUID } from "node:crypto";
import { ApiError } from "@/lib/api";
import {
  decryptSecret,
  deviceKeyFingerprint,
  safeEqual,
} from "@/lib/crypto";
import { deleteJson, listJsonKeys, readJson, writeJson } from "@/lib/json-store";
import { getPlaylist, listPlaylists } from "@/lib/playlists";
import type { LineStatus, LineView, PlayerActivationResponse } from "@/lib/types";
import { getUser, isExpired, listUsers } from "@/lib/users";
import type { DeviceRecord } from "@/lib/users";

const LINE_PREFIX = "lines/";
const DEVICE_PREFIX = "devices/";

export type LineRecord = {
  id: string;
  name: string;
  mac: string;
  deviceKeyHash: string;
  userId: string;
  playlistId: string;
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
  status: LineStatus;
  expiresAt: string;
};

export type UpdateLineInput = {
  name?: string;
  playlistId?: string;
  status?: LineStatus;
  expiresAt?: string;
};

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
  return readJson<LineRecord>(`${LINE_PREFIX}${id}`);
}

async function findLineByMac(mac: string) {
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
  if (playlist.type !== "xtream") {
    throw new ApiError(
      "Only Xtream playlists can be activated by this player",
      422,
    );
  }
  return playlist;
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
  const playlist = await assertPlaylistForUser(input.playlistId, input.userId);
  await assertMacAvailable(mac);
  const user = await assertConnectionSlot(input.userId);

  const now = new Date().toISOString();
  const line: LineRecord = {
    id: randomUUID(),
    name:
      input.name.trim() ||
      `${user.name} - ${playlist.name}`,
    mac,
    deviceKeyHash: deviceKeyFingerprint(input.deviceKey),
    userId: user.id,
    playlistId: playlist.id,
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
  if (patch.playlistId !== undefined) {
    const playlist = await assertPlaylistForUser(patch.playlistId, line.userId);
    line.playlistId = playlist.id;
  }
  if (patch.status !== undefined) line.status = patch.status;
  if (patch.expiresAt !== undefined && patch.expiresAt.trim()) {
    line.expiresAt = normalizeExpiry(patch.expiresAt);
  }
  line.updatedAt = new Date().toISOString();
  await writeJson(`${LINE_PREFIX}${line.id}`, line);
  return line;
}

export async function deleteLine(id: string) {
  const line = await getLine(id);
  if (!line) {
    throw new ApiError("Line not found", 404);
  }
  await Promise.all([
    deleteJson(`${LINE_PREFIX}${line.id}`),
    deleteJson(`${DEVICE_PREFIX}line-${line.id}`),
  ]);
  return line;
}

export async function toLineView(
  line: LineRecord,
  userName: string,
  playlistName: string,
): Promise<LineView> {
  return {
    id: line.id,
    name: line.name,
    mac: line.mac,
    userId: line.userId,
    userName,
    playlistId: line.playlistId,
    playlistName,
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
  const playlistNames = new Map(
    playlists.map((playlist) => [playlist.id, playlist.name]),
  );
  return Promise.all(
    lines.map((line) =>
      toLineView(
        line,
        userNames.get(line.userId) ?? "Unknown user",
        playlistNames.get(line.playlistId) ?? "Missing playlist",
      ),
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

export async function activateLine(input: {
  mac: string;
  deviceKey: string;
  deviceName?: string;
  ip?: string;
}): Promise<PlayerActivationResponse> {
  const mac = normalizeMac(input.mac);
  const deviceKey = normalizeDeviceKey(input.deviceKey);
  const line = await findLineByMac(mac);
  if (!line) {
    throw new ApiError("This device is not activated yet", 404);
  }
  if (!safeEqual(deviceKeyFingerprint(deviceKey), line.deviceKeyHash)) {
    throw new ApiError("Device key does not match this line", 403);
  }
  if (line.status !== "active") {
    throw new ApiError("This line is disabled", 403);
  }
  if (isLineExpired(line)) {
    throw new ApiError("This line has expired", 403);
  }

  const [user, playlist] = await Promise.all([
    getUser(line.userId),
    getPlaylist(line.playlistId),
  ]);
  if (!user || user.status !== "active" || isExpired(user)) {
    throw new ApiError("This user account is inactive", 403);
  }
  if (!playlist) {
    throw new ApiError("The playlist for this line is missing", 404);
  }
  if (playlist.type !== "xtream") {
    throw new ApiError(
      "This player currently supports Xtream lines only",
      409,
    );
  }

  const password = decryptSecret(playlist.secret);
  let epgUrl: string | null = null;
  if (playlist.epgSecret) {
    try {
      epgUrl = decryptSecret(playlist.epgSecret);
    } catch {
      epgUrl = null;
    }
  }

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
    playlist: {
      id: playlist.id,
      name: playlist.name,
      type: playlist.type,
      serverUrl: playlist.serverUrl,
      username: playlist.username,
      password,
      epgUrl,
    },
  };
}
