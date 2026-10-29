import { json, jsonBody } from "@/lib/api";
import { assertSameOrigin, withPortal } from "@/lib/portal-auth";
import {
  deletePortalPlaylist,
  getPortalPlaylistView,
  updatePortalPlaylist,
} from "@/lib/portal-playlists";
import { updatePortalPlaylistSchema } from "@/lib/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  return withPortal(request, async ({ line, user }) => {
    assertSameOrigin(request);
    const { id } = await context.params;
    const patch = updatePortalPlaylistSchema.parse(await jsonBody(request));
    const playlist = await updatePortalPlaylist(line, user, id, patch);
    return json({
      playlist: await getPortalPlaylistView(line.id, playlist.id),
    });
  });
}

export async function DELETE(request: Request, context: Context) {
  return withPortal(request, async ({ line, user }) => {
    assertSameOrigin(request);
    const { id } = await context.params;
    await deletePortalPlaylist(line, user, id);
    return json({ ok: true });
  });
}
