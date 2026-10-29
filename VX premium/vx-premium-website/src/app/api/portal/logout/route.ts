import { errorResponse, json } from "@/lib/api";
import {
  assertSameOrigin,
  clearPortalCookieHeader,
  destroyPortalSession,
  readPortalSession,
} from "@/lib/portal-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const auth = await readPortalSession(request);
    if (auth) {
      await destroyPortalSession(auth.tokenHash);
    }
    const response = json({ ok: true });
    response.headers.append("Set-Cookie", clearPortalCookieHeader());
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
