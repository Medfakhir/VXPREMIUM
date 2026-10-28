import { errorResponse, json, jsonBody } from "@/lib/api";
import { adminCount, setupAdmin } from "@/lib/auth";
import { setupSchema } from "@/lib/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const configuredKey =
      Boolean(process.env.ADMIN_SETUP_KEY) &&
      (process.env.ADMIN_SETUP_KEY?.length ?? 0) >= 16;
    return json({
      needsSetup: (await adminCount()) === 0,
      configuredKey,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = setupSchema.parse(await jsonBody(request));
    const result = await setupAdmin(input);
    return json(result, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
