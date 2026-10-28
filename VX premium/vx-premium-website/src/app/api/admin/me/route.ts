import { json, withAdmin } from "@/lib/api";
import { publicAdmin } from "@/lib/auth";
import { getStorageMode } from "@/lib/json-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withAdmin(request, async ({ admin, session }) => {
    return json({
      admin: publicAdmin(admin),
      sessionExpiresAt: session.expiresAt,
      storage: getStorageMode(),
    });
  });
}
