import { json } from "@/lib/api";
import { toPortalLineView, withPortal } from "@/lib/portal-auth";
import { listPortalPlaylists } from "@/lib/portal-playlists";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withPortal(request, async ({ line, user }) => {
    return json({
      line: toPortalLineView(line, user),
      playlists: await listPortalPlaylists(line),
    });
  });
}
