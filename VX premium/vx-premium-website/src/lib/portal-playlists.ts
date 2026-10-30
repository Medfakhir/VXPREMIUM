import { ApiError } from "@/lib/api";
import { decryptSecret } from "@/lib/crypto";
import {
  addPlaylistToLine,
  getLine,
  linePlaylistIds,
} from "@/lib/lines";
import type { LineRecord } from "@/lib/lines";
import {
  createPlaylist,
  deletePlaylist,
  getPlaylist,
  listPlaylists,
  updatePlaylist,
} from "@/lib/playlists";
import type {
  CreatePlaylistInput,
  PlaylistRecord,
  UpdatePlaylistInput,
} from "@/lib/playlists";
import type {
  AdminUser,
  PortalPlaylistView,
} from "@/lib/types";

const MAX_PLAYLISTS_PER_DEVICE = 10;

function toPortalPlaylistView(
  playlist: PlaylistRecord,
  line: LineRecord,
): PortalPlaylistView {
  const isXtream = playlist.type === "xtream";
  let secretValue = "";
  try {
    secretValue = decryptSecret(playlist.secret);
  } catch {
    secretValue = "";
  }
  return {
    id: playlist.id,
    name: playlist.name,
    type: playlist.type,
    status: playlist.status ?? "active",
    endpointHost: playlist.endpointHost,
    serverUrl: playlist.serverUrl,
    username: playlist.username,
    password: isXtream ? secretValue : "",
    m3uUrl: isXtream ? "" : secretValue,
    hasEpg: Boolean(playlist.epgSecret),
    owner: playlist.ownerLineId === line.id,
    primary: playlist.id === line.playlistId,
    createdAt: playlist.createdAt,
    updatedAt: playlist.updatedAt,
  };
}

export async function listPortalPlaylists(line: LineRecord) {
  const playlists = await listPlaylists();
  const ids = linePlaylistIds(line);
  return playlists
    .filter((playlist) => ids.includes(playlist.id))
    .sort((a, b) => {
      if (a.id === line.playlistId) return -1;
      if (b.id === line.playlistId) return 1;
      return b.createdAt.localeCompare(a.createdAt);
    })
    .map((playlist) => toPortalPlaylistView(playlist, line));
}

export async function getPortalPlaylistView(
  lineId: string,
  playlistId: string,
) {
  const [line, playlist] = await Promise.all([
    getLine(lineId),
    getPlaylist(playlistId),
  ]);
  if (!line) throw new ApiError("Device not found", 404);
  if (!playlist) throw new ApiError("Playlist not found", 404);
  return toPortalPlaylistView(playlist, line);
}

export async function createPortalPlaylist(
  line: LineRecord,
  user: AdminUser,
  input: Omit<CreatePlaylistInput, "userId" | "ownerLineId" | "status">,
) {
  if (!user.allowOwnPlaylists) {
    throw new ApiError(
      "Your provider manages playlists for this account",
      403,
    );
  }
  const current = linePlaylistIds(line);
  if (current.length >= MAX_PLAYLISTS_PER_DEVICE) {
    throw new ApiError(
      `This device can have at most ${MAX_PLAYLISTS_PER_DEVICE} playlists`,
      409,
    );
  }
  const playlist = await createPlaylist({
    ...input,
    userId: line.userId,
    ownerLineId: line.id,
    status: "active",
  });
  await addPlaylistToLine(line.id, playlist.id);
  return playlist;
}

export async function updatePortalPlaylist(
  line: LineRecord,
  user: AdminUser,
  playlistId: string,
  patch: UpdatePlaylistInput,
) {
  if (!user.allowOwnPlaylists) {
    throw new ApiError(
      "Your provider manages playlists for this account",
      403,
    );
  }
  const playlist = await getPlaylist(playlistId);
  if (!playlist) throw new ApiError("Playlist not found", 404);
  if (!linePlaylistIds(line).includes(playlistId)) {
    throw new ApiError("This playlist is not assigned to your device", 403);
  }
  return updatePlaylist(playlistId, patch);
}

export async function deletePortalPlaylist(
  line: LineRecord,
  user: AdminUser,
  playlistId: string,
) {
  if (!user.allowOwnPlaylists) {
    throw new ApiError(
      "Your provider manages playlists for this account",
      403,
    );
  }
  const playlist = await getPlaylist(playlistId);
  if (!playlist) throw new ApiError("Playlist not found", 404);
  if (playlist.ownerLineId !== line.id) {
    throw new ApiError("This playlist is managed by your provider", 403);
  }
  await deletePlaylist(playlistId);
}
