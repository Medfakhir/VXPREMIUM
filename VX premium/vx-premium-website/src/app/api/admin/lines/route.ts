import { json, jsonBody, withAdmin } from "@/lib/api";
import { writeAudit } from "@/lib/auth";
import {
  createLine,
  listLineViews,
  toLineView,
} from "@/lib/lines";
import { listPlaylists } from "@/lib/playlists";
import { createLineSchema } from "@/lib/schemas";
import { getUser } from "@/lib/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withAdmin(request, async () => {
    return json({ lines: await listLineViews() });
  });
}

export async function POST(request: Request) {
  return withAdmin(request, async ({ admin }) => {
    const input = createLineSchema.parse(await jsonBody(request));
    const line = await createLine(input);
    const [user, playlists] = await Promise.all([
      getUser(line.userId),
      listPlaylists(),
    ]);
    await writeAudit(admin.id, "line.create", "line", line.id, {
      mac: line.mac,
      userId: line.userId,
      playlistId: line.playlistId,
    });
    return json(
      {
        line: toLineView(
          line,
          user?.name ?? "Unknown user",
          playlists,
        ),
      },
      201,
    );
  });
}
