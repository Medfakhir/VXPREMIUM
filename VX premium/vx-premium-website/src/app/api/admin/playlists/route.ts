import { json, jsonBody, withAdmin } from "@/lib/api";
import { writeAudit } from "@/lib/auth";
import {
  createPlaylist,
  listPlaylists,
  toPlaylistView,
} from "@/lib/playlists";
import { createPlaylistSchema } from "@/lib/schemas";
import { listUsers } from "@/lib/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withAdmin(request, async () => {
    const [playlists, users] = await Promise.all([listPlaylists(), listUsers()]);
    const names = new Map(users.map((user) => [user.id, user.name]));
    return json({
      playlists: playlists.map((playlist) =>
        toPlaylistView(playlist, names.get(playlist.userId) ?? "Unknown user"),
      ),
    });
  });
}

export async function POST(request: Request) {
  return withAdmin(request, async ({ admin }) => {
    const input = createPlaylistSchema.parse(await jsonBody(request));
    const playlist = await createPlaylist(input);
    await writeAudit(admin.id, "playlist.create", "playlist", playlist.id, {
      userId: playlist.userId,
      type: playlist.type,
    });
    return json(
      {
        playlist: toPlaylistView(playlist, ""),
      },
      201,
    );
  });
}
