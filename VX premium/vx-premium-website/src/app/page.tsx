import Link from "next/link";

const features = [
  {
    label: "Xtream",
    text: "Native playlist sign-in with server, username, and password.",
  },
  {
    label: "M3U + EPG",
    text: "Import playlist and guide URLs without extra configuration.",
  },
  {
    label: "Remote admin",
    text: "Manage activations, subscriptions, devices, and playlists.",
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05070d] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.16),transparent_35%),radial-gradient(circle_at_85%_15%,rgba(217,70,239,0.14),transparent_32%),linear-gradient(to_bottom,transparent,#05070d_85%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:64px_64px]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 sm:px-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 text-sm font-black tracking-tight text-cyan-200">
              VX
            </div>
            <div>
              <p className="text-sm font-bold tracking-[0.22em] text-white">VX PREMIUM</p>
              <p className="text-xs text-slate-400">Streaming control center</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-200 sm:inline-flex">
              Platform online
            </span>
            <Link
              href="/activate"
              className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3.5 py-1.5 text-xs font-semibold text-cyan-100 transition hover:border-cyan-300/50 hover:text-white"
            >
              Activate device
            </Link>
            <Link
              href="/admin"
              className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-cyan-300/30 hover:text-white"
            >
              Admin
            </Link>
          </div>
        </header>

        <section className="flex flex-1 flex-col justify-center py-20">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300">
            Playlists. Subscriptions. Devices.
          </p>
          <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.04em] sm:text-7xl lg:text-8xl">
            One place to run
            <span className="block bg-gradient-to-r from-cyan-300 via-sky-400 to-fuchsia-400 bg-clip-text text-transparent">
              your streaming service.
            </span>
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            A clean foundation for playlist access, activation, subscriptions, and
            remote user control from a single admin dashboard.
          </p>

          <div className="mt-12 grid gap-3 sm:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.label}
                className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur"
              >
                <h2 className="text-sm font-bold text-cyan-200">{feature.label}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <footer className="flex flex-col gap-2 border-t border-white/10 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>VX Premium</p>
          <p>Netlify deployment / JSON storage online</p>
        </footer>
      </div>
    </main>
  );
}
