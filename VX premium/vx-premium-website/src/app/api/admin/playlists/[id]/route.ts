import { json, withAdmin } from "@/lib/api";
import { writeAudit } from "@/lib/auth";
import { deletePlaylist } from "@/lib/playlists";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

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
