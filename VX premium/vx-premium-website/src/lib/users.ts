import { randomUUID } from "node:crypto";
import { ApiError } from "@/lib/api";
import {
  deleteJson,
  listJsonKeys,
  readJson,
  readJsonIfExists,
  writeJson,
} from "@/lib/json-store";
import type { AdminUser, UserStatus } from "@/lib/types";

const USER_PREFIX = "users/";
const DEVICE_PREFIX = "devices/";
const LINE_PREFIX = "lines/";

export type CreateUserInput = {
  username: string;
  name: string;
  email: string;
  plan: string;
  status: UserStatus;
  expiresAt: string;
  maxConnections: number;
  allowOwnPlaylists: boolean;
  notes: string;
};

export type DeviceRecord = {
  id: string;
  userId: string;
  name: string;
  lastSeenAt: string;
  lineId?: string;
  mac?: string;
};

export function isExpired(user: Pick<AdminUser, "expiresAt">) {
  return new Date(user.expiresAt).getTime() <= Date.now();
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

export async function listUsers() {
  const keys = await listJsonKeys(USER_PREFIX);
  const users = await Promise.all(keys.map((key) => readJson<AdminUser>(key)));
  return users
    .filter((user): user is AdminUser => user !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getUser(id: string) {
  return readJsonIfExists<AdminUser>(`${USER_PREFIX}${id}`);
}

async function assertUsernameAvailable(username: string, exceptId?: string) {
  const users = await listUsers();
  const normalized = username.toLowerCase();
  const duplicate = users.find(
    (user) => user.id !== exceptId && user.username === normalized,
  );
  if (duplicate) {
    throw new ApiError("That username is already in use", 409);
  }
}

export async function createUser(input: CreateUserInput) {
  const username = input.username.trim().toLowerCase();
  await assertUsernameAvailable(username);

  const now = new Date().toISOString();
  const user: AdminUser = {
    id: randomUUID(),
    username,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    plan: input.plan.trim(),
    status: input.status,
    expiresAt: normalizeExpiry(input.expiresAt),
    maxConnections: input.maxConnections,
    allowOwnPlaylists: input.allowOwnPlaylists,
    notes: input.notes.trim(),
    createdAt: now,
    updatedAt: now,
  };
  await writeJson(`${USER_PREFIX}${user.id}`, user);
  return user;
}

export async function updateUser(
  id: string,
  patch: Partial<CreateUserInput> & { resetDevices?: boolean },
) {
  const user = await getUser(id);
  if (!user) {
    throw new ApiError("User not found", 404);
  }

  if (patch.username !== undefined) {
    const username = patch.username.trim().toLowerCase();
    await assertUsernameAvailable(username, id);
    user.username = username;
  }
  if (patch.name !== undefined) user.name = patch.name.trim();
  if (patch.email !== undefined) user.email = patch.email.trim().toLowerCase();
  if (patch.plan !== undefined) user.plan = patch.plan.trim();
  if (patch.status !== undefined) user.status = patch.status;
  if (patch.expiresAt !== undefined) user.expiresAt = normalizeExpiry(patch.expiresAt);
  if (patch.maxConnections !== undefined) user.maxConnections = patch.maxConnections;
  if (patch.allowOwnPlaylists !== undefined) {
    user.allowOwnPlaylists = patch.allowOwnPlaylists;
  }
  if (patch.notes !== undefined) user.notes = patch.notes.trim();
  user.updatedAt = new Date().toISOString();

  await writeJson(`${USER_PREFIX}${id}`, user);

  let resetCount = 0;
  if (patch.resetDevices) {
    resetCount = await resetDevices(id);
  }

  return { user, resetCount };
}

export async function deleteUser(id: string) {
  const user = await getUser(id);
  if (!user) {
    throw new ApiError("User not found", 404);
  }
  await deletePlaylistsForUser(id);
  await deleteLinesForUser(id);
  await resetDevices(id);
  await deleteJson(`${USER_PREFIX}${id}`);
  return user;
}

export async function listDevices() {
  const keys = await listJsonKeys(DEVICE_PREFIX);
  const devices = await Promise.all(keys.map((key) => readJson<DeviceRecord>(key)));
  return devices.filter((device): device is DeviceRecord => device !== null);
}

async function deleteLinesForUser(userId: string) {
  const keys = await listJsonKeys(LINE_PREFIX);
  const lines = await Promise.all(
    keys.map((key) =>
      readJson<{ id: string; userId: string }>(key),
    ),
  );
  const owned = lines.filter(
    (line): line is { id: string; userId: string } =>
      line !== null && line.userId === userId,
  );
  await Promise.all(
    owned.map((line) => deleteJson(`${LINE_PREFIX}${line.id}`)),
  );
  return owned.length;
}

async function deletePlaylistsForUser(userId: string) {
  const keys = await listJsonKeys("playlists/");
  const playlists = await Promise.all(
    keys.map((key) =>
      readJson<{ id: string; userId: string }>(key),
    ),
  );
  const owned = playlists.filter(
    (playlist): playlist is { id: string; userId: string } =>
      playlist !== null && playlist.userId === userId,
  );
  await Promise.all(
    owned.map((playlist) => deleteJson(`playlists/${playlist.id}`)),
  );
  return owned.length;
}

export async function resetDevices(userId: string) {
  const devices = await listDevices();
  const owned = devices.filter((device) => device.userId === userId);
  await Promise.all(owned.map((device) => deleteJson(`${DEVICE_PREFIX}${device.id}`)));
  return owned.length;
}
