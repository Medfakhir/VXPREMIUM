import { randomUUID } from "node:crypto";
import { ApiError } from "@/lib/api";
import { decryptSecret, encryptSecret, EncryptedValue } from "@/lib/crypto";
import {
  deleteJson,
  listJsonKeys,
  readJson,
  readJsonIfExists,
  writeJson,
} from "@/lib/json-store";
import type {
  PlaylistStatus,
  PlaylistType,
  PlaylistView,
} from "@/lib/types";
import { getUser } from "@/lib/users";

const PLAYLIST_PREFIX = "playlists/";
const LINE_PREFIX = "lines/";

export type PlaylistRecord = {
  id: string;
  userId: string;
  name: string;
  type: PlaylistType;
  status: PlaylistStatus;
  ownerLineId: string | null;
  serverUrl: string;
  username: string;
  endpointHost: string;
  secret: EncryptedValue;
  epgSecret: EncryptedValue | null;
  createdAt: string;
  updatedAt: string;
};

export type CreatePlaylistInput = {
  userId: string;
  name: string;
  type: PlaylistType;
  serverUrl: string;
  username: string;
  password: string;
  m3uUrl: string;
  epgUrl: string;
  status?: PlaylistStatus;
  ownerLineId?: string | null;
};

export type UpdatePlaylistInput = {
  name?: string;
  type?: PlaylistType;
  serverUrl?: string;
  username?: string;
  password?: string;
  m3uUrl?: string;
  epgUrl?: string;
  status?: PlaylistStatus;
};

function assertHttpUrl(value: string, label: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error();
  } catch {
    throw new ApiError(`Enter a valid http or https ${label} URL`, 422);
  }
}

function assertCredentials(
  type: PlaylistType,
  serverUrl: string,
  username: string,
  password: string,
  m3uUrl: string,
) {
  if (type === "xtream") {
    assertHttpUrl(serverUrl, "server");
    if (!username.trim()) throw new ApiError("Xtream username is required", 422);
    if (!password) throw new ApiError("Xtream password is required", 422);
  } else {
    assertHttpUrl(m3uUrl, "M3U");
  }
}

function hostOf(value: string) {
  try {
    return new URL(value).host;
  } catch {
    return "";
  }
}

