"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";
import { expiryLabel, formatDate, formatDateTime } from "@/lib/format";
import type { OverviewResponse } from "@/lib/types";

const activityLabels: Record<string, string> = {
  "admin.login": "Admin signed in",
  "admin.setup": "Owner account created",
  "user.create": "User created",
  "user.update": "User updated",
  "user.delete": "User deleted",
  "user.reset_devices": "Devices reset",
  "playlist.create": "Playlist added",
  "playlist.delete": "Playlist removed",
};

export default function AdminOverviewPage() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [now, setNow] = useState(0);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const result = await adminFetch<OverviewResponse>("/api/admin/overview");
      setData(result);
      setNow(Date.now());
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load overview");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    adminFetch<OverviewResponse>("/api/admin/overview")
      .then((result) => {
        if (!active) return;
        setData(result);
        setNow(Date.now());
      })
      .catch((caught) => {
        if (!active) return;
        setError(
          caught instanceof Error ? caught.message : "Could not load overview",
        );
      });
    return () => {
      active = false;
    };
  }, []);

  const stats = data?.stats;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">
            Control center
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Overview
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Live account, subscription, and playlist status.
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => void load()}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error ? (
        <div className="mt-6 rounded-xl border border-rose-300/20 bg-rose-300/[0.07] p-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active users"
          value={stats?.activeUsers}
          note={`${stats?.totalUsers ?? 0} total accounts`}
          tone="cyan"
        />
        <StatCard
          label="Expiring soon"
          value={stats?.expiringSoon}
          note="Within the next 7 days"
          tone="amber"
        />
        <StatCard
          label="Playlists"
          value={stats?.playlists}
          note="Xtream and M3U sources"
          tone="violet"
        />
        <StatCard
          label="Devices online"
          value={stats?.onlineDevices}
          note={`${stats?.devices ?? 0} registered devices`}
          tone="emerald"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <section className="admin-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-white">Recent users</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Latest accounts created
              </p>
            </div>
            <Link
              href="/admin/users"
              className="text-xs font-semibold text-cyan-300 hover:text-cyan-200"
            >
              View all
            </Link>
          </div>

          <div className="admin-scrollbar overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-white/[0.06] text-[10px] uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">User</th>
                  <th className="px-5 py-3 font-semibold">Plan</th>
                  <th className="px-5 py-3 font-semibold">Expiry</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentUsers.length ? (
                  data.recentUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-white/[0.05] last:border-0"
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-white">{user.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          @{user.username}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-300">{user.plan}</td>
                      <td className="px-5 py-3.5">
                        <p className="text-slate-300">{formatDate(user.expiresAt)}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {expiryLabel(user.expiresAt, now)}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge
                          status={user.status}
                          expired={new Date(user.expiresAt).getTime() <= now}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-sm text-slate-500">
                      No users yet.{" "}
                      <Link
                        href="/admin/users"
                        className="font-semibold text-cyan-300"
                      >
                        Create the first account
                      </Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="space-y-6">
          <section className="admin-card p-5">
            <h2 className="text-sm font-bold text-white">Recent activity</h2>
            <p className="mt-0.5 text-xs text-slate-500">Admin audit trail</p>
            <div className="mt-4 space-y-3">
              {data?.recentAudit.length ? (
                data.recentAudit.map((entry) => (
                  <div key={entry.id} className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
                    <div className="min-w-0">
                      <p className="text-sm text-slate-200">
                        {activityLabels[entry.action] ?? entry.action}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {entry.targetType} · {formatDateTime(entry.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-5 text-sm text-slate-500">No activity recorded yet.</p>
              )}
            </div>
          </section>

          <section className="admin-card p-5">
            <h2 className="text-sm font-bold text-white">Storage</h2>
            <div className="mt-3 flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-200">
                  {data?.storage === "netlify-blobs"
                    ? "Netlify Blobs"
                    : "Local JSON"}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {data?.storage === "netlify-blobs"
                    ? "Strong consistency in production"
                    : "Development file fallback"}
                </p>
              </div>
              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-200">
                Connected
              </span>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Playlist passwords and M3U URLs are encrypted before being written
              to JSON storage.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value?: number;
  note: string;
  tone: "cyan" | "amber" | "violet" | "emerald";
}) {
  const tones = {
    cyan: "from-cyan-300/20 to-cyan-300/[0.02] text-cyan-200",
    amber: "from-amber-300/20 to-amber-300/[0.02] text-amber-200",
    violet: "from-fuchsia-300/20 to-fuchsia-300/[0.02] text-fuchsia-200",
    emerald: "from-emerald-300/20 to-emerald-300/[0.02] text-emerald-200",
  };

  return (
    <div className="admin-card relative overflow-hidden p-5">
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${tones[tone]} blur-2xl`}
      />
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black tracking-tight text-white">
        {value ?? "—"}
      </p>
      <p className="mt-1 text-xs text-slate-500">{note}</p>
    </div>
  );
}

function StatusBadge({
  status,
  expired,
}: {
  status: "active" | "disabled";
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
