import { getStore } from "@netlify/blobs";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

const STORE_NAME = "vx-premium";
const LOCAL_DIR = path.join(process.cwd(), ".data");

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type WriteJsonOptions =
  | { onlyIfNew: true }
  | { onlyIfMatch: string };

export type WriteJsonResult = {
  modified: boolean;
  etag?: string;
};

const useLocalStore =
  process.env.DATA_STORE_MODE === "local" ||
  (process.env.NODE_ENV !== "production" && !process.env.NETLIFY);

function blobStore() {
  return getStore({ name: STORE_NAME, consistency: "strong" });
}

function localPath(key: string) {
  if (!/^[a-zA-Z0-9._/-]+$/.test(key) || key.includes("..")) {
    throw new Error("Invalid storage key");
  }
  return path.join(LOCAL_DIR, `${key}.json`);
}

async function readLocal<T>(key: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(localPath(key), "utf8");
    return JSON.parse(raw) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function writeLocal<T extends JsonValue>(
  key: string,
  value: T,
  options?: WriteJsonOptions,
): Promise<WriteJsonResult> {
  const file = localPath(key);
  if (options && "onlyIfNew" in options) {
    try {
      await fs.access(file);
      return { modified: false };
    } catch {
    }
  }
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.${randomUUID()}.tmp`;
  await fs.writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await fs.rename(temp, file);
  return { modified: true, etag: randomUUID() };
}

async function listLocalFiles(dir: string, root: string): Promise<string[]> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }

  const keys: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      keys.push(...(await listLocalFiles(full, root)));
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      keys.push(path.relative(root, full).replace(/\.json$/, "").split(path.sep).join("/"));
    }
  }
  return keys;
}

export function getStorageMode() {
  return useLocalStore ? "local-json" : "netlify-blobs";
}

export async function readJson<T>(key: string): Promise<T | null> {
  if (useLocalStore) {
    return readLocal<T>(key);
  }
  console.log("[store] get start", key);
  const raw = (await blobStore().get(key, {
    consistency: "strong",
    type: "text",
  })) as string | null;
  console.log("[store] get done", key, raw === null ? "missing" : "found");
  if (raw === null) return null;
  return JSON.parse(raw) as T;
}

export async function readJsonIfExists<T>(key: string): Promise<T | null> {
  if (useLocalStore) {
    return readLocal<T>(key);
  }
  const { blobs } = await blobStore().list({ prefix: key });
  if (!blobs.some((blob) => blob.key === key)) return null;
  return readJson<T>(key);
}

export async function writeJson<T>(
  key: string,
  value: T,
  options?: WriteJsonOptions,
): Promise<WriteJsonResult> {
  if (useLocalStore) {
    return writeLocal(key, value as JsonValue, options);
  }
  return blobStore().setJSON(key, value, options);
}

export async function deleteJson(key: string) {
  if (useLocalStore) {
    await fs.rm(localPath(key), { force: true });
    return;
  }
  await blobStore().delete(key);
}

export async function listJsonKeys(prefix: string) {
  if (useLocalStore) {
    return (await listLocalFiles(LOCAL_DIR, LOCAL_DIR))
      .filter((key) => key.startsWith(prefix))
      .sort();
  }
  const { blobs } = await blobStore().list({ prefix });
  return blobs.map((blob) => blob.key).sort();
}
