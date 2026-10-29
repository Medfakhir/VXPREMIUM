import { json, jsonBody } from "@/lib/api";
import { assertSameOrigin, withPortal } from "@/lib/portal-auth";
import {
  createPortalPlaylist,
  getPortalPlaylistView,
  listPortalPlaylists,
} from "@/lib/portal-playlists";
import { portalPlaylistSchema } from "@/lib/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withPortal(request, async ({ line }) => {
    return json({ playlists: await listPortalPlaylists(line) });
  });
}

export async function POST(request: Request) {
  return withPortal(request, async ({ line, user }) => {
    assertSameOrigin(request);
    const input = portalPlaylistSchema.parse(await jsonBody(request));
    const playlist = await createPortalPlaylist(line, user, input);
    return json(
      {
        playlist: await getPortalPlaylistView(line.id, playlist.id),
      },
      201,
    );
  });
}
