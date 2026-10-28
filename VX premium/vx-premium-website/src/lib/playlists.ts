import { randomUUID } from "node:crypto";
import { ApiError } from "@/lib/api";
import { encryptSecret, EncryptedValue } from "@/lib/crypto";
import { deleteJson, listJsonKeys, readJson, writeJson } from "@/lib/json-store";
import type { PlaylistType, PlaylistView } from "@/lib/types";
import { getUser } from "@/lib/users";

const PLAYLIST_PREFIX = "playlists/";

export type PlaylistRecord = {
  id: string;
  userId: string;
  name: string;
  type: PlaylistType;
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
};

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

  const now = new Date().toISOString();
  const playlist: PlaylistRecord = {
    id: randomUUID(),
    userId: user.id,
    name: input.name.trim(),
    type: input.type,
    serverUrl: input.type === "xtream" ? input.serverUrl.trim().replace(/\/+$/, "") : "",
    username: input.type === "xtream" ? input.username.trim() : "",
    endpointHost: hostOf(input.type === "xtream" ? input.serverUrl : input.m3uUrl),
    secret: encryptSecret(input.type === "xtream" ? input.password : input.m3uUrl),
    epgSecret: input.epgUrl ? encryptSecret(input.epgUrl.trim()) : null,
    createdAt: now,
    updatedAt: now,
  };
  await writeJson(`${PLAYLIST_PREFIX}${playlist.id}`, playlist);
  return playlist;
}

export async function deletePlaylist(id: string) {
  const playlist = await readJson<PlaylistRecord>(`${PLAYLIST_PREFIX}${id}`);
  if (!playlist) {
    throw new ApiError("Playlist not found", 404);
  }
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
): PlaylistView {
  return {
    id: playlist.id,
    userId: playlist.userId,
    userName,
    name: playlist.name,
    type: playlist.type,
    serverUrl: playlist.serverUrl,
    username: playlist.username,
    endpointHost: playlist.endpointHost,
    hasSecret: Boolean(playlist.secret),
    hasEpg: Boolean(playlist.epgSecret),
    createdAt: playlist.createdAt,
    updatedAt: playlist.updatedAt,
  };
}
