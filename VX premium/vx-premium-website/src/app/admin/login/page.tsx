"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AdminRequestError, setAdminToken } from "@/lib/admin-client";

type SetupStatus = {
  needsSetup: boolean;
  configuredKey: boolean;
};

type AuthResponse = {
  token: string;
  admin: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [setupKey, setSetupKey] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/admin/setup", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load setup status");
        return (await response.json()) as SetupStatus;
      })
      .then((data) => {
        if (active) setStatus(data);
      })
      .catch(() => {
        if (active) {
          setStatus({ needsSetup: false, configuredKey: false });
          setError("Could not reach the admin service.");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const needsSetup = status?.needsSetup ?? false;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!status) return;
    setBusy(true);
    setError("");

    try {
      const path = needsSetup ? "/api/admin/setup" : "/api/admin/login";
      const body = needsSetup
        ? { setupKey, name, email, password }
        : { email, password };
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as AuthResponse & { error?: string };
      if (!response.ok) {
        throw new AdminRequestError(data.error ?? "Authentication failed", response.status);
      }
      setAdminToken(data.token);
      router.replace("/admin");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Authentication failed",
      );
      if (caught instanceof AdminRequestError && caught.status === 409) {
        setStatus({ needsSetup: false, configuredKey: status.configuredKey });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05070d]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(34,211,238,0.18),transparent_34%),radial-gradient(circle_at_88%_18%,rgba(217,70,239,0.13),transparent_30%),linear-gradient(to_bottom,transparent,#05070d_88%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:64px_64px]" />

      <div className="relative mx-auto grid min-h-screen w-full max-w-6xl items-center gap-14 px-6 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
        <section className="max-w-xl">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 text-sm font-black text-cyan-200">
              VX
            </span>
            <span>
              <span className="block text-sm font-bold tracking-[0.22em]">
                VX PREMIUM
              </span>
              <span className="block text-xs text-slate-400">Admin control center</span>
            </span>
          </Link>

          <p className="mt-14 text-xs font-bold uppercase tracking-[0.32em] text-cyan-300">
            Private area
          </p>
          <h1 className="mt-5 text-5xl font-black leading-[0.98] tracking-[-0.045em] sm:text-6xl">
            Run every
            <span className="block bg-gradient-to-r from-cyan-300 via-sky-400 to-fuchsia-400 bg-clip-text text-transparent">
              subscription.
            </span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-slate-400">
            Manage users, expiry dates, connection limits, and Xtream or M3U
            playlists from one private dashboard.
          </p>

          <div className="mt-10 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
            {[
              "JSON-backed storage",
              "Bearer sessions, no cookies",
              "Encrypted playlist secrets",
              "Netlify Blobs in production",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="admin-card w-full p-6 sm:p-8">
          {!status ? (
            <div className="flex min-h-[390px] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-300/30 border-t-cyan-300" />
            </div>
          ) : (
            <>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
                  {needsSetup ? "First-time setup" : "Secure sign in"}
                </p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight">
                  {needsSetup ? "Create owner account" : "Welcome back"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {needsSetup
                    ? "This account is stored securely in JSON and can create the first admin session."
                    : "Use your admin email and password to continue."}
                </p>
              </div>

              {needsSetup && status.configuredKey === false ? (
                <div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/[0.07] p-3 text-xs leading-5 text-amber-200">
                  Set <code className="font-bold">ADMIN_SETUP_KEY</code> in the
                  Netlify environment before creating the owner account.
                </div>
              ) : null}

              <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
                {needsSetup ? (
                  <>
                    <div>
                      <label className="admin-label" htmlFor="name">
                        Your name
                      </label>
                      <input
                        id="name"
                        className="admin-input"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        autoComplete="name"
                        required
                        minLength={2}
                      />
                    </div>
                    <div>
                      <label className="admin-label" htmlFor="setupKey">
                        Setup key
                      </label>
                      <input
                        id="setupKey"
                        className="admin-input"
                        type="password"
                        value={setupKey}
                        onChange={(event) => setSetupKey(event.target.value)}
                        autoComplete="off"
                        required
                      />
                    </div>
                  </>
                ) : null}

                <div>
                  <label className="admin-label" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    className="admin-input"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>

                <div>
                  <label className="admin-label" htmlFor="password">
                    Password
                  </label>
                  <input
                    id="password"
                    className="admin-input"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete={needsSetup ? "new-password" : "current-password"}
                    required
                    minLength={needsSetup ? 10 : 1}
                  />
                  {needsSetup ? (
                    <p className="mt-2 text-xs text-slate-500">
                      At least 10 characters. Stored as a salted scrypt hash.
                    </p>
                  ) : null}
                </div>

                {error ? (
                  <div className="rounded-xl border border-rose-300/20 bg-rose-300/[0.07] p-3 text-sm text-rose-200">
                    {error}
                  </div>
                ) : null}

                <button
                  className="btn-primary mt-2 w-full py-3"
                  type="submit"
                  disabled={busy || (needsSetup && !status.configuredKey)}
                >
                  {busy
                    ? "Please wait..."
                    : needsSetup
                      ? "Create owner account"
                      : "Sign in"}
                </button>
              </form>

              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5 text-xs text-slate-500">
                <span>Session expires after 12 hours</span>
                <Link className="text-slate-300 hover:text-white" href="/">
                  Back to site
                </Link>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
