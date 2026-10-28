import { hashToken } from "@/lib/crypto";
import { deleteJson, readJsonIfExists, writeJson } from "@/lib/json-store";

const PREFIX = "activation-throttle/";
const LIMIT = 20;
const WINDOW_MS = 15 * 60 * 1000;

type AttemptRecord = {
  count: number;
  resetAt: string;
};

function keyFor(ip: string, mac: string) {
  return `${PREFIX}${hashToken(`${ip}|${mac}`)}`;
}

export async function activationAllowed(ip: string, mac: string) {
  const record = await readJsonIfExists<AttemptRecord>(keyFor(ip, mac));
  if (!record) return true;
  if (new Date(record.resetAt).getTime() <= Date.now()) return true;
  return record.count < LIMIT;
}

export async function recordActivationFailure(ip: string, mac: string) {
  const key = keyFor(ip, mac);
  const current = await readJsonIfExists<AttemptRecord>(key);
  const now = Date.now();
  const active =
    current && new Date(current.resetAt).getTime() > now ? current : null;
  const record: AttemptRecord = {
    count: (active?.count ?? 0) + 1,
    resetAt: active?.resetAt ?? new Date(now + WINDOW_MS).toISOString(),
  };
  await writeJson(key, record);
}

export async function clearActivationFailures(ip: string, mac: string) {
  await deleteJson(keyFor(ip, mac));
}
