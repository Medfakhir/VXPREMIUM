import { ApiError } from "@/lib/api";
import { linePlaylistIds, listLines } from "@/lib/lines";
import {
  getPlaylist,
  listPlaylists,
  toPlaylistView,
} from "@/lib/playlists";
import { listUsers } from "@/lib/users";

async function context() {
  const [users, lines] = await Promise.all([listUsers(), listLines()]);
  return {
    userNames: new Map(users.map((user) => [user.id, user.name])),
    lines,
  };
}

export async function listPlaylistViews() {
  const [playlists, data] = await Promise.all([listPlaylists(), context()]);
  return playlists.map((playlist) => {
    const assigned = data.lines.filter((line) =>
      linePlaylistIds(line).includes(playlist.id),
    );
    return toPlaylistView(
      playlist,
      data.userNames.get(playlist.userId) ?? "Unknown user",
      assigned.map((line) => line.id),
      assigned.map((line) => line.name),
    );
  });
}

export async function playlistView(id: string) {
  const [playlist, data] = await Promise.all([getPlaylist(id), context()]);
  if (!playlist) throw new ApiError("Playlist not found", 404);
  const assigned = data.lines.filter((line) =>
    linePlaylistIds(line).includes(playlist.id),
  );
  return toPlaylistView(
    playlist,
    data.userNames.get(playlist.userId) ?? "Unknown user",
    assigned.map((line) => line.id),
    assigned.map((line) => line.name),
  );
}
