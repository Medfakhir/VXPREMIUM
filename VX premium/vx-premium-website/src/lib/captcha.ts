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

// Two clear uppercase letters, avoiding look-alike characters.
const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";

function randomLetter() {
  return LETTERS[Math.floor(Math.random() * LETTERS.length)];
}

/**
 * Draws two big letters on a dark background with no distortion so the check
 * stays easy to read on any screen.
 */
function captchaImage(code: string) {
  const width = 200;
  const height = 84;
  const letters = code
    .split("")
    .map(
      (letter, index) =>
        `<text x="${60 + index * 80}" y="60" text-anchor="middle" ` +
        `font-family="'Courier New',Courier,monospace" font-size="56" ` +
        `font-weight="700" fill="#67e8f9">${letter}</text>`,
    )
    .join("");
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}" role="img"><rect width="${width}" ` +
    `height="${height}" rx="10" fill="#0b1220"/>` +
    `<line x1="14" y1="16" x2="186" y2="70" stroke="#12324f" stroke-width="2"/>` +
    `<line x1="14" y1="70" x2="186" y2="16" stroke="#12324f" stroke-width="2"/>` +
    `${letters}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
}

export async function createCaptchaChallenge(): Promise<CaptchaChallenge> {
  const answer = normalizeAnswer(`${randomLetter()}${randomLetter()}`);
  const token = randomToken();
  const now = Date.now();
  const record: CaptchaRecord = {
    answer,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + TTL_MS).toISOString(),
  };
  await writeJson(`${PREFIX}${hashToken(token)}`, record);
  return {
    image: captchaImage(answer.toUpperCase()),
    token,
    ...(process.env.DATA_STORE_MODE === "local" && process.env.NETLIFY !== "true"
      ? { debugAnswer: answer }
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
