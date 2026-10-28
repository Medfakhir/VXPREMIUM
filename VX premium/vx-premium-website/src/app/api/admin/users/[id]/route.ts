import { ApiError, json, jsonBody, withAdmin } from "@/lib/api";
import { writeAudit } from "@/lib/auth";
import { updateUserSchema } from "@/lib/schemas";
import { deleteUser, updateUser } from "@/lib/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  return withAdmin(request, async ({ admin }) => {
    const { id } = await context.params;
    const { resetDevices, ...patch } = updateUserSchema.parse(
      await jsonBody(request),
    );
    if (Object.keys(patch).length === 0 && !resetDevices) {
      throw new ApiError("No changes supplied", 400);
    }
    const result = await updateUser(id, { ...patch, resetDevices });
    await writeAudit(
      admin.id,
      resetDevices ? "user.reset_devices" : "user.update",
      "user",
      id,
      { resetCount: result.resetCount },
    );
    return json(result);
  });
}

export async function DELETE(request: Request, context: Context) {
  return withAdmin(request, async ({ admin }) => {
    const { id } = await context.params;
    const user = await deleteUser(id);
    await writeAudit(admin.id, "user.delete", "user", id, {
      username: user.username,
    });
    return json({ ok: true });
  });
}
