"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/lib/admin-client";
import { expiryLabel, formatDate } from "@/lib/format";
import type { AdminUser, UserStatus } from "@/lib/types";

type UsersResponse = {
  users: AdminUser[];
};

type EditorState = {
  user?: AdminUser;
};

function defaultExpiry() {
  return new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [now, setNow] = useState(0);
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    try {
      const result = await adminFetch<UsersResponse>("/api/admin/users");
      setUsers(result.users);
      setNow(Date.now());
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    adminFetch<UsersResponse>("/api/admin/users")
      .then((result) => {
        if (!active) return;
        setUsers(result.users);
        setNow(Date.now());
      })
      .catch((caught) => {
        if (!active) return;
        setError(caught instanceof Error ? caught.message : "Could not load users");
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
    if (!term) return users;
    return users.filter((user) =>
      [user.name, user.username, user.email, user.plan]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [query, users]);

  const activeCount = users.filter(
    (user) =>
      user.status === "active" &&
      new Date(user.expiresAt).getTime() > now,
  ).length;
  const expiredCount = users.filter(
    (user) => new Date(user.expiresAt).getTime() <= now,
  ).length;

  async function removeUser(user: AdminUser) {
    if (
      !window.confirm(
        `Delete ${user.name}? Their playlists and devices will also be removed.`,
      )
    ) {
      return;
    }
    setBusyId(user.id);
    setError("");
    try {
      await adminFetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      setNotice(`${user.name} was deleted.`);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete user");
    } finally {
      setBusyId("");
    }
  }

  async function resetDevices(user: AdminUser) {
    if (!window.confirm(`Reset all registered devices for ${user.name}?`)) {
      return;
    }
    setBusyId(user.id);
    setError("");
    try {
      const result = await adminFetch<{ resetCount: number }>(
        `/api/admin/users/${user.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ resetDevices: true }),
        },
      );
      setNotice(
        result.resetCount
          ? `${result.resetCount} device${result.resetCount === 1 ? "" : "s"} reset.`
          : "No registered devices to reset.",
      );
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not reset devices");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">
            Accounts
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Users</h1>
          <p className="mt-2 text-sm text-slate-400">
            Subscriptions, connection limits, and playlist permissions.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setEditor({})}
        >
          <span className="text-base leading-none">+</span>
          Add user
        </button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <SummaryCard label="All accounts" value={users.length} />
        <SummaryCard label="Active" value={activeCount} tone="emerald" />
        <SummaryCard label="Expired" value={expiredCount} tone="amber" />
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
            <h2 className="text-sm font-bold text-white">User directory</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {filtered.length} of {users.length} accounts
            </p>
          </div>
          <input
            className="admin-input sm:max-w-xs"
            placeholder="Search name, username, plan..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="admin-scrollbar overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-white/[0.06] text-[10px] uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-5 py-3 font-semibold">Plan</th>
                <th className="px-5 py-3 font-semibold">Subscription</th>
                <th className="px-5 py-3 font-semibold">Connections</th>
                <th className="px-5 py-3 font-semibold">Playlists</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    Loading users...
                  </td>
                </tr>
              ) : filtered.length ? (
                filtered.map((user) => {
                  const expired = new Date(user.expiresAt).getTime() <= now;
                  const busy = busyId === user.id;
                  return (
                    <tr
                      key={user.id}
                      className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.018]"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-white">{user.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          @{user.username}
                          {user.email ? ` · ${user.email}` : ""}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full border border-cyan-300/15 bg-cyan-300/[0.07] px-2.5 py-1 text-xs font-semibold text-cyan-200">
                          {user.plan}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-slate-300">{formatDate(user.expiresAt)}</p>
                        <p
                          className={`mt-0.5 text-xs ${
                            expired ? "text-amber-300" : "text-slate-500"
                          }`}
                        >
                          {expiryLabel(user.expiresAt, now)}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        {user.maxConnections}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`text-xs font-semibold ${
                            user.allowOwnPlaylists ? "text-slate-300" : "text-slate-500"
                          }`}
                        >
                          {user.allowOwnPlaylists ? "Self-service" : "Admin only"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <UserStatusBadge status={user.status} expired={expired} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:text-white disabled:opacity-40"
                            onClick={() => setEditor({ user })}
                            disabled={busy}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:text-white disabled:opacity-40"
                            onClick={() => void resetDevices(user)}
                            disabled={busy}
                          >
                            Reset
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-rose-300/15 bg-rose-300/[0.05] px-2.5 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-300/10 disabled:opacity-40"
                            onClick={() => void removeUser(user)}
                            disabled={busy}
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
                      {users.length ? "No users match your search." : "No users yet."}
                    </p>
                    {!users.length ? (
                      <button
                        type="button"
                        className="btn-primary mt-4"
                        onClick={() => setEditor({})}
                      >
                        Create first user
                      </button>
                    ) : null}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {editor ? (
        <UserEditorDialog
          key={editor.user?.id ?? "new"}
          user={editor.user}
          onClose={() => setEditor(null)}
          onSaved={async (message) => {
            setEditor(null);
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
  tone = "cyan",
}: {
  label: string;
  value: number;
  tone?: "cyan" | "emerald" | "amber";
}) {
  const colors = {
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

function UserStatusBadge({
  status,
  expired,
}: {
  status: UserStatus;
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

function UserEditorDialog({
  user,
  onClose,
  onSaved,
}: {
  user?: AdminUser;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const [name, setName] = useState(user?.name ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [plan, setPlan] = useState(user?.plan ?? "Premium");
  const [status, setStatus] = useState<UserStatus>(user?.status ?? "active");
  const [expiresAt, setExpiresAt] = useState(
    user?.expiresAt.slice(0, 10) ?? defaultExpiry(),
  );
  const [maxConnections, setMaxConnections] = useState(
    String(user?.maxConnections ?? 1),
  );
  const [allowOwnPlaylists, setAllowOwnPlaylists] = useState(
    user?.allowOwnPlaylists ?? true,
  );
  const [notes, setNotes] = useState(user?.notes ?? "");
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
    const body = {
      name,
      username,
      email,
      plan,
      status,
      expiresAt,
      maxConnections: Number(maxConnections),
      allowOwnPlaylists,
      notes,
    };
    try {
      if (user) {
        await adminFetch(`/api/admin/users/${user.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        await onSaved(`${name} was updated.`);
      } else {
        await adminFetch("/api/admin/users", {
          method: "POST",
          body: JSON.stringify(body),
        });
        await onSaved(`${name} was created.`);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save user");
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
        aria-labelledby="user-dialog-title"
        className="admin-scrollbar relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-white/10 bg-[#0a0f19] p-6 shadow-2xl sm:rounded-2xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
              {user ? "Edit account" : "New account"}
            </p>
            <h2 id="user-dialog-title" className="mt-2 text-2xl font-bold tracking-tight">
              {user ? user.name : "Create user"}
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
            <Field label="Full name">
              <input
                className="admin-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                minLength={2}
              />
            </Field>
            <Field label="Username">
              <input
                className="admin-input"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
                minLength={2}
                autoCapitalize="none"
              />
            </Field>
            <Field label="Email">
              <input
                className="admin-input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Optional"
              />
            </Field>
            <Field label="Plan">
              <input
                className="admin-input"
                value={plan}
                onChange={(event) => setPlan(event.target.value)}
                required
              />
            </Field>
            <Field label="Status">
              <select
                className="admin-input"
                value={status}
                onChange={(event) => setStatus(event.target.value as UserStatus)}
              >
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
            </Field>
            <Field label="Expires on">
              <input
                className="admin-input"
                type="date"
                value={expiresAt}
                onChange={(event) => setExpiresAt(event.target.value)}
                required
              />
            </Field>
            <Field label="Max connections">
              <select
                className="admin-input"
                value={maxConnections}
                onChange={(event) => setMaxConnections(event.target.value)}
              >
                {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </Field>
            <div className="block">
              <span className="admin-label">Playlist access</span>
              <label className="flex h-[42px] cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-sm text-slate-300">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-cyan-400"
                  checked={allowOwnPlaylists}
                  onChange={(event) => setAllowOwnPlaylists(event.target.checked)}
                />
                Allow self-service playlists
              </label>
            </div>
          </div>

          <div className="mt-4">
            <Field label="Internal notes">
              <textarea
                className="admin-input"
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional notes for this account"
              />
            </Field>
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
              {busy ? "Saving..." : user ? "Save changes" : "Create user"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="admin-label">{label}</span>
      {children}
    </label>
  );
}
