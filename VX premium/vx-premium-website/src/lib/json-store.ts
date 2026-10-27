import { getStore } from "@netlify/blobs";

const STORE_NAME = "vx-premium";

function store() {
  return getStore({ name: STORE_NAME, consistency: "strong" });
}

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export async function readJson<T extends JsonValue>(key: string): Promise<T | null> {
  return (await store().get(key, { type: "json", consistency: "strong" })) as T | null;
}

export type WriteJsonOptions =
  | { onlyIfNew: true }
  | { onlyIfMatch: string };

export async function writeJson<T extends JsonValue>(
  key: string,
  value: T,
  options?: WriteJsonOptions,
) {
  return store().setJSON(key, value, options);
}

export async function deleteJson(key: string) {
  await store().delete(key);
}

export async function listJsonKeys(prefix: string) {
  const { blobs } = await store().list({ prefix });
  return blobs.map((blob) => blob.key);
}
