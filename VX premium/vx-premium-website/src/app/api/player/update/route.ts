import { json } from "@/lib/api";
import { getPlayerConfig } from "@/lib/player-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public endpoint the player app polls to discover a newer build. Kept small so
 * the update check is cheap. `Cache-Control: no-store` is set by `json()`.
 */
export async function GET() {
  const config = await getPlayerConfig();
  return json({
    versionCode: config.update_version_code,
    versionName: config.update_version_name,
    apkUrl: config.update_apk_url,
    notes: config.update_notes,
    force: config.force_update,
  });
}
