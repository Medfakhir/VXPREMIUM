import { readJsonIfExists, writeJson } from "@/lib/json-store";
import { playerConfigSchema } from "@/lib/schemas";
import type { PlayerConfig } from "@/lib/types";

const CONFIG_KEY = "config/player";

export type { PlayerConfig };

/**
 * Fallback values used before an admin has saved anything, and for any field
 * the player needs but the stored record does not yet contain.
 */
export const DEFAULT_PLAYER_CONFIG: PlayerConfig = playerConfigSchema.parse({});

/**
 * Reads the player remote-config. Always returns a complete object: missing or
 * invalid stored values fall back to the defaults so the player never receives
 * a partially-shaped payload.
 */
export async function getPlayerConfig(): Promise<PlayerConfig> {
  try {
    const stored = await readJsonIfExists<Partial<PlayerConfig>>(CONFIG_KEY);
    if (!stored) {
      return { ...DEFAULT_PLAYER_CONFIG };
    }
    const parsed = playerConfigSchema.safeParse(stored);
    if (!parsed.success) {
      return { ...DEFAULT_PLAYER_CONFIG };
    }
    return { ...DEFAULT_PLAYER_CONFIG, ...parsed.data };
  } catch {
    return { ...DEFAULT_PLAYER_CONFIG };
  }
}

/**
 * Validates and persists the player remote-config. Throws a ZodError when the
 * payload is invalid, which the API layer turns into a 422 response.
 */
export async function savePlayerConfig(input: unknown): Promise<PlayerConfig> {
  const config = playerConfigSchema.parse(input);
  await writeJson(CONFIG_KEY, config);
  return config;
}
