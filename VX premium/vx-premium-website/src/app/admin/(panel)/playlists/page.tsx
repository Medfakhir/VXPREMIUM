"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/lib/admin-client";
import { formatDate } from "@/lib/format";
import type {
  AdminUser,
  LineView,
  PlaylistStatus,
  PlaylistType,
  PlaylistView,
} from "@/lib/types";

type PlaylistsResponse = {
  playlists: PlaylistView[];
};

type UsersResponse = {
  users: AdminUser[];
};

type LinesResponse = {
  lines: LineView[];
};

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<PlaylistView[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [lines, setLines] = useState<LineView[]>([]);
  const [query, setQuery] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<PlaylistView | null>(
    null,
  );
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    try {
      const [playlistResult, userResult, lineResult] = await Promise.all([
        adminFetch<PlaylistsResponse>("/api/admin/playlists"),
        adminFetch<UsersResponse>("/api/admin/users"),
        adminFetch<LinesResponse>("/api/admin/lines"),
      ]);
      setPlaylists(playlistResult.playlists);
      setUsers(userResult.users);
      setLines(lineResult.lines);
      setError("");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not load playlists",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      adminFetch<PlaylistsResponse>("/api/admin/playlists"),
      adminFetch<UsersResponse>("/api/admin/users"),
      adminFetch<LinesResponse>("/api/admin/lines"),
    ])
      .then(([playlistResult, userResult, lineResult]) => {
        if (!active) return;
        setPlaylists(playlistResult.playlists);
        setUsers(userResult.users);
        setLines(lineResult.lines);
      })
      .catch((caught) => {
        if (!active) return;
        setError(
          caught instanceof Error ? caught.message : "Could not load playlists",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return playlists;
    return playlists.filter((playlist) =>
      [
        playlist.name,
        playlist.userName,
        playlist.type,
        playlist.endpointHost,
        playlist.status,
        ...playlist.assignedLineNames,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [playlists, query]);

  async function togglePlaylist(playlist: PlaylistView) {
    setBusyId(playlist.id);
    setError("");
    try {
      const next: PlaylistStatus =
        playlist.status === "active" ? "disabled" : "active";
      await adminFetch(`/api/admin/playlists/${playlist.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      setNotice(
        next === "disabled"
          ? `"${playlist.name}" was disabled.`
          : `"${playlist.name}" was enabled.`,
      );
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not update playlist",
      );
    } finally {
      setBusyId("");
    }
  }

  async function removePlaylist(playlist: PlaylistView) {
    if (!window.confirm(`Delete playlist "${playlist.name}"?`)) return;
    setBusyId(playlist.id);
    setError("");
    try {
      await adminFetch(`/api/admin/playlists/${playlist.id}`, {
        method: "DELETE",
      });
      setNotice(`"${playlist.name}" was deleted.`);
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not delete playlist",
      );
    } finally {
      setBusyId("");
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">
            Sources
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Playlists
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Assign Xtream or M3U sources to user accounts.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setEditorOpen(true)}
          disabled={!users.length}
        >
          <span className="text-base leading-none">+</span>
          Add playlist
        </button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <SummaryCard label="All playlists" value={playlists.length} />
        <SummaryCard
          label="Xtream"
          value={playlists.filter((playlist) => playlist.type === "xtream").length}
          tone="cyan"
        />
        <SummaryCard
          label="M3U"
          value={playlists.filter((playlist) => playlist.type === "m3u").length}
          tone="violet"
        />
      </div>

      {notice ? (
        <div className="mt-5 flex items-center justify-between rounded-xl border border-emerald-300/20 bg-emerald-300/[0.07] px-4 py-3 text-sm text-emerald-200">
          <span>{notice}</span>
          <button
            type="button"
            className="text-xs font-semibold text-emerald-300"
            onClick={() => setNotice("")}
          >
            Dismiss
          </button>
        </div>
      ) : null}
      {error ? (
        <div className="mt-5 rounded-xl border border-rose-300/20 bg-rose-300/[0.07] px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <section className="admin-card mt-5 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-white/[0.07] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Assigned sources</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {filtered.length} of {playlists.length} playlists
            </p>
          </div>
          <input
            className="admin-input sm:max-w-xs"
            placeholder="Search name, user, host..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="admin-scrollbar overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-white/[0.06] text-[10px] uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Playlist</th>
                <th className="px-5 py-3 font-semibold">Assigned user</th>
                <th className="px-5 py-3 font-semibold">Endpoint</th>
                <th className="px-5 py-3 font-semibold">Guide</th>
                <th className="px-5 py-3 font-semibold">Created</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    Loading playlists...
                  </td>
                </tr>
              ) : filtered.length ? (
                filtered.map((playlist) => (
                  <tr
                    key={playlist.id}
                    className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.018]"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <TypeIcon type={playlist.type} />
                        <div>
                          <p className="font-semibold text-white">{playlist.name}</p>
                          <p className="mt-0.5 text-xs uppercase tracking-[0.12em] text-slate-500">
                            {playlist.type === "xtream" ? "Xtream codes" : "M3U URL"}
                            {playlist.ownerLineId ? " / user source" : " / provider source"}
                          </p>
                          <span
                            className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${
                              playlist.status === "active"
                                ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
                                : "border-amber-300/20 bg-amber-300/10 text-amber-200"
                            }`}
                          >
                            {playlist.status === "active" ? "Active" : "Disabled"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-slate-300">{playlist.userName}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {playlist.assignedLineNames.length
                          ? playlist.assignedLineNames.join(", ")
                          : "Not assigned to a device"}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-slate-300">
                        {playlist.endpointHost || "Configured"}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {playlist.type === "xtream"
                          ? playlist.username || "Encrypted credentials"
                          : "Encrypted playlist URL"}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${
                          playlist.hasEpg
                            ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
                            : "border-slate-300/10 bg-slate-300/[0.04] text-slate-500"
                        }`}
                      >
                        {playlist.hasEpg ? "Attached" : "None"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-400">
                      {formatDate(playlist.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.06] disabled:opacity-40"
                          onClick={() => setEditingPlaylist(playlist)}
                          disabled={busyId === playlist.id}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-cyan-300/15 bg-cyan-300/[0.05] px-2.5 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-300/10 disabled:opacity-40"
                          onClick={() => void togglePlaylist(playlist)}
                          disabled={busyId === playlist.id}
                        >
                          {playlist.status === "active" ? "Disable" : "Enable"}
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-rose-300/15 bg-rose-300/[0.05] px-2.5 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-300/10 disabled:opacity-40"
                          onClick={() => void removePlaylist(playlist)}
                          disabled={busyId === playlist.id}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center">
                    <p className="text-sm text-slate-400">
                      {playlists.length
                        ? "No playlists match your search."
                        : users.length
                          ? "No playlists assigned yet."
                          : "Create a user before adding a playlist."}
                    </p>
                    {!playlists.length ? (
                      users.length ? (
                        <button
                          type="button"
                          className="btn-primary mt-4"
                          onClick={() => setEditorOpen(true)}
                        >
                          Add first playlist
                        </button>
                      ) : (
                        <Link href="/admin/users" className="btn-primary mt-4">
                          Create a user
                        </Link>
                      )
                    ) : null}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {editorOpen ? (
        <PlaylistEditorDialog
          users={users}
          lines={lines}
          onClose={() => setEditorOpen(false)}
          onSaved={async (message) => {
            setEditorOpen(false);
            setNotice(message);
            await load();
          }}
        />
      ) : null}

      {editingPlaylist ? (
        <PlaylistEditDialog
          playlist={editingPlaylist}
          onClose={() => setEditingPlaylist(null)}
          onSaved={async (message) => {
            setEditingPlaylist(null);
            setNotice(message);
            await load();
          }}
        />
      ) : null}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: number;
  tone?: "slate" | "cyan" | "violet";
}) {
  const colors = {
    slate: "text-white",
    cyan: "text-cyan-200",
    violet: "text-fuchsia-200",
  };
  return (
    <div className="admin-card flex items-center justify-between px-5 py-4">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      <span className={`text-2xl font-black ${colors[tone]}`}>{value}</span>
    </div>
  );
}

function TypeIcon({ type }: { type: PlaylistType }) {
  return (
    <span
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border text-[10px] font-black ${
        type === "xtream"
          ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-200"
          : "border-fuchsia-300/20 bg-fuchsia-300/10 text-fuchsia-200"
      }`}
    >
      {type === "xtream" ? "XT" : "M3U"}
    </span>
  );
}

function PlaylistEditorDialog({
  users,
  lines,
  onClose,
  onSaved,
}: {
  users: AdminUser[];
  lines: LineView[];
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const [userId, setUserId] = useState(users[0]?.id ?? "");
  const [lineId, setLineId] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<PlaylistType>("xtream");
  const [serverUrl, setServerUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [m3uUrl, setM3uUrl] = useState("");
  const [epgUrl, setEpgUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const sortedLines = useMemo(
    () =>
      [...lines].sort(
        (a, b) =>
          (a.userName || "").localeCompare(b.userName || "") ||
          a.name.localeCompare(b.name),
      ),
    [lines],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await adminFetch("/api/admin/playlists", {
        method: "POST",
        body: JSON.stringify({
          userId,
          lineId,
          name,
          type,
          serverUrl,
          username,
          password,
          m3uUrl,
          epgUrl,
        }),
      });
      await onSaved(`"${name}" was added.`);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not add playlist",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="playlist-dialog-title"
        className="admin-scrollbar relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-white/10 bg-[#0a0f19] p-6 shadow-2xl sm:rounded-2xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
              New source
            </p>
            <h2 id="playlist-dialog-title" className="mt-2 text-2xl font-bold tracking-tight">
              Add playlist
            </h2>
          </div>
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-slate-400 hover:text-white"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form className="mt-6" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="admin-label">Assign to user</span>
              <select
                className="admin-input"
                value={userId}
                onChange={(event) => {
                  setUserId(event.target.value);
                  setLineId("");
                }}
                required
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} (@{user.username})
                  </option>
                ))}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="admin-label">Assign to device (optional)</span>
              <select
                className="admin-input"
                value={lineId}
                onChange={(event) => {
                  const nextLineId = event.target.value;
                  setLineId(nextLineId);
                  const selected = lines.find(
                    (line) => line.id === nextLineId,
                  );
                  if (selected) setUserId(selected.userId);
                }}
              >
                <option value="">Keep unassigned</option>
                {sortedLines.map((line) => (
                  <option key={line.id} value={line.id}>
                    {line.userName} — {line.name} ({line.mac})
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-slate-500">
                {lines.length
                  ? "Pick a device to attach this source straight to that TV. The assigned user switches to the device automatically."
                  : "No devices yet — open the player on the TV once, then pair it on the Lines page."}
              </span>
            </label>
            <label className="block sm:col-span-2">
              <span className="admin-label">Playlist name</span>
              <input
                className="admin-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Main subscription"
                required
                minLength={2}
              />
            </label>
          </div>

          <div className="mt-4">
            <span className="admin-label">Source type</span>
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-1">
              {(["xtream", "m3u"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setType(option)}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    type === option
                      ? "bg-cyan-300/15 text-cyan-200"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {option === "xtream" ? "Xtream Codes" : "M3U + EPG"}
                </button>
              ))}
            </div>
          </div>

          {type === "xtream" ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="admin-label">Server URL</span>
                <input
                  className="admin-input"
                  value={serverUrl}
                  onChange={(event) => setServerUrl(event.target.value)}
                  placeholder="http://server.example.com:8080"
                  required
                  autoCapitalize="none"
                />
              </label>
              <label className="block">
                <span className="admin-label">Xtream username</span>
                <input
                  className="admin-input"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                  autoCapitalize="none"
                />
              </label>
              <label className="block">
                <span className="admin-label">Xtream password</span>
                <input
                  className="admin-input"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="new-password"
                />
              </label>
            </div>
          ) : (
            <div className="mt-4">
              <label className="block">
                <span className="admin-label">M3U playlist URL</span>
                <input
                  className="admin-input"
                  value={m3uUrl}
                  onChange={(event) => setM3uUrl(event.target.value)}
                  placeholder="https://provider.example.com/playlist.m3u"
                  required
                  autoCapitalize="none"
                />
              </label>
            </div>
          )}

          <div className="mt-4">
            <label className="block">
              <span className="admin-label">EPG URL (optional)</span>
              <input
                className="admin-input"
                value={epgUrl}
                onChange={(event) => setEpgUrl(event.target.value)}
                placeholder="https://provider.example.com/epg.xml"
                autoCapitalize="none"
              />
            </label>
          </div>

          <div className="mt-4 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.05] px-3.5 py-3 text-xs leading-5 text-cyan-100/70">
            Passwords and M3U URLs are encrypted with AES-256-GCM before being
            stored in JSON. They are never returned to the browser after saving.
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-rose-300/20 bg-rose-300/[0.07] px-3.5 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          <div className="mt-6 flex flex-col-reverse gap-2 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? "Saving..." : "Add playlist"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PlaylistEditDialog({
  playlist,
  onClose,
  onSaved,
}: {
  playlist: PlaylistView;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const [name, setName] = useState(playlist.name);
  const [type, setType] = useState<PlaylistType>(playlist.type);
  const [status, setStatus] = useState<PlaylistStatus>(playlist.status);
  const [serverUrl, setServerUrl] = useState(playlist.serverUrl);
  const [username, setUsername] = useState(playlist.username);
  const [password, setPassword] = useState(playlist.password);
  const [m3uUrl, setM3uUrl] = useState(playlist.m3uUrl);
  const [epgUrl, setEpgUrl] = useState("");
  const [clearEpg, setClearEpg] = useState(false);
  const [revealSecret, setRevealSecret] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        name,
        type,
        status,
      };
      if (type === "xtream") {
        body.serverUrl = serverUrl;
        body.username = username;
        if (password) body.password = password;
      } else if (m3uUrl) {
        body.m3uUrl = m3uUrl;
      }
      if (clearEpg) body.epgUrl = "";
      else if (epgUrl) body.epgUrl = epgUrl;

      await adminFetch(`/api/admin/playlists/${playlist.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      await onSaved(`"${name}" was updated.`);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not update playlist",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="playlist-edit-dialog-title"
        className="admin-scrollbar relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-white/10 bg-[#0a0f19] p-6 shadow-2xl sm:rounded-2xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
              Edit source
            </p>
            <h2 id="playlist-edit-dialog-title" className="mt-2 text-2xl font-bold tracking-tight">
              {playlist.name}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {playlist.userName}
              {playlist.assignedLineNames.length
                ? ` · ${playlist.assignedLineNames.join(", ")}`
                : " · Not assigned"}
            </p>
          </div>
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-slate-400 hover:text-white"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form className="mt-6" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="admin-label">Playlist name</span>
              <input
                className="admin-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                minLength={2}
                maxLength={80}
              />
            </label>
            <label className="block">
              <span className="admin-label">Status</span>
              <select
                className="admin-input"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as PlaylistStatus)
                }
              >
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
            </label>
            <div>
              <span className="admin-label">Source type</span>
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-1">
                {(["xtream", "m3u"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setType(option)}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                      type === option
                        ? "bg-cyan-300/15 text-cyan-200"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {option === "xtream" ? "Xtream" : "M3U"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {type === "xtream" ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="admin-label">Server URL</span>
                <input
                  className="admin-input"
                  value={serverUrl}
                  onChange={(event) => setServerUrl(event.target.value)}
                  required
                  autoCapitalize="none"
                />
              </label>
              <label className="block">
                <span className="admin-label">Xtream username</span>
                <input
                  className="admin-input"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                  autoCapitalize="none"
                />
              </label>
              <label className="block">
                <span className="admin-label">Xtream password</span>
                <input
                  className="admin-input"
                  type={revealSecret ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                />
              </label>
            </div>
          ) : (
            <div className="mt-4">
              <label className="block">
                <span className="admin-label">M3U URL</span>
                <input
                  className="admin-input"
                  value={m3uUrl}
                  onChange={(event) => setM3uUrl(event.target.value)}
                  autoCapitalize="none"
                />
              </label>
            </div>
          )}

          <label className="mt-3 flex items-center gap-2 text-xs text-slate-400">
            <input
              type="checkbox"
              className="accent-cyan-300"
              checked={revealSecret}
              onChange={(event) => setRevealSecret(event.target.checked)}
            />
            Show saved credentials
          </label>

          <div className="mt-4">
            <label className="block">
              <span className="admin-label">New EPG URL (optional)</span>
              <input
                className="admin-input"
                value={epgUrl}
                onChange={(event) => setEpgUrl(event.target.value)}
                placeholder="Leave blank to keep"
                autoCapitalize="none"
                disabled={clearEpg}
              />
            </label>
            {playlist.hasEpg ? (
              <label className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                <input
                  type="checkbox"
                  className="accent-rose-300"
                  checked={clearEpg}
                  onChange={(event) => setClearEpg(event.target.checked)}
                />
                Remove the current EPG URL
              </label>
            ) : null}
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-rose-300/20 bg-rose-300/[0.07] px-3.5 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          <div className="mt-6 flex flex-col-reverse gap-2 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
