import { json, withAdmin } from "@/lib/api";
import { deleteSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return withAdmin(request, async ({ tokenHash }) => {
    await deleteSession(tokenHash);
    return json({ ok: true });
  });
}
