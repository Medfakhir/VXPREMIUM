"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  expiryLabel,
  formatDate,
  formatDateTime,
} from "@/lib/format";
import type {
  PlaylistType,
  PortalMeResponse,
  PortalPlaylistView,
} from "@/lib/types";

export default function PortalDashboard() {
  const router = useRouter();
  const [data, setData] = useState<PortalMeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<PortalPlaylistView | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/portal/me", { cache: "no-store" });
      if (response.status === 401) {
        router.replace("/portal/login");
        return;
      }
      const body = (await response.json()) as PortalMeResponse & {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(body.error ?? "Could not load your account");
      }
      setData(body);
      setError("");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not load your account",
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    let active = true;
    fetch("/api/portal/me", { cache: "no-store" })
      .then(async (response) => {
        if (!active) return;
        if (response.status === 401) {
          router.replace("/portal/login");
          return;
        }
        const body = (await response.json()) as PortalMeResponse & {
          error?: string;
        };
        if (!response.ok) {
          throw new Error(body.error ?? "Could not load your account");
        }
        if (active) {
          setData(body);
          setError("");
        }
      })
      .catch((caught) => {
        if (!active) return;
        setError(
          caught instanceof Error
            ? caught.message
            : "Could not load your account",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [router]);

  async function logout() {
    try {
      await fetch("/api/portal/logout", { method: "POST" });
    } catch {
    } finally {
      router.replace("/portal/login");
    }
  }

  async function removePlaylist(playlist: PortalPlaylistView) {
    if (
      !window.confirm(
        `Delete playlist "${playlist.name}"? The player will stop loading it after the next sync.`,
      )
    ) {
      return;
    }
    setBusyId(playlist.id);
    setError("");
    try {
      const response = await fetch(`/api/portal/playlists/${playlist.id}`, {
        method: "DELETE",
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Could not delete playlist");
      }
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

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#05070d] text-white">
        <div className="text-center">
          <span className="mx-auto grid h-12 w-12 animate-pulse place-items-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 text-sm font-black text-cyan-200">
            VX
          </span>
          <p className="mt-4 text-sm text-slate-400">Loading your account...</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#05070d] px-6 text-white">
        <div className="admin-card w-full max-w-md p-6 text-center">
          <h1 className="text-xl font-bold">Could not open the portal</h1>
          <p className="mt-2 text-sm text-rose-200">{error}</p>
          <div className="mt-5 flex justify-center gap-2">
            <button type="button" className="btn-secondary" onClick={() => void load()}>
              Try again
            </button>
            <Link href="/portal/login" className="btn-primary">
              Sign in
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { line, playlists } = data;
  const activeCount = playlists.filter(
    (playlist) => playlist.status === "active",
  ).length;
  const canManage = line.allowOwnPlaylists;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05070d] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(34,211,238,0.13),transparent_32%),radial-gradient(circle_at_88%_10%,rgba(217,70,239,0.1),transparent_28%)]" />
      <div className="relative mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
        <header className="flex flex-col gap-4 border-b border-white/[0.07] pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 text-sm font-black text-cyan-200">
              VX
            </span>
            <div>
              <p className="text-sm font-bold tracking-[0.18em] text-white">
                VX PREMIUM
              </p>
              <p className="text-xs text-slate-500">Device playlist portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/activate"
              className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-cyan-300/30 hover:text-white"
            >
              Activation help
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-rose-300/30 hover:text-rose-200"
            >
              Sign out
            </button>
          </div>
        </header>

        <section className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Device" value={line.name} />
          <Stat label="MAC address" value={line.mac} mono />
          <Stat
            label="Access expiry"
            value={`${formatDate(line.expiresAt)} · ${expiryLabel(line.expiresAt)}`}
          />
          <Stat
            label="Playlists"
            value={`${activeCount} active / ${playlists.length} total`}
          />
        </section>

        <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="admin-card overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-white/[0.07] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-lg font-bold text-white">Your playlists</h1>
                <p className="mt-0.5 text-xs text-slate-500">
                  The player loads every active source assigned to this device.
                </p>
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setEditing(null);
                  setEditorOpen(true);
                }}
                disabled={!canManage}
              >
                <span className="text-base leading-none">+</span>
                Add playlist
              </button>
            </div>

            {notice ? (
              <div className="mx-5 mt-4 flex items-center justify-between rounded-xl border border-emerald-300/20 bg-emerald-300/[0.07] px-4 py-3 text-sm text-emerald-200">
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
              <div className="mx-5 mt-4 rounded-xl border border-rose-300/20 bg-rose-300/[0.07] px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            {!canManage ? (
              <div className="mx-5 mt-4 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] px-4 py-3 text-xs leading-5 text-amber-100/80">
                Your provider manages playlists for this account. You can still
                use the playlists below on your player.
              </div>
            ) : null}

            {playlists.length ? (
              <div className="grid gap-3 p-5 sm:grid-cols-2">
                {playlists.map((playlist) => (
                  <PlaylistCard
                    key={playlist.id}
                    playlist={playlist}
                    busy={busyId === playlist.id}
                    canManage={canManage}
                    onEdit={() => {
                      setEditing(playlist);
                      setEditorOpen(true);
                    }}
                    onDelete={() => void removePlaylist(playlist)}
                  />
                ))}
              </div>
            ) : (
              <div className="px-5 py-14 text-center">
                <p className="text-sm text-slate-400">
                  No playlists are assigned to this device yet.
                </p>
                {canManage ? (
                  <button
                    type="button"
                    className="btn-primary mt-4"
                    onClick={() => {
                      setEditing(null);
                      setEditorOpen(true);
                    }}
                  >
                    Add your first playlist
                  </button>
                ) : null}
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <div className="admin-card p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">
                Player sync
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                After adding or editing a source, open the player, go to
                <strong className="text-slate-200"> Playlists &amp; accounts</strong>,
                and tap <strong className="text-slate-200">Sync now</strong>. The
                player reloads every active playlist for this device.
              </p>
            </div>

            <div className="admin-card p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">
                Device status
              </p>
              <dl className="mt-3 space-y-3 text-sm">
                <Detail label="Account" value={line.userName} />
                <Detail label="Status" value={line.status === "active" ? "Active" : "Disabled"} />
                <Detail
                  label="Last player sync"
                  value={
                    line.lastSeenAt
                      ? formatDateTime(line.lastSeenAt)
                      : "Not synced yet"
                  }
                />
                <Detail
                  label="Player"
                  value={line.lastDeviceName || "Unknown device"}
                />
              </dl>
            </div>

            <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.05] p-4 text-xs leading-5 text-amber-100/70">
              Keep your DEVICE KEY private. Anyone with the MAC address and key
              can open this portal and see your playlist settings.
            </div>
          </aside>
        </div>
      </div>

      {editorOpen ? (
        <PlaylistDialog
          playlist={editing}
          onClose={() => {
            setEditorOpen(false);
            setEditing(null);
          }}
          onSaved={async (message) => {
            setEditorOpen(false);
            setEditing(null);
            setNotice(message);
            await load();
          }}
        />
      ) : null}
    </main>
  );
}