export async function listPlaylists() {
  const keys = await listJsonKeys(PLAYLIST_PREFIX);
  const playlists = await Promise.all(
    keys.map((key) => readJson<PlaylistRecord>(key)),
  );
  return playlists
    .filter((playlist): playlist is PlaylistRecord => playlist !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createPlaylist(input: CreatePlaylistInput) {
  const user = await getUser(input.userId);
  if (!user) {
    throw new ApiError("User not found", 404);
  }

  // The type the owner picked is stored as-is so the web portal and the player
  // always show the exact source type (Xtream stays Xtream, M3U stays M3U).
  // Any Xtream credentials are derived later when the device activates.
  const type = input.type;
  const serverUrl = input.serverUrl;
  const username = input.username;
  const password = input.password;
  const m3uUrl = input.m3uUrl;

  assertCredentials(type, serverUrl, username, password, m3uUrl);

  const now = new Date().toISOString();
  const playlist: PlaylistRecord = {
    id: randomUUID(),
    userId: user.id,
    name: input.name.trim(),
    type,
    status: input.status ?? "active",
    ownerLineId: input.ownerLineId ?? null,
    serverUrl: type === "xtream" ? serverUrl.trim().replace(/\/+$/, "") : "",
    username: type === "xtream" ? username.trim() : "",
    endpointHost: hostOf(type === "xtream" ? serverUrl : m3uUrl),
    secret: encryptSecret(type === "xtream" ? password : m3uUrl),
    epgSecret: input.epgUrl ? encryptSecret(input.epgUrl.trim()) : null,
    createdAt: now,
    updatedAt: now,
  };
  await writeJson(`${PLAYLIST_PREFIX}${playlist.id}`, playlist);
  return playlist;
}

export async function getPlaylist(id: string) {
  return readJsonIfExists<PlaylistRecord>(`${PLAYLIST_PREFIX}${id}`);
}

export async function updatePlaylist(id: string, patch: UpdatePlaylistInput) {
  const playlist = await getPlaylist(id);
  if (!playlist) {
    throw new ApiError("Playlist not found", 404);
  }

  const nextType = patch.type ?? playlist.type;
  let serverUrl = patch.serverUrl ?? playlist.serverUrl;
  let username = patch.username ?? playlist.username;
  let password = patch.password ?? "";
  let m3uUrl = patch.m3uUrl ?? "";

  if (nextType === "xtream") {
    if (!password) {
      if (playlist.type === "xtream") {
        password = decryptSecret(playlist.secret);
      } else if (!patch.password) {
        throw new ApiError("Xtream password is required", 422);
      }
    }
    m3uUrl = "";
  } else {
    if (!m3uUrl) {
      if (playlist.type === "m3u") {
        m3uUrl = decryptSecret(playlist.secret);
      } else if (!patch.m3uUrl) {
        throw new ApiError("M3U URL is required", 422);
      }
    }
    // Keep the M3U type the owner picked; credentials are derived at activation.
    serverUrl = "";
    username = "";
    password = "";
  }
  assertCredentials(nextType, serverUrl, username, password, m3uUrl);

  if (patch.name !== undefined) playlist.name = patch.name.trim();
  playlist.type = nextType;
  playlist.serverUrl =
    nextType === "xtream" ? serverUrl.trim().replace(/\/+$/, "") : "";
  playlist.username = nextType === "xtream" ? username.trim() : "";
  playlist.endpointHost = hostOf(
    nextType === "xtream" ? serverUrl : m3uUrl,
  );
  if (
    patch.password !== undefined ||
    patch.m3uUrl !== undefined ||
    patch.type !== undefined
  ) {
    playlist.secret = encryptSecret(nextType === "xtream" ? password : m3uUrl);
  }
  if (patch.epgUrl !== undefined) {
    playlist.epgSecret = patch.epgUrl.trim()
      ? encryptSecret(patch.epgUrl.trim())
      : null;
  }
  if (patch.status !== undefined) playlist.status = patch.status;
  playlist.updatedAt = new Date().toISOString();
  await writeJson(`${PLAYLIST_PREFIX}${playlist.id}`, playlist);
  return playlist;
}

type LinePlaylistRef = {
  id: string;
  playlistId: string;
  playlistIds?: string[];
  updatedAt: string;
};

async function unassignPlaylistFromLines(playlistId: string) {
  const keys = await listJsonKeys(LINE_PREFIX);
  const lines = await Promise.all(
    keys.map((key) => readJson<LinePlaylistRef>(key)),
  );
  const linked = lines.filter(
    (line): line is LinePlaylistRef =>
      line !== null &&
      Array.from(
        new Set([line.playlistId, ...(line.playlistIds ?? [])].filter(Boolean)),
      ).includes(playlistId),
  );
  await Promise.all(
    linked.map(async (line) => {
      const playlistIds = Array.from(
        new Set([line.playlistId, ...(line.playlistIds ?? [])].filter(Boolean)),
      ).filter((id) => id !== playlistId);
      await writeJson(`${LINE_PREFIX}${line.id}`, {
        ...line,
        playlistId: playlistIds[0] ?? "",
        playlistIds,
        updatedAt: new Date().toISOString(),
      });
    }),
  );
  return linked.length;
}

export async function deletePlaylist(id: string) {
  const playlist = await readJsonIfExists<PlaylistRecord>(
    `${PLAYLIST_PREFIX}${id}`,
  );
  if (!playlist) {
    throw new ApiError("Playlist not found", 404);
  }
  await unassignPlaylistFromLines(id);
  await deleteJson(`${PLAYLIST_PREFIX}${id}`);
  return playlist;
}

export async function deletePlaylistsForUser(userId: string) {
  const playlists = await listPlaylists();
  const owned = playlists.filter((playlist) => playlist.userId === userId);
  await Promise.all(
    owned.map((playlist) => deleteJson(`${PLAYLIST_PREFIX}${playlist.id}`)),
  );
  return owned.length;
}

export function toPlaylistView(
  playlist: PlaylistRecord,
  userName: string,
  assignedLineIds: string[] = [],
  assignedLineNames: string[] = [],
): PlaylistView {
  const isXtream = playlist.type === "xtream";
  let secretValue = "";
  try {
    secretValue = decryptSecret(playlist.secret);
  } catch {
    secretValue = "";
  }
  return {
    id: playlist.id,
    userId: playlist.userId,
    userName,
    name: playlist.name,
    type: playlist.type,
    status: playlist.status ?? "active",
    ownerLineId: playlist.ownerLineId ?? null,
    assignedLineIds,
    assignedLineNames,
    serverUrl: playlist.serverUrl,
    username: playlist.username,
    password: isXtream ? secretValue : "",
    m3uUrl: isXtream ? "" : secretValue,
    endpointHost: playlist.endpointHost,
    hasSecret: Boolean(playlist.secret),
    hasEpg: Boolean(playlist.epgSecret),
    createdAt: playlist.createdAt,
    updatedAt: playlist.updatedAt,
  };
}
