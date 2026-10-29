import { randomUUID } from "node:crypto";
import { hashToken, randomToken } from "@/lib/crypto";
import {
  deleteJson,
  listJsonKeys,
  readJson,
  readJsonIfExists,
  writeJson,
} from "@/lib/json-store";

const PREFIX = "portal-sessions/";
export const PORTAL_SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export type PortalSessionRecord = {
  id: string;
  lineId: string;
  createdAt: string;
  expiresAt: string;
};

export async function createPortalSessionRecord(lineId: string) {
  const token = randomToken();
  const tokenHash = hashToken(token);
  const now = new Date();
  const session: PortalSessionRecord = {
    id: randomUUID(),
    lineId,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + PORTAL_SESSION_TTL_MS).toISOString(),
  };
  await writeJson(`${PREFIX}${tokenHash}`, session);
  return { token, tokenHash, session };
}

export async function readPortalSessionRecord(tokenHash: string) {
  return readJsonIfExists<PortalSessionRecord>(`${PREFIX}${tokenHash}`);
}

export async function deletePortalSessionRecord(tokenHash: string) {
  await deleteJson(`${PREFIX}${tokenHash}`);
}

export async function deletePortalSessionsForLine(lineId: string) {
  const keys = await listJsonKeys(PREFIX);
  const sessions = await Promise.all(
    keys.map((key) =>
      readJson<PortalSessionRecord>(key).then((session) => ({
        key,
        session,
      })),
    ),
  );
  const owned = sessions.filter(
    (entry) => entry.session?.lineId === lineId,
  );
  await Promise.all(owned.map((entry) => deleteJson(entry.key)));
  return owned.length;
}
