"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  adminFetch,
  clearAdminToken,
} from "@/lib/admin-client";
import { initials } from "@/lib/format";
import type { AdminSessionView } from "@/lib/types";

const navigation = [
  {
    href: "/admin",
    label: "Overview",
    icon: (
      <path d="M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z" />
    ),
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: (
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    ),
  },
  {
    href: "/admin/playlists",
    label: "Playlists",
    icon: (
      <path d="M4 6h16M4 12h10M4 18h7m6-4 5 3-5 3v-6Z" />
    ),
  },
  {
    href: "/admin/lines",
    label: "Devices",
    icon: (
      <path d="M5 12h4l2-5 3 10 2-5h3M4 4h16v16H4z" />
    ),
  },
];

function NavIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[18px] w-[18px]"
    >
      {children}
    </svg>
  );
}

export default function AdminShell({
  admin,
  storage,
  children,
}: {
  admin: AdminSessionView;
  storage: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try {
      await adminFetch("/api/admin/logout", { method: "POST" });
    } catch {
    } finally {
      clearAdminToken();
      router.replace("/admin/login");
    }
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link
        href="/admin"
        className="flex items-center gap-3 px-5 py-6"
        onClick={() => setOpen(false)}
      >
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 text-sm font-black text-cyan-200">
          VX
        </span>
        <span>
          <span className="block text-sm font-bold tracking-[0.18em]">
            VX PREMIUM
          </span>
          <span className="block text-[11px] text-slate-500">Control center</span>
        </span>
      </Link>

      <nav className="mt-2 flex-1 space-y-1 px-3">
        {navigation.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-cyan-300/10 text-cyan-200"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <NavIcon>{item.icon}</NavIcon>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="m-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-cyan-300 to-sky-500 text-xs font-black text-[#061018]">
            {initials(admin.name)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-white">
              {admin.name}
            </span>
            <span className="block truncate text-[11px] text-slate-500">
              {admin.email}
            </span>
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            {storage === "netlify-blobs" ? "Netlify Blobs" : "Local JSON"}
          </span>
          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            className="text-xs font-semibold text-slate-400 transition hover:text-rose-300 disabled:opacity-50"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#05070d]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_75%_-10%,rgba(34,211,238,0.1),transparent_35%),radial-gradient(circle_at_20%_100%,rgba(217,70,239,0.07),transparent_35%)]" />

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] border-r border-white/[0.07] bg-[#070b13]/95 backdrop-blur lg:block">
        {sidebar}
      </aside>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-[280px] border-r border-white/10 bg-[#070b13]">
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="relative lg:pl-[260px]">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/[0.07] bg-[#05070d]/85 px-5 backdrop-blur-xl lg:hidden">
          <button
            type="button"
            aria-label="Open menu"
            className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300"
            onClick={() => setOpen(true)}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="h-5 w-5"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <span className="text-xs font-bold tracking-[0.18em] text-slate-300">
            VX ADMIN
          </span>
          <Link
            href="/"
            target="_blank"
            className="text-xs font-semibold text-slate-400"
          >
            Site
          </Link>
        </header>

        <main className="mx-auto w-full max-w-[1240px] px-5 py-7 sm:px-7 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
