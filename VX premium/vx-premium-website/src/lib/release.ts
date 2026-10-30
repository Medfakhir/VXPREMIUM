/**
 * Single source of truth for the published Android player build.
 *
 * When you publish a new APK:
 *   1. Drop the new file into `public/downloads/`.
 *   2. Update `version`, `versionCode`, `apkFile` and `releasedAt` below.
 *   3. Keep the old file name as a redirect in `netlify.toml` so existing links keep working.
 *   4. Set the same version in the dashboard (Player config -> App updates) so the in-app
 *      "Check for updates" button offers it to players already on this build.
 */
export const RELEASE = {
  version: "1.2.4",
  versionCode: 6,
  apkFile: "/downloads/VX-Premium-1.2.4-release.apk",
  /** ISO date the build was published. */
  releasedAt: "2026-10-30",
  /** Human-readable publish date shown next to the download link. */
  releasedAtLabel: "Oct 30, 2026",
} as const;

/** Short label used under the public download buttons. */
export const RELEASE_LABEL = `Latest v${RELEASE.version} · updated ${RELEASE.releasedAtLabel}`;
