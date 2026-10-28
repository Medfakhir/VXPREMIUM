import { json, withAdmin } from "@/lib/api";
import { recentAudit } from "@/lib/auth";
import { getStorageMode } from "@/lib/json-store";
import { listLines } from "@/lib/lines";
import { listPlaylists } from "@/lib/playlists";
import { isExpired, listDevices, listUsers } from "@/lib/users";
import type { OverviewResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withAdmin(request, async () => {
    const [users, playlists, lines, devices, audit] = await Promise.all([
      listUsers(),
      listPlaylists(),
      listLines(),
      listDevices(),
      recentAudit(8),
    ]);

    const now = Date.now();
    const soon = now + 7 * 24 * 60 * 60 * 1000;
    const onlineWindow = now - 5 * 60 * 1000;

    const result: OverviewResponse = {
      stats: {
        totalUsers: users.length,
        activeUsers: users.filter(
          (user) => user.status === "active" && !isExpired(user),
        ).length,
        expiringSoon: users.filter(
          (user) =>
            user.status === "active" &&
            !isExpired(user) &&
            new Date(user.expiresAt).getTime() <= soon,
        ).length,
        disabledUsers: users.filter((user) => user.status === "disabled").length,
        playlists: playlists.length,
        lines: lines.length,
        activeLines: lines.filter(
          (line) =>
            line.status === "active" &&
            new Date(line.expiresAt).getTime() > now,
        ).length,
        devices: devices.length,
        onlineDevices: devices.filter(
          (device) => new Date(device.lastSeenAt).getTime() >= onlineWindow,
        ).length,
      },
      recentUsers: users.slice(0, 5),
      recentAudit: audit.map((entry) => ({
        id: entry.id,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        createdAt: entry.createdAt,
      })),
      storage: getStorageMode(),
    };

    return json(result);
  });
}
