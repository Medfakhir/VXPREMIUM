import { json, jsonBody, withAdmin } from "@/lib/api";
import { writeAudit } from "@/lib/auth";
import { createUserSchema } from "@/lib/schemas";
import { createUser, listUsers } from "@/lib/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withAdmin(request, async () => {
    return json({ users: await listUsers() });
  });
}

export async function POST(request: Request) {
  return withAdmin(request, async ({ admin }) => {
    const input = createUserSchema.parse(await jsonBody(request));
    const user = await createUser(input);
    await writeAudit(admin.id, "user.create", "user", user.id, {
      username: user.username,
      plan: user.plan,
    });
    return json({ user }, 201);
  });
}
