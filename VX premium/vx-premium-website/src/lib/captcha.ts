import { createHash, createHmac, randomBytes, randomInt } from "node:crypto";
import { safeEqual, SecurityConfigError } from "@/lib/crypto";
import type { CaptchaChallenge } from "@/lib/types";

const TTL_MS = 5 * 60 * 1000;
const WORDS = [
  "amber",
  "anchor",
  "arrow",
  "basket",
  "beacon",
  "bison",
  "cabin",
  "cactus",
  "camera",
  "candle",
  "canyon",
  "cedar",
  "circle",
  "cloud",
  "copper",
  "coral",
  "crane",
  "delta",
  "desert",
  "dolphin",
  "eagle",
  "ember",
  "falcon",
  "fern",
  "forest",
  "glacier",
  "granite",
  "harbor",
  "hazel",
  "island",
  "ivory",
  "jasmine",
  "jungle",
  "kite",
  "lantern",
  "lemon",
  "lily",
  "maple",
  "meadow",
  "meteor",
  "mint",
  "moon",
  "nexus",
  "oak",
  "ocean",
  "olive",
  "orbit",
  "pearl",
  "pine",
  "planet",
  "quartz",
  "raven",
  "reef",
  "river",
  "robin",
  "saffron",
  "sailor",
  "silver",
  "sparrow",
  "spring",
  "storm",
  "summit",
  "sunset",
  "tiger",
  "timber",
  "topaz",
  "tower",
  "valley",
  "velvet",
  "violet",
  "walnut",
  "willow",
  "winter",
  "zephyr",
];

type CaptchaPayload = {
  n: string;
  h: string;
  e: number;
  i: number;
};

function secret() {
  const raw = process.env.DATA_ENCRYPTION_KEY;
  if (!raw || raw.length < 32) {
    throw new SecurityConfigError(
      "DATA_ENCRYPTION_KEY must be configured with at least 32 characters.",
    );
  }
  return raw;
}

function normalizeAnswer(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\+/g, " ")
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function answerHash(nonce: string, answer: string) {
  return createHash("sha256")
    .update(`${nonce}:${normalizeAnswer(answer)}`)
    .digest("base64url");
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function pickWords() {
  const first = WORDS[randomInt(WORDS.length)];
  let second = WORDS[randomInt(WORDS.length)];
  while (second === first) {
    second = WORDS[randomInt(WORDS.length)];
  }
  return [first, second];
}

export function createCaptchaChallenge(): CaptchaChallenge {
  const words = pickWords();
  const answer = words.join(" ");
  const nonce = randomBytes(16).toString("hex");
  const now = Date.now();
  const payload: CaptchaPayload = {
    n: nonce,
    h: answerHash(nonce, answer),
    e: now + TTL_MS,
    i: now,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  return {
    question: words.join("   +   "),
    token: `${encoded}.${sign(encoded)}`,
  };
}

export function verifyCaptcha(token: string, answer: string) {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return false;
  if (!safeEqual(signature, sign(encoded))) return false;

  let payload: CaptchaPayload;
  try {
    payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as CaptchaPayload;
  } catch {
    return false;
  }
  if (
    !payload ||
    typeof payload.n !== "string" ||
    typeof payload.h !== "string" ||
    typeof payload.e !== "number"
  ) {
    return false;
  }
  if (payload.e <= Date.now()) return false;
  return safeEqual(payload.h, answerHash(payload.n, answer));
}
