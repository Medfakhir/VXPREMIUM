import type { Metadata } from "next";
import Link from "next/link";
import PortalLoginForm from "@/components/portal/PortalLoginForm";

export const metadata: Metadata = {
  title: "Device portal | VX Premium",
  description:
    "Sign in with your player MAC address and DEVICE KEY to manage your playlists.",
  robots: {
    index: false,
    follow: false,
  },
};

const steps = [
  {
    number: "01",
    title: "Open your player",
    text: "The activation screen shows a MAC address and a 6-digit DEVICE KEY.",
  },
  {
    number: "02",
    title: "Sign in here",
    text: "Enter both codes and the characters shown in the human check.",
  },
  {
    number: "03",
    title: "Add playlists",
    text: "Add Xtream or M3U sources, then sync the player to load them.",
  },
];

export default function PortalLoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05070d] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(34,211,238,0.16),transparent_34%),radial-gradient(circle_at_88%_18%,rgba(217,70,239,0.12),transparent_30%),linear-gradient(to_bottom,transparent,#05070d_88%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:64px_64px]" />

      <div className="relative mx-auto grid min-h-screen w-full max-w-6xl items-center gap-12 px-6 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-10">
        <section className="max-w-xl">
          <header className="flex items-center justify-between gap-4">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 text-sm font-black text-cyan-200">
                VX
              </span>
              <span>
                <span className="block text-sm font-bold tracking-[0.22em]">
                  VX PREMIUM
                </span>
                <span className="block text-xs text-slate-400">
                  Device portal
                </span>
              </span>
            </Link>
            <Link
              href="/activate"
              className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-cyan-300/30 hover:text-white"
            >
              Activate
            </Link>
          </header>

          <p className="mt-14 text-xs font-bold uppercase tracking-[0.32em] text-cyan-300">
            Your device, your sources
          </p>
          <h1 className="mt-5 text-5xl font-black leading-[0.98] tracking-[-0.045em] sm:text-6xl">
            Add and manage
            <span className="block bg-gradient-to-r from-cyan-300 via-sky-400 to-fuchsia-400 bg-clip-text text-transparent">
              your playlists.
            </span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-slate-400">
            Sign in with the same MAC address and DEVICE KEY your player uses.
            You can add multiple Xtream or M3U sources to this device account.
          </p>

          <div className="mt-10 space-y-4">
            {steps.map((step) => (
              <div key={step.number} className="flex gap-4">
                <span className="mt-0.5 font-mono text-xs font-bold text-cyan-300/70">
                  {step.number}
                </span>
                <div>
                  <h2 className="text-sm font-bold text-white">{step.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {step.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] p-4 text-sm leading-6 text-cyan-100/70">
            Your access expiry is controlled by your provider. If the player
            says <strong>Waiting for activation</strong>, contact your provider
            and confirm the MAC address on file.
          </div>
        </section>

        <section className="admin-card w-full p-6 sm:p-8">
          <PortalLoginForm />
        </section>
      </div>
    </main>
  );
}
