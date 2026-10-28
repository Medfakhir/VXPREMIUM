import { errorResponse, json, jsonBody } from "@/lib/api";
import { loginAdmin } from "@/lib/auth";
import { loginSchema } from "@/lib/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const input = loginSchema.parse(await jsonBody(request));
    const result = await loginAdmin(input.email, input.password);
    return json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
