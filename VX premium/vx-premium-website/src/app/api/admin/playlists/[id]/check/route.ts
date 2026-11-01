import { json, withAdmin } from "@/lib/api";
import { writeAudit } from "@/lib/auth";
import { checkPlaylistById } from "@/lib/playlists";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  return withAdmin(request, async ({ admin }) => {
    const { id } = await context.params;
    const check = await checkPlaylistById(id);
    await writeAudit(admin.id, "playlist.check", "playlist", id, {
      ok: check?.ok ?? false,
    });
    return json({ check });
  });
}
