import { ApiError, errorResponse, json, jsonBody } from "@/lib/api";
import {
  activationAllowed,
  clearActivationFailures,
  recordActivationFailure,
} from "@/lib/activation-limit";
import { activateLine, normalizeMac } from "@/lib/lines";
import { activateLineSchema } from "@/lib/schemas";

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
    const input = activateLineSchema.parse(await jsonBody(request));
    const mac = normalizeMac(input.mac);
    const ip = clientIp(request);
    console.log("[activate] rate check start");
    if (!(await activationAllowed(ip, mac))) {
      throw new ApiError("Too many activation attempts. Try again later.", 429);
    }
    console.log("[activate] rate check done");
    try {
      console.log("[activate] line activation start");
      const result = await activateLine({
        mac,
        deviceKey: input.deviceKey,
        deviceName: input.deviceName,
        ip,
      });
      await clearActivationFailures(ip, mac);
      console.log("[activate] success");
      return json(result);
    } catch (error) {
      if (error instanceof ApiError && [403, 404].includes(error.status)) {
        console.log("[activate] failure recorded", error.status);
        await recordActivationFailure(ip, mac);
      }
      throw error;
    }
  } catch (error) {
    console.log("[activate] response error", error instanceof ApiError ? error.status : "unexpected");
    return errorResponse(error);
  }
}
