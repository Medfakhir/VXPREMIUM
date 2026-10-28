import { ZodError } from "zod";
import { AuthError, AuthContext, readSession } from "@/lib/auth";
import { SecurityConfigError } from "@/lib/crypto";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export function errorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return json({ error: error.message }, error.status);
  }
  if (error instanceof AuthError) {
    return json({ error: error.message }, error.status);
  }
  if (error instanceof SecurityConfigError) {
    return json({ error: error.message }, 503);
  }
  if (error instanceof ZodError) {
    return json(
      {
        error: error.issues[0]?.message ?? "Invalid request",
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      422,
    );
  }
  if (error instanceof SyntaxError) {
    return json({ error: "Invalid JSON body" }, 400);
  }
  console.error(error);
  return json({ error: "Unexpected server error" }, 500);
}

export async function withAdmin(
  request: Request,
  handler: (auth: AuthContext) => Promise<Response>,
) {
  try {
    const auth = await readSession(request);
    if (!auth) {
      throw new ApiError("Unauthorized", 401);
    }
    return await handler(auth);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function jsonBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ApiError("Invalid JSON body", 400);
  }
}
