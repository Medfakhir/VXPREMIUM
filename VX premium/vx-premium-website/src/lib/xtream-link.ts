export type XtreamLink = {
  serverUrl: string;
  username: string;
  password: string;
};

/**
 * Many providers hand out an "M3U" link that is really an Xtream panel link,
 * for example:
 *   http://host/get.php?username=USER&password=PASS&type=m3u_plus&output=ts
 *   http://host/player_api.php?username=USER&password=PASS
 *
 * The Android player speaks the Xtream API, so when a device adds one of these
 * we store it as an Xtream source instead of a raw M3U file. Returns `null` for
 * ordinary M3U playlists so real M3U URLs are left untouched.
 */
export function parseXtreamPlaylistUrl(raw: string): XtreamLink | null {
  const value = raw.trim();
  if (!value) return null;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  const username = url.searchParams.get("username")?.trim() ?? "";
  const password = url.searchParams.get("password")?.trim() ?? "";
  if (!username || !password) return null;

  const path = url.pathname.toLowerCase();
  const isApiEndpoint =
    path.endsWith("/get.php") || path.endsWith("/player_api.php");
  const hasPanelParams =
    url.searchParams.has("type") || url.searchParams.has("output");
  if (!isApiEndpoint && !hasPanelParams) return null;

  return {
    serverUrl: `${url.protocol}//${url.host}`,
    username,
    password,
  };
}
