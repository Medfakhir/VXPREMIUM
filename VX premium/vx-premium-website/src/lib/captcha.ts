import * as svgCaptcha from "svg-captcha";
import { hashToken, randomToken, safeEqual } from "@/lib/crypto";
import {
  deleteJson,
  readJsonIfExists,
  writeJson,
} from "@/lib/json-store";
import type { CaptchaChallenge } from "@/lib/types";

const PREFIX = "captcha-challenges/";
const TTL_MS = 5 * 60 * 1000;

type CaptchaRecord = {
  answer: string;
  createdAt: string;
  expiresAt: string;
};

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

export async function createCaptchaChallenge(): Promise<CaptchaChallenge> {
  const generated = svgCaptcha.create({
    size: 5,
    noise: 4,
    color: true,
    background: "#0b1220",
    width: 260,
    height: 72,
    fontSize: 50,
    ignoreChars: "0OoIl1",
  });
  const token = randomToken();
  const now = Date.now();
  const record: CaptchaRecord = {
    answer: normalizeAnswer(generated.text),
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + TTL_MS).toISOString(),
  };
  await writeJson(`${PREFIX}${hashToken(token)}`, record);
  return {
    image: `data:image/svg+xml;base64,${Buffer.from(generated.data, "utf8").toString("base64")}`,
    token,
    ...(process.env.DATA_STORE_MODE === "local" && process.env.NETLIFY !== "true"
      ? { debugAnswer: generated.text }
      : {}),
  };
}

export async function verifyCaptcha(token: string, answer: string) {
  if (!token || !answer) return false;
  const key = `${PREFIX}${hashToken(token)}`;
  const record = await readJsonIfExists<CaptchaRecord>(key);
  if (!record) return false;
  await deleteJson(key);
  if (new Date(record.expiresAt).getTime() <= Date.now()) return false;
  return safeEqual(normalizeAnswer(record.answer), normalizeAnswer(answer));
}
