import { json, jsonBody, withAdmin } from "@/lib/api";
import { writeAudit } from "@/lib/auth";
import { deletePlaylist, updatePlaylist } from "@/lib/playlists";
import { playlistView } from "@/lib/playlist-views";
import { updatePlaylistSchema } from "@/lib/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  return withAdmin(request, async ({ admin }) => {
    const { id } = await context.params;
    const patch = updatePlaylistSchema.parse(await jsonBody(request));
    const playlist = await updatePlaylist(id, patch);
    await writeAudit(admin.id, "playlist.update", "playlist", id, {
      status: playlist.status,
      type: playlist.type,
    });
    return json({ playlist: await playlistView(id) });
  });
}

export async function DELETE(request: Request, context: Context) {
  return withAdmin(request, async ({ admin }) => {
    const { id } = await context.params;
    const playlist = await deletePlaylist(id);
    await writeAudit(admin.id, "playlist.delete", "playlist", id, {
      userId: playlist.userId,
      type: playlist.type,
    });
    return json({ ok: true });
  });
}