function Stat({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="admin-card px-4 py-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p
        className={`mt-1 truncate text-sm font-semibold text-white ${
          mono ? "font-mono tracking-wider text-cyan-200" : ""
        }`}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-white/[0.05] pb-2 last:border-0 last:pb-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-200">{value}</dd>
    </div>
  );
}

function PlaylistCard({
  playlist,
  busy,
  canManage,
  onEdit,
  onDelete,
}: {
  playlist: PortalPlaylistView;
  busy: boolean;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border text-[10px] font-black ${
              playlist.type === "xtream"
                ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-200"
                : "border-fuchsia-300/20 bg-fuchsia-300/10 text-fuchsia-200"
            }`}
          >
            {playlist.type === "xtream" ? "XT" : "M3U"}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h2 className="truncate font-semibold text-white">
                {playlist.name}
              </h2>
              {playlist.primary ? (
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-cyan-200">
                  Primary
                </span>
              ) : null}
              <span
                className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] ${
                  playlist.status === "active"
                    ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
                    : "border-amber-300/20 bg-amber-300/10 text-amber-200"
                }`}
              >
                {playlist.status === "active" ? "Active" : "Disabled"}
              </span>
            </div>
            <p className="mt-1 truncate text-xs text-slate-500">
              {playlist.endpointHost || "Configured source"}
              {playlist.username ? ` · ${playlist.username}` : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.1em] text-slate-500">
        <span>{playlist.owner ? "Your source" : "Provider source"}</span>
        <span>·</span>
        <span>{playlist.hasEpg ? "EPG attached" : "No EPG"}</span>
        <span>·</span>
        <span>Added {formatDate(playlist.createdAt)}</span>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        {canManage ? (
          <>
            <button
              type="button"
              className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.06] disabled:opacity-40"
              onClick={onEdit}
              disabled={busy}
            >
              Edit
            </button>
            {playlist.owner ? (
              <button
                type="button"
                className="rounded-lg border border-rose-300/15 bg-rose-300/[0.05] px-2.5 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-300/10 disabled:opacity-40"
                onClick={onDelete}
                disabled={busy}
              >
                Delete
              </button>
            ) : null}
          </>
        ) : (
          <span className="text-[10px] uppercase tracking-[0.1em] text-slate-600">
            {playlist.owner ? "Locked by provider" : "Managed by provider"}
          </span>
        )}
      </div>
    </article>
  );
}

