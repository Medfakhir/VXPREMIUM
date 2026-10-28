import { z } from "zod";

const httpUrl = z
  .string()
  .trim()
  .min(1, "URL is required")
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }, "Enter a valid http or https URL");

export const setupSchema = z.object({
  setupKey: z.string().min(1, "Setup key is required").max(256),
  name: z.string().trim().min(2, "Name is too short").max(80),
  email: z.string().trim().email("Enter a valid email").max(160),
  password: z.string().min(10, "Password must be at least 10 characters").max(200),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(160),
  password: z.string().min(1, "Password is required").max(200),
});

export const createUserSchema = z.object({
  username: z.string().trim().min(2, "Username is too short").max(64),
  name: z.string().trim().min(2, "Name is too short").max(80),
  email: z.string().trim().email("Enter a valid email").max(160).or(z.literal("")),
  plan: z.string().trim().min(1, "Plan is required").max(80),
  status: z.enum(["active", "disabled"]).default("active"),
  expiresAt: z.string().min(1, "Expiry date is required"),
  maxConnections: z.coerce.number().int().min(1).max(10).default(1),
  allowOwnPlaylists: z.boolean().default(true),
  notes: z.string().max(1000).default(""),
});

export const updateUserSchema = z.object({
  username: z.string().trim().min(2).max(64).optional(),
  name: z.string().trim().min(2).max(80).optional(),
  email: z.string().trim().email("Enter a valid email").max(160).or(z.literal("")).optional(),
  plan: z.string().trim().min(1).max(80).optional(),
  status: z.enum(["active", "disabled"]).optional(),
  expiresAt: z.string().min(1).optional(),
  maxConnections: z.coerce.number().int().min(1).max(10).optional(),
  allowOwnPlaylists: z.boolean().optional(),
  notes: z.string().max(1000).optional(),
  resetDevices: z.boolean().optional(),
});

export const createPlaylistSchema = z
  .object({
    userId: z.string().min(1, "Select a user"),
    name: z.string().trim().min(2, "Name is too short").max(80),
    type: z.enum(["xtream", "m3u"]),
    serverUrl: z.string().trim().max(500).optional().default(""),
    username: z.string().trim().max(200).optional().default(""),
    password: z.string().max(300).optional().default(""),
    m3uUrl: z.string().trim().max(2000).optional().default(""),
    epgUrl: z.string().trim().max(2000).optional().default(""),
  })
  .superRefine((value, context) => {
    if (value.type === "xtream") {
      if (!value.serverUrl) {
        context.addIssue({
          code: "custom",
          path: ["serverUrl"],
          message: "Xtream server URL is required",
        });
      } else if (!httpUrl.safeParse(value.serverUrl).success) {
        context.addIssue({
          code: "custom",
          path: ["serverUrl"],
          message: "Enter a valid http or https server URL",
        });
      }
      if (!value.username) {
        context.addIssue({
          code: "custom",
          path: ["username"],
          message: "Xtream username is required",
        });
      }
      if (!value.password) {
        context.addIssue({
          code: "custom",
          path: ["password"],
          message: "Xtream password is required",
        });
      }
    }

    if (value.type === "m3u") {
      if (!value.m3uUrl) {
        context.addIssue({
          code: "custom",
          path: ["m3uUrl"],
          message: "M3U URL is required",
        });
      } else if (!httpUrl.safeParse(value.m3uUrl).success) {
        context.addIssue({
          code: "custom",
          path: ["m3uUrl"],
          message: "Enter a valid http or https M3U URL",
        });
      }
    }

    if (value.epgUrl && !httpUrl.safeParse(value.epgUrl).success) {
      context.addIssue({
        code: "custom",
        path: ["epgUrl"],
        message: "Enter a valid http or https EPG URL",
      });
    }
  });
