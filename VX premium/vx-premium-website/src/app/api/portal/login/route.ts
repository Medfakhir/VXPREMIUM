import { ApiError, errorResponse, json, jsonBody } from "@/lib/api";
import { verifyCaptcha } from "@/lib/captcha";
import { normalizeMac } from "@/lib/lines";
import {
  assertSameOrigin,
  authenticatePortalLine,
  createPortalSession,
  portalCookieHeader,
  toPortalLineView,
} from "@/lib/portal-auth";
import {
  clearPortalLoginFailures,
  portalLoginAllowed,
  recordPortalLoginFailure,
} from "@/lib/portal-limit";
import { listPortalPlaylists } from "@/lib/portal-playlists";
import { portalLoginSchema } from "@/lib/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientIp(request: Request) {
  return (
    request.headers.get("x-nf-client-connection-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const input = portalLoginSchema.parse(await jsonBody(request));
    const mac = normalizeMac(input.mac);
    const ip = clientIp(request);
    if (!(await portalLoginAllowed(ip, mac))) {
      throw new ApiError("Too many login attempts. Try again later.", 429);
    }

    try {
      if (!(await verifyCaptcha(input.captchaToken, input.captchaAnswer))) {
        throw new ApiError("Incorrect answer", 403);
      }
      const { line, user } = await authenticatePortalLine(
        mac,
        input.deviceKey,
      );
      const { token } = await createPortalSession(line.id);
      const playlists = await listPortalPlaylists(line);
      await clearPortalLoginFailures(ip, mac);
      const response = json({
        line: toPortalLineView(line, user),
        playlists,
      });
      response.headers.append("Set-Cookie", portalCookieHeader(token));
      return response;
    } catch (error) {
      if (error instanceof ApiError && [403, 404].includes(error.status)) {
        await recordPortalLoginFailure(ip, mac);
      }
      throw error;
    }
  } catch (error) {
    return errorResponse(error);
  }
}
