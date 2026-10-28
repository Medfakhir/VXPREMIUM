import { randomUUID } from "node:crypto";
import {
  hashPassword,
  hashToken,
  normalizeEmail,
  PasswordHash,
  randomToken,
  safeEqual,
  SecurityConfigError,
  verifyPassword,
} from "@/lib/crypto";
import {
  deleteJson,
  listJsonKeys,
  readJson,
  readJsonIfExists,
  writeJson,
} from "@/lib/json-store";
import type { AdminSessionView } from "@/lib/types";

const ADMIN_PREFIX = "admins/";
const SESSION_PREFIX = "sessions/";
const AUDIT_PREFIX = "audit/";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export type AdminAccount = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin";
  password: PasswordHash;
  createdAt: string;
  updatedAt: string;
};

export type AdminSession = {
  id: string;
  adminId: string;
  createdAt: string;
  expiresAt: string;
};

export type AuthContext = {
  admin: AdminAccount;
  session: AdminSession;
  tokenHash: string;
};

export class AuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export function publicAdmin(admin: AdminAccount): AdminSessionView {
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  };
}

export async function adminCount() {
  return (await listJsonKeys(ADMIN_PREFIX)).length;
}

async function admins() {
  const keys = await listJsonKeys(ADMIN_PREFIX);
  const records = await Promise.all(keys.map((key) => readJson<AdminAccount>(key)));
  return records.filter((record): record is AdminAccount => record !== null);
}

export async function findAdminByEmail(email: string) {
  const normalized = normalizeEmail(email);
  const all = await admins();
  return all.find((admin) => admin.email === normalized) ?? null;
}

async function getAdmin(id: string) {
  return readJsonIfExists<AdminAccount>(`${ADMIN_PREFIX}${id}`);
}

export async function createSession(admin: AdminAccount) {
  const token = randomToken();
  const tokenHash = hashToken(token);
  const now = new Date();
  const session: AdminSession = {
    id: randomUUID(),
    adminId: admin.id,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
  };
  await writeJson(`${SESSION_PREFIX}${tokenHash}`, session);
  return { token, session };
}

export async function readSession(request: Request): Promise<AuthContext | null> {
  const header = request.headers.get("authorization");
  if (!header || !header.startsWith("Bearer ")) {
    return null;
  }
  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    return null;
  }
  const tokenHash = hashToken(token);
  const session = await readJsonIfExists<AdminSession>(
    `${SESSION_PREFIX}${tokenHash}`,
  );
  if (!session) {
    return null;
  }
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    await deleteJson(`${SESSION_PREFIX}${tokenHash}`);
    return null;
  }
  const admin = await getAdmin(session.adminId);
  if (!admin) {
    return null;
  }
  return { admin, session, tokenHash };
}

export async function deleteSession(tokenHash: string) {
  await deleteJson(`${SESSION_PREFIX}${tokenHash}`);
}

export async function loginAdmin(email: string, password: string) {
  const admin = await findAdminByEmail(email);
  if (!admin || !(await verifyPassword(password, admin.password))) {
    throw new AuthError("Invalid email or password", 401);
  }
  const { token } = await createSession(admin);
  await writeAudit(admin.id, "admin.login", "admin", admin.id);
  return { token, admin: publicAdmin(admin) };
}

export async function setupAdmin(input: {
  setupKey: string;
  name: string;
  email: string;
  password: string;
}) {
  const expectedKey = process.env.ADMIN_SETUP_KEY;
  if (!expectedKey || expectedKey.length < 16) {
    throw new SecurityConfigError(
      "ADMIN_SETUP_KEY must be configured with at least 16 characters.",
    );
  }
  if (!safeEqual(input.setupKey, expectedKey)) {
    throw new AuthError("Invalid setup key", 403);
  }
  if ((await adminCount()) > 0) {
    throw new AuthError("Admin account already exists", 409);
  }

  const now = new Date().toISOString();
  const admin: AdminAccount = {
    id: randomUUID(),
    name: input.name.trim(),
    email: normalizeEmail(input.email),
    role: "owner",
    password: await hashPassword(input.password),
    createdAt: now,
    updatedAt: now,
  };
  await writeJson(`${ADMIN_PREFIX}${admin.id}`, admin);
  const { token } = await createSession(admin);
  await writeAudit(admin.id, "admin.setup", "admin", admin.id);
  return { token, admin: publicAdmin(admin) };
}

export async function writeAudit(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  details: Record<string, unknown> = {},
) {
  const now = new Date();
  const id = `${now.getTime()}-${randomUUID()}`;
  await writeJson(`${AUDIT_PREFIX}${id}`, {
    id,
    adminId,
    action,
    targetType,
    targetId,
    details,
    createdAt: now.toISOString(),
  });
}

export async function recentAudit(limit = 8) {
  const keys = await listJsonKeys(AUDIT_PREFIX);
  const latest = keys.slice(-limit).reverse();
  const records = await Promise.all(
    latest.map((key) =>
      readJson<{
        id: string;
        action: string;
        targetType: string;
        targetId: string;
        createdAt: string;
      }>(key),
    ),
  );
  return records.filter((record) => record !== null);
}
