import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

export type EncryptedValue = {
  v: 1;
  iv: string;
  tag: string;
  data: string;
};

export type PasswordHash = {
  salt: string;
  hash: string;
};

export class SecurityConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SecurityConfigError";
  }
}

export async function hashPassword(password: string): Promise<PasswordHash> {
  const salt = randomBytes(16);
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return {
    salt: salt.toString("base64"),
    hash: derived.toString("base64"),
  };
}

export async function verifyPassword(password: string, stored: PasswordHash) {
  const salt = Buffer.from(stored.salt, "base64");
  const expected = Buffer.from(stored.hash, "base64");
  const derived = (await scryptAsync(password, salt, expected.length)) as Buffer;
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function encryptionKey() {
  const raw = process.env.DATA_ENCRYPTION_KEY;
  if (!raw || raw.length < 32) {
    throw new SecurityConfigError(
      "DATA_ENCRYPTION_KEY must be configured with at least 32 characters.",
    );
  }
  return createHash("sha256").update(raw).digest();
}

export function deviceKeyFingerprint(deviceKey: string) {
  return createHmac("sha256", encryptionKey())
    .update(deviceKey.trim())
    .digest("hex");
}

export function encryptSecret(value: string): EncryptedValue {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const data = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return {
    v: 1,
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    data: data.toString("base64"),
  };
}

export function decryptSecret(value: EncryptedValue) {
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(value.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(value.tag, "base64"));
  const data = Buffer.concat([
    decipher.update(Buffer.from(value.data, "base64")),
    decipher.final(),
  ]);
  return data.toString("utf8");
}
