import { json, jsonBody, withAdmin } from "@/lib/api";
import { writeAudit } from "@/lib/auth";
import { deleteLine, toLineView, updateLine } from "@/lib/lines";
import { listPlaylists } from "@/lib/playlists";
import { updateLineSchema } from "@/lib/schemas";
import { getUser } from "@/lib/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  return withAdmin(request, async ({ admin }) => {
    const { id } = await context.params;
    const patch = updateLineSchema.parse(await jsonBody(request));
    const line = await updateLine(id, patch);
    const [user, playlists] = await Promise.all([
      getUser(line.userId),
      listPlaylists(),
    ]);
    await writeAudit(admin.id, "line.update", "line", id, {
      status: line.status,
      userId: line.userId,
      playlistId: line.playlistId,
    });
    return json({
      line: toLineView(
        line,
        user?.name ?? "Unknown user",
        playlists,
      ),
    });
  });
}

export async function DELETE(request: Request, context: Context) {
  return withAdmin(request, async ({ admin }) => {
    const { id } = await context.params;
    const line = await deleteLine(id);
    await writeAudit(admin.id, "line.delete", "line", id, {
      mac: line.mac,
      userId: line.userId,
    });
    return json({ ok: true });
  });
}
