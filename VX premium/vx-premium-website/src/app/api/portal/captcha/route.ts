import { errorResponse, json } from "@/lib/api";
import { createCaptchaChallenge } from "@/lib/captcha";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return json(createCaptchaChallenge());
  } catch (error) {
    return errorResponse(error);
  }
}
