import { json, jsonBody, withAdmin } from "@/lib/api";
import { writeAudit } from "@/lib/auth";
import {
  DEFAULT_PLAYER_CONFIG,
  getPlayerConfig,
  savePlayerConfig,
} from "@/lib/player-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withAdmin(request, async () => {
    const config = await getPlayerConfig();
    return json({ config, defaults: DEFAULT_PLAYER_CONFIG });
  });
}

export async function PUT(request: Request) {
  return withAdmin(request, async ({ admin }) => {
    const config = await savePlayerConfig(await jsonBody(request));
    await writeAudit(admin.id, "config.update", "player-config", "global", {
      serverUrl: config.server_url,
      backupServers: config.backup_server_urls.length,
      testingMode: config.testing_mode,
      hasAmplitudeKey: config.amplitude_api_key.length > 0,
    });
    return json({ config });
  });
}