function PlaylistDialog({
  playlist,
  onClose,
  onSaved,
}: {
  playlist: PortalPlaylistView | null;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const [name, setName] = useState(playlist?.name ?? "");
  const [type, setType] = useState<PlaylistType>(playlist?.type ?? "xtream");
  const [serverUrl, setServerUrl] = useState(playlist?.serverUrl ?? "");
  const [username, setUsername] = useState(playlist?.username ?? "");
  const [password, setPassword] = useState(playlist?.password ?? "");
  const [m3uUrl, setM3uUrl] = useState(playlist?.m3uUrl ?? "");
  const [epgUrl, setEpgUrl] = useState("");
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
        serverUrl,
        username,
        password,
        m3uUrl,
        epgUrl,
      };
      const response = await fetch(
        playlist
          ? `/api/portal/playlists/${playlist.id}`
          : "/api/portal/playlists",
        {
          method: playlist ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Could not save playlist");
      }
      await onSaved(
        playlist ? `"${name}" was updated.` : `"${name}" was added.`,
      );
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not save playlist",
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
        aria-labelledby="portal-playlist-dialog-title"
        className="admin-scrollbar relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-white/10 bg-[#0a0f19] p-6 shadow-2xl sm:rounded-2xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
              {playlist ? "Edit source" : "New source"}
            </p>
            <h2 id="portal-playlist-dialog-title" className="mt-2 text-2xl font-bold tracking-tight">
              {playlist ? playlist.name : "Add playlist"}
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
              <span className="admin-label">Playlist name</span>
              <input
                className="admin-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="My provider"
                required
                minLength={2}
                maxLength={80}
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
                  type={revealSecret ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required={!playlist}
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
                  required={!playlist}
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
              <span className="admin-label">EPG URL (optional)</span>
              <input
                className="admin-input"
                value={epgUrl}
                onChange={(event) => setEpgUrl(event.target.value)}
                placeholder={
                  playlist?.hasEpg
                    ? "Leave blank to keep the current guide"
                    : "https://provider.example.com/epg.xml"
                }
                autoCapitalize="none"
              />
            </label>
          </div>

          <div className="mt-4 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.05] px-3.5 py-3 text-xs leading-5 text-cyan-100/70">
            Credentials and M3U URLs are encrypted before storage and only shown
            back to you here so you can check or update them.
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
              {busy ? "Saving..." : playlist ? "Save changes" : "Add playlist"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
