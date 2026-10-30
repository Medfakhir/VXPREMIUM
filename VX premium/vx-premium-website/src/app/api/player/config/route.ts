import { json } from "@/lib/api";
import { getPlayerConfig } from "@/lib/player-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public endpoint consumed by the player app on launch. Always served with
 * `Cache-Control: no-store` (see `json()`) so config changes take effect on the
 * next app start.
 */
export async function GET() {
  return json(await getPlayerConfig());
}
