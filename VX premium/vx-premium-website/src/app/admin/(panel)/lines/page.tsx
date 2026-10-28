"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/lib/admin-client";
import { expiryLabel, formatDate, formatDateTime } from "@/lib/format";
import type {
  AdminUser,
  LineStatus,
  LineView,
  PlaylistView,
} from "@/lib/types";

type LinesResponse = { lines: LineView[] };
type UsersResponse = { users: AdminUser[] };
type PlaylistsResponse = { playlists: PlaylistView[] };

export default function LinesPage() {
  const [lines, setLines] = useState<LineView[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistView[]>([]);
  const [query, setQuery] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [now, setNow] = useState(0);

  const load = useCallback(async () => {
    try {
      const [lineResult, userResult, playlistResult] = await Promise.all([
        adminFetch<LinesResponse>("/api/admin/lines"),
        adminFetch<UsersResponse>("/api/admin/users"),
        adminFetch<PlaylistsResponse>("/api/admin/playlists"),
      ]);
      setLines(lineResult.lines);
      setUsers(userResult.users);
      setPlaylists(playlistResult.playlists);
      setNow(Date.now());
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load lines");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      adminFetch<LinesResponse>("/api/admin/lines"),
      adminFetch<UsersResponse>("/api/admin/users"),
      adminFetch<PlaylistsResponse>("/api/admin/playlists"),
    ])
      .then(([lineResult, userResult, playlistResult]) => {
        if (!active) return;
        setLines(lineResult.lines);
        setUsers(userResult.users);
        setPlaylists(playlistResult.playlists);
        setNow(Date.now());
      })
      .catch((caught) => {
        if (!active) return;
        setError(caught instanceof Error ? caught.message : "Could not load lines");
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
    if (!term) return lines;
    return lines.filter((line) =>
      [line.name, line.mac, line.userName, line.playlistName, line.lastDeviceName]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [lines, query]);

  const activeLines = lines.filter(
    (line) => line.status === "active" && new Date(line.expiresAt).getTime() > now,
  );
  const onlineLines = lines.filter(
    (line) =>
      line.lastSeenAt &&
      now - new Date(line.lastSeenAt).getTime() <= 15 * 60 * 1000,
  );
  const xtreamPlaylists = playlists.filter(
    (playlist) => playlist.type === "xtream",
  );

  async function toggleLine(line: LineView) {
    setBusyId(line.id);
    setError("");
    try {
      await adminFetch(`/api/admin/lines/${line.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: line.status === "active" ? "disabled" : "active",
        }),
      });
      setNotice(
        line.status === "active"
          ? `"${line.name}" was disabled.`
          : `"${line.name}" was enabled.`,
      );
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not update line",
      );
    } finally {
      setBusyId("");
    }
  }

  async function removeLine(line: LineView) {
    if (!window.confirm(`Delete line "${line.name}" for ${line.mac}?`)) return;
    setBusyId(line.id);
    setError("");
    try {
      await adminFetch(`/api/admin/lines/${line.id}`, { method: "DELETE" });
      setNotice(`"${line.name}" was deleted.`);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete line");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">
            Device access
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Lines
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Pair the MAC address and DEVICE KEY shown on the player with an
            Xtream playlist.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setEditorOpen(true)}
          disabled={!users.length || !xtreamPlaylists.length}
        >
          <span className="text-base leading-none">+</span>
          Add line
        </button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="All lines" value={lines.length} />
        <SummaryCard label="Active" value={activeLines.length} tone="emerald" />
        <SummaryCard label="Seen 15m" value={onlineLines.length} tone="cyan" />
        <SummaryCard
          label="Disabled"
          value={lines.filter((line) => line.status === "disabled").length}
          tone="amber"
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

      {!users.length || !xtreamPlaylists.length ? (
        <div className="mt-5 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.05] px-4 py-3 text-sm text-cyan-100/80">
          {!users.length ? (
            <>
              Create a user first in{" "}
              <Link href="/admin/users" className="font-semibold text-cyan-200">
                Users
              </Link>
              .
            </>
          ) : (
            <>
              Add an Xtream playlist in{" "}
              <Link href="/admin/playlists" className="font-semibold text-cyan-200">
                Playlists
              </Link>{" "}
              before pairing a line.
            </>
          )}
        </div>
      ) : null}

      <section className="admin-card mt-5 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-white/[0.07] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Activated devices</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {filtered.length} of {lines.length} lines
            </p>
          </div>
          <input
            className="admin-input sm:max-w-xs"
            placeholder="Search name, MAC, user, playlist..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="admin-scrollbar overflow-x-auto">
          <table className="w-full min-w-[1060px] text-left text-sm">
            <thead className="border-b border-white/[0.06] text-[10px] uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Line</th>
                <th className="px-5 py-3 font-semibold">Device</th>
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-5 py-3 font-semibold">Playlist</th>
                <th className="px-5 py-3 font-semibold">Expiry</th>
                <th className="px-5 py-3 font-semibold">Last seen</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    Loading lines...
                  </td>
                </tr>
              ) : filtered.length ? (
                filtered.map((line) => {
                  const expired = new Date(line.expiresAt).getTime() <= now;
                  const online =
                    line.lastSeenAt &&
                    now - new Date(line.lastSeenAt).getTime() <= 15 * 60 * 1000;
                  return (
                    <tr
                      key={line.id}
                      className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.018]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border text-[10px] font-black ${
                              line.status === "active" && !expired
                                ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
                                : "border-amber-300/20 bg-amber-300/10 text-amber-200"
                            }`}
                          >
                            VX
                          </span>
                          <div>
                            <p className="font-semibold text-white">{line.name}</p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {line.lastDeviceName || "Waiting for player"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-mono text-xs font-semibold tracking-wider text-cyan-200">
                          {line.mac}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Key verification enabled
                        </p>
                      </td>
                      <td className="px-5 py-4 text-slate-300">{line.userName}</td>
                      <td className="px-5 py-4 text-slate-300">
                        {line.playlistName}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-slate-300">{formatDate(line.expiresAt)}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {expiryLabel(line.expiresAt, now)}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <StatusBadge
                            status={line.status}
                            expired={expired}
                          />
                          <span className="text-xs text-slate-500">
                            {online ? "Online" : line.lastSeenAt ? formatDateTime(line.lastSeenAt) : "Never"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            className="rounded-lg border border-cyan-300/15 bg-cyan-300/[0.05] px-2.5 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-300/10 disabled:opacity-40"
                            onClick={() => void toggleLine(line)}
                            disabled={busyId === line.id}
                          >
                            {line.status === "active" ? "Disable" : "Enable"}
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-rose-300/15 bg-rose-300/[0.05] px-2.5 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-300/10 disabled:opacity-40"
                            onClick={() => void removeLine(line)}
                            disabled={busyId === line.id}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <p className="text-sm text-slate-400">
                      {lines.length
                        ? "No lines match your search."
                        : "No device lines yet. Pair the first player using its MAC and DEVICE KEY."}
                    </p>
                    {!lines.length && users.length && xtreamPlaylists.length ? (
                      <button
                        type="button"
                        className="btn-primary mt-4"
                        onClick={() => setEditorOpen(true)}
                      >
                        Add first line
                      </button>
                    ) : null}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {editorOpen ? (
        <LineEditorDialog
          users={users}
          playlists={xtreamPlaylists}
          onClose={() => setEditorOpen(false)}
          onSaved={async (message) => {
            setEditorOpen(false);
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
  tone?: "slate" | "cyan" | "emerald" | "amber";
}) {
  const colors = {
    slate: "text-white",
    cyan: "text-cyan-200",
    emerald: "text-emerald-200",
    amber: "text-amber-200",
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

function StatusBadge({
  status,
  expired,
}: {
  status: LineStatus;
  expired: boolean;
}) {
  if (expired) {
    return (
      <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-amber-200">
        Expired
      </span>
    );
  }
  if (status === "active") {
    return (
      <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-200">
        Active
      </span>
    );
  }
  return (
    <span className="rounded-full border border-slate-300/15 bg-slate-300/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
      Disabled
    </span>
  );
}

function LineEditorDialog({
  users,
  playlists,
  onClose,
  onSaved,
}: {
  users: AdminUser[];
  playlists: PlaylistView[];
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const [userId, setUserId] = useState(users[0]?.id ?? "");
  const [playlistId, setPlaylistId] = useState(
    playlists.find((playlist) => playlist.userId === users[0]?.id)?.id ?? "",
  );
  const [name, setName] = useState("");
  const [mac, setMac] = useState("");
  const [deviceKey, setDeviceKey] = useState("");
  const [expiresAt, setExpiresAt] = useState(
    users[0]?.expiresAt.slice(0, 10) ?? "",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const userPlaylists = playlists.filter(
    (playlist) => playlist.userId === userId,
  );
  const selectedUser = users.find((user) => user.id === userId);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function changeUser(nextId: string) {
    setUserId(nextId);
    const first = playlists.find((playlist) => playlist.userId === nextId);
    setPlaylistId(first?.id ?? "");
    const user = users.find((item) => item.id === nextId);
    if (user) setExpiresAt(user.expiresAt.slice(0, 10));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await adminFetch("/api/admin/lines", {
        method: "POST",
        body: JSON.stringify({
          name,
          mac,
          deviceKey,
          userId,
          playlistId,
          status: "active",
          expiresAt,
        }),
      });
      await onSaved(`${mac.toUpperCase()} was paired.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not add line");
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
        aria-labelledby="line-dialog-title"
        className="admin-scrollbar relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-white/10 bg-[#0a0f19] p-6 shadow-2xl sm:rounded-2xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
              New activation
            </p>
            <h2 id="line-dialog-title" className="mt-2 text-2xl font-bold tracking-tight">
              Pair a device
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

        <div className="mt-5 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.05] px-3.5 py-3 text-xs leading-5 text-cyan-100/75">
          On the player, open <strong>Playlists &amp; accounts</strong> and copy
          the MAC ADDRESS and DEVICE KEY from the right panel.
        </div>

        <form className="mt-5" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="admin-label">Assign to user</span>
              <select
                className="admin-input"
                value={userId}
                onChange={(event) => changeUser(event.target.value)}
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
              <span className="admin-label">Xtream playlist</span>
              <select
                className="admin-input"
                value={playlistId}
                onChange={(event) => setPlaylistId(event.target.value)}
                required
              >
                {userPlaylists.length ? (
                  userPlaylists.map((playlist) => (
                    <option key={playlist.id} value={playlist.id}>
                      {playlist.name}
                    </option>
                  ))
                ) : (
                  <option value="">No Xtream playlist for this user</option>
                )}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="admin-label">Line name (optional)</span>
              <input
                className="admin-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={
                  selectedUser ? `${selectedUser.name} - Living room` : "Living room"
                }
                maxLength={80}
              />
            </label>
            <label className="block">
              <span className="admin-label">MAC address</span>
              <input
                className="admin-input font-mono uppercase"
                value={mac}
                onChange={(event) => setMac(event.target.value)}
                placeholder="AA:BB:CC:DD:EE:FF"
                required
                autoCapitalize="characters"
                spellCheck={false}
              />
            </label>
            <label className="block">
              <span className="admin-label">Device key</span>
              <input
                className="admin-input font-mono"
                value={deviceKey}
                onChange={(event) =>
                  setDeviceKey(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="123456"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="admin-label">Line expiry</span>
              <input
                className="admin-input"
                type="date"
                value={expiresAt}
                onChange={(event) => setExpiresAt(event.target.value)}
                required
              />
            </label>
          </div>

          <div className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-3 text-xs leading-5 text-slate-400">
            The device key is stored as a one-way HMAC fingerprint. It is never
            returned by the API or shown in the dashboard.
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
            <button
              type="submit"
              className="btn-primary"
              disabled={busy || !playlistId}
            >
              {busy ? "Pairing..." : "Pair device"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
