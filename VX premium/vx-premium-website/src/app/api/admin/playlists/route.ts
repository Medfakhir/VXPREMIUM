import { ApiError, json, jsonBody, withAdmin } from "@/lib/api";
import { writeAudit } from "@/lib/auth";
import { addPlaylistToLine, getLine } from "@/lib/lines";
import { createPlaylist } from "@/lib/playlists";
import { listPlaylistViews, playlistView } from "@/lib/playlist-views";
import { createPlaylistSchema } from "@/lib/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withAdmin(request, async () => {
    return json({ playlists: await listPlaylistViews() });
  });
}

export async function POST(request: Request) {
  return withAdmin(request, async ({ admin }) => {
    const input = createPlaylistSchema.parse(await jsonBody(request));
    if (input.lineId) {
      const line = await getLine(input.lineId);
      if (!line) throw new ApiError("Device not found", 404);
      if (line.userId !== input.userId) {
        throw new ApiError("That device does not belong to this user", 422);
      }
    }
    const playlist = await createPlaylist(input);
    if (input.lineId) {
      await addPlaylistToLine(input.lineId, playlist.id);
    }
    await writeAudit(admin.id, "playlist.create", "playlist", playlist.id, {
      userId: playlist.userId,
      type: playlist.type,
      lineId: input.lineId || null,
    });
    return json({ playlist: await playlistView(playlist.id) }, 201);
  });
}
